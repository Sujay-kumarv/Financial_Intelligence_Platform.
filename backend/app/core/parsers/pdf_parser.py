"""
PDF Statement Parser
Parses financial statements from PDF files
"""
import PyPDF2
from typing import Dict, Optional, List
from datetime import datetime
import re


class PDFStatementParser:
    """
    Parses financial statements from PDF files
    Extracts text page-by-page to keep memory constrained for large files.
    """
    
    def __init__(self, file_path: str):
        self.file_path = file_path
        
    def parse(self) -> Dict[str, any]:
        """
        Parse PDF file and extract financial statement data using regex matching.
        """
        result = {
            'balance_sheet': {},
            'income_statement': {},
            'cash_flow': {},
            'metadata': {
                'file_path': self.file_path,
                'pages_processed': 0,
                'parsed_at': datetime.now().isoformat()
            }
        }
        
        try:
            pages_processed = 0
            # Track keys that still need to be found to enable early exits
            target_keys_count = 21 # rough total of keys across bs, is, and cf
            
            # Open in read-binary mode
            with open(self.file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                total_pages = len(reader.pages)
                
                # Iterate through pages one by one for memory efficiency
                for page_num in range(total_pages):
                    page = reader.pages[page_num]
                    # Extract text
                    text = page.extract_text()
                    if text:
                        self._extract_metrics_from_text(text, result)
                    pages_processed += 1
                    
                    # Early exit check: if we've found a substantial amount of data, 
                    # stop parsing thousands of remaining pages
                    current_keys = len(result['balance_sheet']) + len(result['income_statement']) + len(result['cash_flow'])
                    if current_keys >= (target_keys_count * 0.7): # If 70%+ of expected metrics are found, assume we captured the bulk sheets
                        break
                        
            
            result['metadata']['pages_processed'] = pages_processed
            
            # Additional computation for derived metrics if possible
            if 'ebit' not in result['income_statement'] and 'operating_income' in result['income_statement']:
                result['income_statement']['ebit'] = result['income_statement']['operating_income']
                
            return result
            
        except Exception as e:
            raise ValueError(f"Error parsing PDF file: {str(e)}")
            
    def _extract_metrics_from_text(self, text: str, result: Dict[str, any]):
        """
        Extract financial metrics from a page of text.
        """
        lines = text.lower().split('\n')
        
        # Mappings for identifying financial figures
        bs_mappings = {
            'current_assets': ['total current assets', 'current assets'],
            'cash_and_equivalents': ['cash and cash equivalents', 'cash and equivalents'],
            'accounts_receivable': ['accounts receivable', 'trade receivables'],
            'inventory': ['inventory', 'inventories'],
            'total_assets': ['total assets', 'total assets:'],
            'current_liabilities': ['total current liabilities', 'current liabilities'],
            'total_liabilities': ['total liabilities'],
            'total_debt': ['total debt', 'long-term debt'],
            'total_equity': ['total equity', 'shareholders equity', 'stockholders equity', "total stockholders' equity", "total shareholders' equity"],
        }
        
        is_mappings = {
            'revenue': ['total revenue', 'net revenue', 'revenue', 'net sales'],
            'cost_of_goods_sold': ['cost of goods sold', 'cost of sales', 'cost of revenue'],
            'gross_profit': ['gross profit', 'gross margin'],
            'operating_expenses': ['total operating expenses', 'operating expenses'],
            'operating_income': ['operating income', 'income from operations', 'ebit'],
            'interest_expense': ['interest expense'],
            'tax_expense': ['income tax expense', 'provision for income taxes'],
            'net_income': ['net income', 'net loss', 'net profit'],
        }
        
        cf_mappings = {
            'operating_cash_flow': ['net cash provided by operating activities', 'cash from operating activities', 'operating cash flow'],
            'investing_cash_flow': ['net cash used in investing activities', 'cash from investing activities'],
            'financing_cash_flow': ['net cash provided by financing activities', 'net cash used in financing activities', 'cash from financing activities'],
            'net_cash_flow': ['net increase in cash', 'net decrease in cash'],
        }
        
        # Helper to parse matches on a line
        self._search_mappings(lines, bs_mappings, result['balance_sheet'])
        self._search_mappings(lines, is_mappings, result['income_statement'])
        self._search_mappings(lines, cf_mappings, result['cash_flow'])

    def _search_mappings(self, lines: List[str], mappings: Dict[str, List[str]], target_dict: Dict[str, float]):
        """
        Searches lines for mappings and extracts the first matching float value.
        """
        for line in lines:
            # Skip empty lines
            if not line.strip():
                continue
            
            for key, search_terms in mappings.items():
                # Avoid overwriting if we already found the priority match earlier in document
                if key in target_dict:
                    continue
                    
                for term in search_terms:
                    # Match if the line starts with the term or contains it as a distinct phrase
                    if line.startswith(term) or f" {term} " in f" {line} ":
                        # Extremely basic text-to-number extraction
                        # Looks for $ or normal numbers, including negatives wrapped in parentheses like (500)
                        matches = re.findall(r'\(?\$?\d{1,3}(?:,\d{3})*(?:\.\d+)?\)?', line)
                        
                        if matches:
                            # Assume the first number to the right is the target value
                            # or the last number (usually rightmost column)
                            num_str = matches[-1] # Taking the rightmost number often captures the "current year" or "total"
                            
                            # Clean it up
                            is_negative = '(' in num_str and ')' in num_str
                            cleaned = re.sub(r'[^\d.]', '', num_str)
                            
                            if cleaned:
                                try:
                                    val = float(cleaned)
                                    if is_negative:
                                        val = -val
                                    target_dict[key] = val
                                    break # Found it, move to next line/mapping
                                except ValueError:
                                    pass
