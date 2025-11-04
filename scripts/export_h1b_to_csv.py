#!/usr/bin/env python3
"""
Scrape the H1B Data website and export company names with their top 5 roles to CSV.
Does NOT insert into Firebase database, only creates a CSV file.

Source: https://h1bdata.info/topcompanies.php

Usage:
  python scripts/export_h1b_to_csv.py
"""

from __future__ import annotations

import argparse
import collections
import csv
import re
import time
from pathlib import Path
from typing import List, Tuple

import requests
from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parent
INDEX_URL = 'https://h1bdata.info/topcompanies.php'

# Map of company names to their websites
COMPANY_WEBSITES = {
    'COGNIZANT TECHNOLOGY SOLUTIONS US CORP': 'https://www.cognizant.com',
    'AMAZONCOM SERVICES LLC': 'https://www.amazon.com',
    'GOOGLE LLC': 'https://www.google.com',
    'TATA CONSULTANCY SERVICES LIMITED': 'https://www.tcs.com',
    'ERNST & YOUNG US LLP': 'https://www.ey.com',
    'MICROSOFT CORPORATION': 'https://www.microsoft.com',
    'INFOSYS LIMITED': 'https://www.infosys.com',
    'APPLE INC': 'https://www.apple.com',
    'DELOITTE CONSULTING LLP': 'https://www.deloitte.com',
    'CAPGEMINI AMERICA INC': 'https://www.capgemini.com',
    'ACCENTURE LLP': 'https://www.accenture.com',
    'HCL AMERICA INC': 'https://www.hcltech.com',
    'AMAZON WEB SERVICES INC': 'https://aws.amazon.com',
    'META PLATFORMS INC': 'https://www.meta.com',
    'INTEL CORPORATION': 'https://www.intel.com',
    'WAL-MART ASSOCIATES INC': 'https://www.walmart.com',
    'JPMORGAN CHASE & CO': 'https://www.jpmorganchase.com',
    'WIPRO LIMITED': 'https://www.wipro.com',
    'IBM CORPORATION': 'https://www.ibm.com',
    'QUALCOMM TECHNOLOGIES INC': 'https://www.qualcomm.com',
    'FACEBOOK INC': 'https://www.facebook.com',
    'COMPUNNEL SOFTWARE GROUP INC': 'https://www.compunnel.com',
    'TECH MAHINDRA (AMERICAS) INC': 'https://www.techmahindra.com',
    'CISCO SYSTEMS INC': 'https://www.cisco.com',
    'DELOITTE & TOUCHE LLP': 'https://www.deloitte.com',
    'AMAZON DEVELOPMENT CENTER US INC': 'https://www.amazon.jobs',
    'INTERNATIONAL BUSINESS MACHINES CORPORATION': 'https://www.ibm.com',
    'MPHASIS CORPORATION': 'https://www.mphasis.com',
    'TESLA INC': 'https://www.tesla.com',
    'GOLDMAN SACHS & CO LLC': 'https://www.goldmansachs.com',
    'FIDELITY TECHNOLOGY GROUP LLC': 'https://www.fidelity.com',
    'LINKEDIN CORPORATION': 'https://www.linkedin.com',
    'LTIMINDTREE LIMITED': 'https://www.ltimindtree.com',
    'SALESFORCE INC': 'https://www.salesforce.com',
    'CITIBANK NA': 'https://www.citigroup.com',
    'LARSEN & TOUBRO INFOTECH LIMITED': 'https://www.lntinfotech.com',
    'PRICEWATERHOUSECOOPERS ADVISORY SERVICES LLC': 'https://www.pwc.com',
    'PAYPAL INC': 'https://www.paypal.com',
    'ORACLE AMERICA INC': 'https://www.oracle.com',
    'SALESFORCECOM INC': 'https://www.salesforce.com',
    'ATOS SYNTEL INC': 'https://atos.net',
    'NVIDIA CORPORATION': 'https://www.nvidia.com',
    'TEKORG INC': 'https://www.tekorg.com',
    'ADOBE INC': 'https://www.adobe.com',
    'UBER TECHNOLOGIES INC': 'https://www.uber.com',
    'L&T TECHNOLOGY SERVICES LIMITED': 'https://www.ltts.com',
    'CUMMINS INC': 'https://www.cummins.com',
    'EBAY INC': 'https://www.ebay.com',
    'RANDSTAD TECHNOLOGIES LLC': 'https://www.randstadusa.com',
    'SYNECHRON INC': 'https://www.synechron.com',
}


def normalize_company_name(name: str) -> str:
  """Convert company name from ALL CAPS to Title Case."""
  suffixes = ['LLC', 'INC', 'CORP', 'LP', 'LTD', 'LLP', 'CO', 'US']
  parts = name.split()
  normalized = []
  
  for part in parts:
    clean_part = part.replace('.', '')
    if clean_part.upper() in suffixes:
      normalized.append(clean_part.upper())
    else:
      normalized.append(clean_part.title())
  
  result = ' '.join(normalized)
  replacements = {
    'Ibm': 'IBM',
    'Usa': 'USA',
    'Us': 'US',
    'Ai': 'AI',
    'Ml': 'ML',
    'Apis': 'APIs',
    'Api': 'API',
    'Ios': 'iOS',
    'Android': 'Android',
    'Sql': 'SQL',
    'Devops': 'DevOps',
    'Sre': 'SRE',
    'Qa': 'QA',
  }
  for old, new in replacements.items():
    result = result.replace(old, new)
  return result


def clean_role_title(title: str) -> str:
  """Clean role titles by removing codes and making them readable."""
  # Remove codes like JC50, JC60, L1, etc.
  title = re.sub(r'\bJC\d+\b', '', title)
  title = re.sub(r'\bL\d+\b', '', title)
  title = re.sub(r'LEVEL\s*\d+', '', title, flags=re.IGNORECASE)
  title = re.sub(r'^\s*\d+\s*$', '', title)
  title = re.sub(r'\b\d+$', '', title)
  
  # Fix abbreviations
  title = re.sub(r'\bSA\s+', 'Senior ', title, flags=re.IGNORECASE)
  title = re.sub(r'\bMGR\.', 'Manager', title, flags=re.IGNORECASE)
  
  # Clean up spaces
  title = re.sub(r'\s+', ' ', title)
  title = title.strip()
  
  # Title case the result
  result = title.title()
  
  # Handle special cases
  special_cases = {
    'Sr ': 'Senior ',
    'Jr ': 'Junior ',
    'Qa ': 'QA ',
    'Devops': 'DevOps',
    'Ios': 'iOS',
    'Android': 'Android',
    'Sql': 'SQL',
    'Api': 'API',
    'Apis': 'APIs',
    'Sre': 'SRE',
    'Ii ': '',
    'Iii ': '',
    'Iv ': 'IV ',
    'Ii$': '',
    'Iii$': '',
    'Ii,': '',
    'Iii,': '',
    'Mts ': 'Member of Technical Staff ',
    'Smts ': 'Senior Member of Technical Staff ',
    'Lmts ': 'Lead Member of Technical Staff ',
    'Pmts ': 'Principal Member of Technical Staff ',
    'App ': 'Applications ',
  }
  for old, new in special_cases.items():
    result = re.sub(re.escape(old), new, result, flags=re.IGNORECASE)
  
  # Remove roman numerals
  result = re.sub(r' - (III|IV)$', '', result, flags=re.IGNORECASE)
  result = re.sub(r' (III|IV)$', '', result, flags=re.IGNORECASE)
  result = re.sub(r'\bIii\b', '', result)
  result = re.sub(r'\bIiv\b', 'IV', result)
  result = re.sub(r'\bIv\b', 'IV', result)
  result = re.sub(r'\bIi\b', '', result)
  result = re.sub(r'\s+I\s*$', '', result, flags=re.IGNORECASE)
  result = re.sub(r'^\s*[-,\s]+\s*', '', result)
  result = re.sub(r'\s*[-,\s]+\s*$', '', result)
  result = re.sub(r'\s+', ' ', result)
  return result.strip()


def fetch_top_companies(limit: int | None = None) -> List[Tuple[str, str]]:
  """Return list of (company_name, company_page_url) from the table."""
  resp = requests.get(INDEX_URL, timeout=30)
  resp.raise_for_status()
  soup = BeautifulSoup(resp.text, 'html.parser')  # Use lxml for speed if available
  
  table = soup.find('table')
  if not table:
    return []
  
  rows = table.find_all('tr')
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
  """Parse the company page and return top role titles by frequency."""
  try:
    resp = requests.get(company_url, timeout=5)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, 'html.parser')
    
    table = soup.find('table')
    if not table:
      return []
    
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
        col = 2 if len(cells) > 2 else 0
        if col >= len(cells):
          continue
        title = cells[col].get_text(strip=True)
      if title:
        cleaned_title = clean_role_title(title)
        if cleaned_title:
          counts[cleaned_title] += 1
    
    return [t for t, _ in counts.most_common(limit)]
  except Exception as e:
    print(f"    Error fetching roles: {e}")
    return []


def export_to_csv(companies: List[Tuple[str, str]], top_roles: dict[str, List[str]], output_file: str):
  """Export companies and their roles to CSV file."""
  output_path = ROOT / output_file
  
  with open(output_path, 'w', newline='', encoding='utf-8') as f:
    headers = ['Company Name', 'Website', 'Role 1', 'Role 2', 'Role 3', 'Role 4', 'Role 5']
    writer = csv.writer(f)
    writer.writerow(headers)
    
    for company_name_upper, _ in companies:
      company_name = normalize_company_name(company_name_upper)
      website = COMPANY_WEBSITES.get(company_name_upper, '')
      roles = top_roles.get(company_name_upper, [])
      row = [company_name, website] + roles[:5] + [''] * max(0, 5 - len(roles))
      writer.writerow(row)
  
  print(f'CSV file created: {output_path}')


def main():
  parser = argparse.ArgumentParser(description='Export H1B companies and roles to CSV')
  parser.add_argument('--limit', type=int, default=None, help='Max number of companies to fetch')
  parser.add_argument('--roles', type=int, default=5, help='Max roles per company')
  parser.add_argument('--output', type=str, default='h1b_companies_roles.csv', help='Output CSV filename')
  args = parser.parse_args()
  
  print('Step 1: Fetching all companies from h1bdata.info...')
  companies = fetch_top_companies(limit=args.limit)
  print(f'Found {len(companies)} companies\n')
  
  if not companies:
    print('No companies found. Exiting.')
    return
  
  print(f'Step 2: Fetching top {args.roles} roles for each company...')
  role_map: dict[str, List[str]] = {}
  total = len(companies)
  
  start_time = time.time()
  for idx, (name, url) in enumerate(companies, 1):
    print(f'  [{idx}/{total}] {name[:50]}...', flush=True)
    titles = fetch_top_roles_for_company(url, args.roles)
    role_map[name] = titles
    
    if idx % 50 == 0:
      elapsed = time.time() - start_time
      rate = idx / elapsed
      remaining = (total - idx) / rate if rate > 0 else 0
      print(f'  Progress: {idx}/{total} companies ({int(rate)}/sec, ~{int(remaining)}s remaining)')
  
  elapsed = time.time() - start_time
  print(f'\nCompleted in {int(elapsed)}s\n')
  
  print('Step 3: Exporting to CSV...')
  export_to_csv(companies, role_map, args.output)
  
  print('\nSummary:')
  total_roles = sum(len(roles) for roles in role_map.values())
  print(f'  Companies: {len(companies)}')
  print(f'  Total roles: {total_roles}')
  print(f'  Output file: {args.output}')


if __name__ == '__main__':
  main()
