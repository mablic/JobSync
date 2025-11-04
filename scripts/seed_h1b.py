#!/usr/bin/env python3
"""
Seed Firestore with mock H1B data.

Requirements (install locally):
  pip install google-cloud-firestore google-auth

Usage:
  python scripts/seed_h1b.py

Reads service account credentials from scripts/services.json.
Creates 3 companies in h1b_companies and associated roles in h1b_company_roles.
"""

import json
import os
import time
from pathlib import Path
from typing import Dict

from google.cloud import firestore
from google.oauth2 import service_account


ROOT = Path(__file__).resolve().parent
SERVICE_JSON = ROOT / 'services.json'


def load_credentials():
    with open(SERVICE_JSON, 'r') as f:
        data = json.load(f)
    creds = service_account.Credentials.from_service_account_info(data)
    return creds, data.get('project_id')


def now_ts():
    # Milliseconds epoch for consistency with JS Date.now()
    return int(time.time() * 1000)


def upsert_sample_data(db: firestore.Client):
    companies = [
        {
            'name': 'Acme Corp',
            'website': 'https://acme.example.com',
        },
        {
            'name': 'Nimbus AI',
            'website': 'https://nimbus.example.com',
        },
        {
            'name': 'BlueOcean',
            'website': 'https://blueocean.example.com',
        },
    ]

    created_company_ids = []

    for company in companies:
        comp_ref = db.collection('h1b_companies').document()
        comp_doc = {
            'name': company['name'],
            'website': company.get('website'),
            'vote_users': {},  # { userId: 'yes' | 'no' }
            'roles': [],       # filled after roles are created
            'createdAt': now_ts(),
            'lastVoteAt': None,
        }
        comp_ref.set(comp_doc)
        created_company_ids.append(comp_ref.id)

    # Roles per company
    role_payloads = {
        0: [
            {'title': 'Frontend Engineer', 'location': 'Remote • US', 'jobLink': 'https://acme.example.com/jobs/fe'},
            {'title': 'Product Designer', 'location': 'NYC • Hybrid', 'jobLink': 'https://acme.example.com/jobs/pd'},
        ],
        1: [
            {'title': 'ML Engineer', 'location': 'SF • Onsite', 'jobLink': 'https://nimbus.example.com/jobs/ml'},
        ],
        2: [
            {'title': 'Data Analyst', 'location': 'Remote', 'jobLink': 'https://blueocean.example.com/jobs/da'},
            {'title': 'Platform Engineer', 'location': 'Austin • Hybrid', 'jobLink': 'https://blueocean.example.com/jobs/pe'},
        ],
    }

    # Create roles and push ids back to company docs
    for idx, company_id in enumerate(created_company_ids):
        roles = role_payloads.get(idx, [])
        role_ids = []
        for role in roles:
            role_ref = db.collection('h1b_company_roles').document()
            role_doc = {
                'companyId': company_id,
                'title': role['title'],
                'location': role['location'],
                'jobLink': role.get('jobLink'),
                'vote_users': {},  # { userId: 'yes' | 'no' }
                'createdAt': now_ts(),
                'lastVoteAt': None,
            }
            role_ref.set(role_doc)
            role_ids.append(role_ref.id)

        db.collection('h1b_companies').document(company_id).update({'roles': role_ids})

    print('Seed completed:')
    print('  Companies:', len(created_company_ids))
    print('  Roles    :', sum(len(v) for v in role_payloads.values()))


def main():
    creds, project_id = load_credentials()
    client = firestore.Client(project=project_id, credentials=creds)
    upsert_sample_data(client)


if __name__ == '__main__':
    main()


