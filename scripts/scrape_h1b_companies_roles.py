#!/usr/bin/env python3
"""
Scrape top 5 companies with H‑1B filings and for each, scrape up to top 5 role titles
from the company page on h1bdata.info. Cleans Firestore collections first, then inserts
into:
  - h1b_companies
  - h1b_company_roles

Source index: https://h1bdata.info/topcompanies.php

Notes
- The site reflects historical LCAs; this implies sponsorship at company level.
- Role titles are inferred by frequency on the company page; location/job link may be absent.

Usage:
  python scripts/scrape_h1b_companies_roles.py --companies 5 --roles 5
"""

from __future__ import annotations

import argparse
import collections
import json
import re
import time
from pathlib import Path
from typing import Dict, List, Tuple

import requests
from bs4 import BeautifulSoup
from google.cloud import firestore
from google.oauth2 import service_account


ROOT = Path(__file__).resolve().parent
SERVICE_JSON = ROOT / 'services.json'
INDEX_URL = 'https://h1bdata.info/topcompanies.php'


def load_credentials():
  with open(SERVICE_JSON, 'r') as f:
    data = json.load(f)
  creds = service_account.Credentials.from_service_account_info(data)
  return creds, data.get('project_id')


def now_ms() -> int:
  return int(time.time() * 1000)


def fetch_top_companies(limit: int | None = None) -> List[Tuple[str, str]]:
  resp = requests.get(INDEX_URL, timeout=30)
  resp.raise_for_status()
  soup = BeautifulSoup(resp.text, 'html.parser')
  table = soup.find('table')
  rows = table.find_all('tr') if table else []
  results: List[Tuple[str, str]] = []
  for tr in rows[1:]:
    tds = tr.find_all('td')
    if len(tds) < 2:
      continue
    a = tds[1].find('a')
    if not a:
      continue
    name = a.get_text(strip=True)
    href = a.get('href') or ''
    url = requests.compat.urljoin(INDEX_URL, href)
    results.append((name, url))
    if limit and len(results) >= limit:
      break
  return results


def fetch_top_roles_for_company(company_url: str, limit: int) -> List[str]:
  """
  Parse the company page and return top role titles by frequency.
  The company page lists LCAs; titles appear in a table column.
  """
  resp = requests.get(company_url, timeout=25)
  resp.raise_for_status()
  soup = BeautifulSoup(resp.text, 'html.parser')

  # Heuristic: find all table rows with columns that include a job title.
  # On h1bdata, the list pages typically have a table; titles are often in a column
  # labelled 'Job Title' or similar.
  table = soup.find('table')
  if not table:
    return []

  # Identify the title column index from header if present
  header = table.find('tr')
  title_idx = None
  if header:
    ths = [th.get_text(strip=True).lower() for th in header.find_all(['th','td'])]
    for i, text in enumerate(ths):
      if 'job' in text and 'title' in text:
        title_idx = i
        break

  counts = collections.Counter()
  for tr in table.find_all('tr')[1:]:
    cells = tr.find_all('td')
    if not cells:
      continue
    if title_idx is not None and title_idx < len(cells):
      title = cells[title_idx].get_text(strip=True)
    else:
      # fallback: use 3rd column commonly being title
      col = 2 if len(cells) > 2 else 0
      if col >= len(cells):
        continue
      title = cells[col].get_text(strip=True)
    if title:
      # Normalize title
      title = re.sub(r'\s+', ' ', title)
      counts[title] += 1

  return [t for t, _ in counts.most_common(limit)]


def clear_collections(db: firestore.Client):
  """Delete all documents in collections (handles pagination)"""
  for col_name in ('h1b_company_roles', 'h1b_companies'):
    col = db.collection(col_name)
    deleted = 0
    while True:
      docs = list(col.limit(500).stream())
      if not docs:
        break
      batch = db.batch()
      for doc in docs:
        batch.delete(doc.reference)
        deleted += 1
      batch.commit()
      if len(docs) < 500:
        break
    print(f'  Cleared {col_name}: {deleted} docs')


def upsert(db: firestore.Client, companies: List[Tuple[str, str]], top_roles: Dict[str, List[str]]):
  comp_col = db.collection('h1b_companies')
  role_col = db.collection('h1b_company_roles')
  
  total = len(companies)
  created = 0
  updated = 0

  for idx, (name, src_url) in enumerate(companies, 1):
    if idx % 50 == 0:
      print(f'  Progress: {idx}/{total} companies...')
    
    # Check if company exists
    q = comp_col.where('name', '==', name).limit(1).get()
    existing = list(q)
    
    if existing:
      comp_ref = existing[0].reference
      comp_doc = existing[0].to_dict()
      existing_role_ids = comp_doc.get('roles', [])
      # Preserve existing votes
      vote_users = comp_doc.get('vote_users', {})
      updated += 1
    else:
      comp_ref = comp_col.document()
      comp_ref.set({
        'name': name,
        'website': None,
        'vote_users': {},
        'roles': [],
        'createdAt': now_ms(),
        'lastVoteAt': None,
        'sourceUrl': src_url,
      })
      existing_role_ids = []
      vote_users = {}
      created += 1

    # Add/update roles (limit to top 5)
    role_ids = list(existing_role_ids)
    titles_to_add = top_roles.get(name, [])[:5]
    
    for title in titles_to_add:
      # Check if role already exists for this company
      existing_role = None
      for rid in existing_role_ids:
        rdoc = role_col.document(rid).get()
        if rdoc.exists and rdoc.to_dict().get('title') == title:
          existing_role = rdoc
          break
      
      if not existing_role:
        r_ref = role_col.document()
        r_ref.set({
          'companyId': comp_ref.id,
          'title': title,
          'location': '',
          'jobLink': None,
          'vote_users': {},
          'createdAt': now_ms(),
          'lastVoteAt': None,
          'sourceUrl': src_url,
        })
        role_ids.append(r_ref.id)

    comp_ref.update({ 
      'roles': role_ids,
      'vote_users': vote_users,
      'sourceUrl': src_url 
    })

  print(f'\n  Created: {created}, Updated: {updated}, Total: {total}')


def main():
  parser = argparse.ArgumentParser(description='Scrape all companies and top roles per company')
  parser.add_argument('--companies', type=int, default=None, help='Limit number of companies (default: all)')
  parser.add_argument('--roles', type=int, default=5, help='Max roles per company')
  parser.add_argument('--clear', action='store_true', help='Clear existing data before importing')
  args = parser.parse_args()

  creds, project_id = load_credentials()
  client = firestore.Client(project=project_id, credentials=creds)

  if args.clear:
    print('Clearing existing data...')
    clear_collections(client)

  print(f'\nFetching companies from {INDEX_URL}...')
  companies = fetch_top_companies(args.companies)
  print(f'Found {len(companies)} companies')
  
  print('\nFetching roles for each company...')
  role_map: Dict[str, List[str]] = {}
  for idx, (name, url) in enumerate(companies, 1):
    if idx % 10 == 0:
      print(f'  Processing company {idx}/{len(companies)}...')
    try:
      titles = fetch_top_roles_for_company(url, args.roles)
      role_map[name] = titles
      time.sleep(0.5)  # Be nice to the server
    except Exception as e:
      print(f'  Warning: Failed to fetch roles for {name}: {e}')
      role_map[name] = []

  print('\nInserting into Firestore...')
  upsert(client, companies, role_map)
  
  print('\nSummary:')
  total_roles = sum(len(roles) for roles in role_map.values())
  print(f'  Companies: {len(companies)}')
  print(f'  Total roles: {total_roles}')


if __name__ == '__main__':
  main()


