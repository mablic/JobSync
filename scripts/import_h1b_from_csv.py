#!/usr/bin/env python3
"""
Import H1B companies and roles from CSV file into Firestore.

The CSV is pipe-delimited with format:
  Company Name | Website | Role 1 | Role 2 | Role 3 | Role 4 | Role 5

Usage:
  python scripts/import_h1b_from_csv.py --limit 5
"""

from __future__ import annotations

import argparse
import json
import time
from pathlib import Path
from typing import List, Tuple

from google.cloud import firestore
from google.oauth2 import service_account


ROOT = Path(__file__).resolve().parent
SERVICE_JSON = ROOT / 'services.json'
CSV_FILE = ROOT / 'h1b_companies_roles_updates.csv'


def load_credentials():
    with open(SERVICE_JSON, 'r') as f:
        data = json.load(f)
    creds = service_account.Credentials.from_service_account_info(data)
    return creds, data.get('project_id')


def now_ms() -> int:
    return int(time.time() * 1000)


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


def parse_csv_row(line: str) -> Tuple[str, str, List[str]] | None:
    """
    Parse a pipe-delimited CSV row.
    Returns: (company_name, website, [role1, role2, ...]) or None if invalid
    """
    line = line.strip()
    if not line or not line.startswith('|'):
        return None
    
    # Split by pipe and strip whitespace from each field
    parts = [p.strip() for p in line.split('|')]
    
    # Remove empty first and last elements (markdown table formatting)
    if parts and parts[0] == '':
        parts = parts[1:]
    if parts and parts[-1] == '':
        parts = parts[:-1]
    
    # Need at least company name (column 1)
    if len(parts) < 1:
        return None
    
    company_name = parts[0].strip()
    website = parts[1].strip() if len(parts) > 1 else ''
    roles = []
    
    # Extract up to 5 roles (columns 3-7, which are indices 2-6)
    for i in range(2, min(7, len(parts))):
        role = parts[i].strip()
        if role:  # Only add non-empty roles
            roles.append(role)
    
    return (company_name, website, roles)


def read_csv_data(limit: int | None = None) -> List[Tuple[str, str, List[str]]]:
    """
    Read CSV file and return list of (company_name, website, roles).
    Skips header line.
    """
    companies = []
    
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Skip header line (first line)
    # Data starts at line 2 (index 1)
    data_lines = lines[1:]
    
    for line in data_lines:
        parsed = parse_csv_row(line)
        if parsed:
            company_name, website, roles = parsed
            if company_name:  # Only add if company name exists
                companies.append((company_name, website, roles))
                if limit and len(companies) >= limit:
                    break
    
    return companies


def insert_companies_and_roles(db: firestore.Client, companies: List[Tuple[str, str, List[str]]]):
    """
    Insert companies and their roles into Firestore.
    
    Args:
        db: Firestore client
        companies: List of (company_name, website, [role1, role2, ...])
    """
    comp_col = db.collection('h1b_companies')
    role_col = db.collection('h1b_company_roles')
    
    created_companies = 0
    created_roles = 0
    
    for company_name, website, roles in companies:
        # Create company document
        comp_ref = comp_col.document()
        comp_doc = {
            'name': company_name,
            'website': website if website else None,
            'vote_users': {},
            'roles': [],  # Will be populated with role IDs
            'createdAt': now_ms(),
            'lastVoteAt': None,
            'sourceUrl': None,  # CSV source
        }
        comp_ref.set(comp_doc)
        created_companies += 1
        
        # Create role documents
        role_ids = []
        for role_title in roles:
            role_ref = role_col.document()
            role_doc = {
                'companyId': comp_ref.id,
                'title': role_title,
                'location': '',  # CSV doesn't have location data
                'jobLink': None,  # CSV doesn't have job links
                'vote_users': {},
                'createdAt': now_ms(),
                'lastVoteAt': None,
                'sourceUrl': None,  # CSV source
            }
            role_ref.set(role_doc)
            role_ids.append(role_ref.id)
            created_roles += 1
        
        # Update company with role IDs
        comp_ref.update({'roles': role_ids})
        
        print(f'  ✓ {company_name}: {len(roles)} roles')
    
    print(f'\n  Created {created_companies} companies and {created_roles} roles')


def main():
    parser = argparse.ArgumentParser(description='Import H1B companies and roles from CSV')
    parser.add_argument('--limit', type=int, default=None, help='Limit number of companies to import (default: all)')
    parser.add_argument('--clear', action='store_true', help='Clear existing data before importing')
    args = parser.parse_args()
    
    print(f'Reading CSV file: {CSV_FILE}')
    companies = read_csv_data(limit=args.limit)
    print(f'Found {len(companies)} companies to import')
    
    if not companies:
        print('No companies found in CSV. Exiting.')
        return
    
    print('\nLoading Firestore credentials...')
    creds, project_id = load_credentials()
    db = firestore.Client(project=project_id, credentials=creds)
    
    if args.clear:
        print('\nClearing existing data...')
        clear_collections(db)
    
    print('\nInserting companies and roles...')
    insert_companies_and_roles(db, companies)
    
    print('\n✓ Import completed!')


if __name__ == '__main__':
    main()

