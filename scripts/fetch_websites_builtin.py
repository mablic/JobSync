#!/usr/bin/env python3
"""
Script to fetch company websites using only built-in Python libraries.
"""

import csv
import urllib.request
import urllib.parse
import time
import re
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CSV_FILE = ROOT / 'h1b_companies_roles.csv'

class LinkParser(HTMLParser):
    """Parse HTML to extract links from DuckDuckGo search results."""
    def __init__(self):
        super().__init__()
        self.links = []
        self.in_result = False
        
    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            for attr_name, attr_value in attrs:
                if attr_name == 'class' and 'result__a' in attr_value:
                    self.in_result = True
                if attr_name == 'href' and self.in_result:
                    self.links.append(attr_value)
                    self.in_result = False

def search_company_website(company_name):
    """Search for company website using DuckDuckGo."""
    try:
        # Clean company name for search
        search_query = re.sub(r'\s+(INC|LLC|CORP|LP|LTD|LLP|CO|US|USA|LLC D/B/A.*?)$', '', company_name, flags=re.IGNORECASE)
        search_query = re.sub(r'^The\s+', '', search_query, flags=re.IGNORECASE)
        
        # Encode search query
        encoded_query = urllib.parse.quote(search_query)
        
        # Use DuckDuckGo HTML search
        search_url = f'https://html.duckduckgo.com/html/?q={encoded_query}'
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
        
        req = urllib.request.Request(search_url, headers=headers)
        response = urllib.request.urlopen(req, timeout=10)
        html = response.read().decode('utf-8')
        
        # Parse HTML
        parser = LinkParser()
        parser.feed(html)
        
        # Extract first link
        if parser.links:
            first_result = parser.links[0]
            
            # Clean up DuckDuckGo redirect
            if 'duckduckgo.com/l/?uddg=' in first_result:
                parsed = urllib.parse.urlparse(first_result)
                if parsed.query:
                    query_params = urllib.parse.parse_qs(parsed.query)
                    if 'uddg' in query_params:
                        first_result = urllib.parse.unquote(query_params['uddg'][0])
            
            # Validate it's a proper URL
            if first_result.startswith('http'):
                return first_result
        
        return ''
    except Exception as e:
        print(f"    Error: {e}")
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
        
        # Save periodically (every 100 companies)
        if idx % 100 == 0:
            print(f'\nSaving progress...')
            with open(CSV_FILE, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=headers)
                writer.writeheader()
                writer.writerows(rows)
            print(f'Saved!\n')
    
    # Final save
    print(f'\nWriting final CSV...')
    with open(CSV_FILE, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f'Done! Updated {CSV_FILE}')

if __name__ == '__main__':
    update_csv()

