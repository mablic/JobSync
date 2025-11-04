#!/usr/bin/env python3
"""
Scrape the H1B Data "Companies with Most H-1B Filings" page and upsert
companies into Firestore (h1b_companies), marking them as sponsorship-supporting.

Source: https://h1bdata.info/topcompanies.php

Notes
- The page lists companies with historical H‑1B filings, which implies they sponsor.
- Role-level sponsorship is not available on this page; we seed only companies.
- Service account is read from scripts/services.json (same as the seeding script).

Usage:
  python scripts/scrape_h1b_top_companies.py --limit 200

Dependencies (install in a venv):
  pip install requests beautifulsoup4 google-cloud-firestore google-auth
"""

from __future__ import annotations

import argparse
import json
import time
from pathlib import Path
from typing import List, Tuple

import requests
from bs4 import BeautifulSoup
from google.cloud import firestore
from google.oauth2 import service_account


ROOT = Path(__file__).resolve().parent
SERVICE_JSON = ROOT / 'services.json'
SOURCE_URL = 'https://h1bdata.info/topcompanies.php'


def load_credentials():
  with open(SERVICE_JSON, 'r') as f:
    data = json.load(f)
  creds = service_account.Credentials.from_service_account_info(data)
  return creds, data.get('project_id')


def fetch_top_companies(limit: int | None = None) -> List[Tuple[str, str]]:
  """
  Return list of (company_name, company_page_url) from the table.
  """
  resp = requests.get(SOURCE_URL, timeout=20)
  resp.raise_for_status()
  soup = BeautifulSoup(resp.text, 'html.parser')

  table = soup.find('table')
  if not table:
    return []

  rows = table.find_all('tr')
  results: List[Tuple[str, str]] = []
  for tr in rows[1:]:  # skip header
    tds = tr.find_all('td')
    if len(tds) < 2:
      continue
    # 2nd column contains link with company title
    a = tds[1].find('a')
    if not a:
      continue
    name = a.get_text(strip=True)
    href = a.get('href') or ''
    url = requests.compat.urljoin(SOURCE_URL, href)
    results.append((name, url))
    if limit and len(results) >= limit:
      break
  return results


def now_ms() -> int:
  return int(time.time() * 1000)


def upsert_companies(db: firestore.Client, companies: List[Tuple[str, str]]):
  """
  Upsert into h1b_companies with fields:
    name, website=None, vote_users={}, roles=[], createdAt (ms), lastVoteAt=None
  We also store sourceUrl for provenance.
  """
  batch = db.batch()
  col = db.collection('h1b_companies')

  for name, src_url in companies:
    q = col.where('name', '==', name).limit(1).get()
    if q:
      # Already exists: do nothing beyond adding sourceUrl if missing
      doc_ref = col.document(q[0].id)
      batch.update(doc_ref, { 'sourceUrl': src_url })
      continue

    doc_ref = col.document()
    batch.set(doc_ref, {
      'name': name,
      'website': None,
      'vote_users': {},
      'roles': [],
      'createdAt': now_ms(),
      'lastVoteAt': None,
      'sourceUrl': src_url,
    })

  batch.commit()


def main():
  parser = argparse.ArgumentParser(description='Scrape top companies with H‑1B filings and upsert into Firestore')
  parser.add_argument('--limit', type=int, default=200, help='Max number of companies to import')
  args = parser.parse_args()

  creds, project_id = load_credentials()
  client = firestore.Client(project=project_id, credentials=creds)

  companies = fetch_top_companies(limit=args.limit)
  if not companies:
    print('No companies parsed from page.')
    return

  upsert_companies(client, companies)
  print(f'Imported {len(companies)} companies from {SOURCE_URL}')


if __name__ == '__main__':
  main()


