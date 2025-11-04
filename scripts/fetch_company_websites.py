#!/usr/bin/env python3
"""
Script to fetch company websites and update the CSV file.
Uses DuckDuckGo search to find company websites.
"""

import csv
import time
import re
from pathlib import Path

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent
CSV_FILE = ROOT / 'h1b_companies_roles.csv'

def search_company_website(company_name):
    """
    Search for company website using DuckDuckGo.
    Returns the first result URL.
    """
    try:
        # Clean company name for search
        # Remove common suffixes
        search_query = re.sub(r'\s+(INC|LLC|CORP|LP|LTD|LLP|CO|US|USA|LLC D/B/A.*?)$', '', company_name, flags=re.IGNORECASE)
        search_query = re.sub(r'^The\s+', '', search_query, flags=re.IGNORECASE)
        
        # Use DuckDuckGo HTML search
        search_url = f'https://html.duckduckgo.com/html/?q={search_query}'
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
        
        response = requests.get(search_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Look for result links
        results = soup.find_all('a', class_='result__a')
        
        if results:
            # Get first result
            first_result = results[0].get('href', '')
            
            # Clean up DuckDuckGo redirect
            if 'duckduckgo.com/l/?uddg=' in first_result:
                import urllib.parse
                parsed = urllib.parse.urlparse(first_result)
                if parsed.query:
                    unparsed = urllib.parse.parse_qs(parsed.query).get('uddg', [''])[0]
                    if unparsed:
                        first_result = urllib.parse.unquote(unparsed)
            
            # Validate it's a proper URL
            if first_result.startswith('http'):
                return first_result
        
        return ''
    except Exception as e:
        print(f"    Error searching for {company_name}: {e}")
        return ''

def update_csv():
    """Read CSV, fetch missing websites, and update the file."""
    
    # Read all rows
    rows = []
    companies_to_fetch = []
    
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames
        
        for i, row in enumerate(reader):
            company = row['Company Name']
            website = row['Website']
            
            # Store the row
            rows.append(row)
            
            # If no website, add to fetch list
            if not website or website.strip() == '':
                companies_to_fetch.append(i)
    
    print(f'Found {len(companies_to_fetch)} companies without websites out of {len(rows)} total')
    print(f'Fetching websites...\n')
    
    # Fetch websites for companies without them
    for idx, row_idx in enumerate(companies_to_fetch, 1):
        company = rows[row_idx]['Company Name']
        print(f'[{idx}/{len(companies_to_fetch)}] Searching for: {company}')
        
        website = search_company_website(company)
        
        if website:
            rows[row_idx]['Website'] = website
            print(f'  ✓ Found: {website}')
        else:
            print(f'  ✗ Not found')
        
        # Be nice to the server
        time.sleep(1)
    
    # Write updated CSV
    print(f'\nWriting updated CSV...')
    with open(CSV_FILE, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f'Done! Updated {CSV_FILE}')

if __name__ == '__main__':
    update_csv()

