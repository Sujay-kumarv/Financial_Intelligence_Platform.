"""
Excel Statement Parser
Parses financial statements from Excel files (.xlsx, .xls)
"""
import pandas as pd
from typing import Dict, Optional, List
from datetime import datetime
import re


class ExcelStatementParser:
    """
    Parses financial statements from Excel files
    Supports multiple sheet formats and layouts
    """
    
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.df = None
        
    def parse(self) -> Dict[str, any]:
        """
        Parse Excel file and extract financial statement data
        Returns structured dictionary with statement data
        """
        try:
            # Read all sheets
            excel_file = pd.ExcelFile(self.file_path)
            sheets = excel_file.sheet_names
            
            result = {
                'balance_sheet': {},
                'income_statement': {},
                'cash_flow': {},
                'metadata': {
                    'file_path': self.file_path,
                    'sheets_found': sheets,
                    'parsed_at': datetime.now().isoformat()
                }
            }
            
            # Try to identify and parse each statement type
            for sheet_name in sheets:
                df = pd.read_excel(self.file_path, sheet_name=sheet_name)
                
                # Identify statement type
                statement_type = self._identify_statement_type(sheet_name, df)
                
                if statement_type == 'balance_sheet':
                    result['balance_sheet'] = self._parse_balance_sheet(df)
                elif statement_type == 'income_statement':
                    result['income_statement'] = self._parse_income_statement(df)
                elif statement_type == 'cash_flow':
                    result['cash_flow'] = self._parse_cash_flow(df)
            
            return result
            
        except Exception as e:
            raise ValueError(f"Error parsing Excel file: {str(e)}")
    
    def _identify_statement_type(self, sheet_name: str, df: pd.DataFrame) -> Optional[str]:
        """Identify the type of financial statement"""
        sheet_lower = sheet_name.lower()
        
        # Check sheet name
        if any(term in sheet_lower for term in ['balance', 'bs', 'position']):
            return 'balance_sheet'
        elif any(term in sheet_lower for term in ['income', 'p&l', 'profit', 'loss', 'is']):
            return 'income_statement'
        elif any(term in sheet_lower for term in ['cash', 'cf', 'flow']):
            return 'cash_flow'
        
        # Check content
        content_str = ' '.join(df.astype(str).values.flatten()).lower()
        
        if 'current assets' in content_str or 'total assets' in content_str:
            return 'balance_sheet'
        elif 'revenue' in content_str or 'net income' in content_str:
            return 'income_statement'
        elif 'operating activities' in content_str or 'cash flow' in content_str:
            return 'cash_flow'
        
        return None
    
    def _parse_balance_sheet(self, df: pd.DataFrame) -> Dict[str, float]:
        """Parse balance sheet data"""
        data = {}
        
        # Common balance sheet line items and their variations
        mappings = {
            'current_assets': ['current assets', 'total current assets'],
            'cash_and_equivalents': ['cash and cash equivalents', 'cash', 'cash & equivalents'],
            'accounts_receivable': ['accounts receivable', 'receivables', 'trade receivables'],
            'inventory': ['inventory', 'inventories'],
            'total_assets': ['total assets', 'assets'],
            'current_liabilities': ['current liabilities', 'total current liabilities'],
            'total_liabilities': ['total liabilities', 'liabilities'],
            'total_debt': ['total debt', 'long-term debt', 'borrowings'],
            'total_equity': ['total equity', 'shareholders equity', 'stockholders equity', 'equity'],
        }
        
        data = self._extract_line_items(df, mappings)
        return data
    
    def _parse_income_statement(self, df: pd.DataFrame) -> Dict[str, float]:
        """Parse income statement data"""
        mappings = {
            'revenue': ['revenue', 'total revenue', 'sales', 'net sales'],
            'cost_of_goods_sold': ['cost of goods sold', 'cogs', 'cost of sales'],
            'gross_profit': ['gross profit', 'gross income'],
            'operating_expenses': ['operating expenses', 'opex'],
            'operating_income': ['operating income', 'ebit', 'operating profit'],
            'interest_expense': ['interest expense', 'interest'],
            'tax_expense': ['tax expense', 'income tax', 'taxes'],
            'net_income': ['net income', 'net profit', 'profit after tax'],
        }
        
        data = self._extract_line_items(df, mappings)
        
        # Calculate EBIT if not present
        if 'ebit' not in data and 'operating_income' in data:
            data['ebit'] = data['operating_income']
        
        return data
    
    def _parse_cash_flow(self, df: pd.DataFrame) -> Dict[str, float]:
        """Parse cash flow statement data"""
        mappings = {
            'operating_cash_flow': ['cash from operating activities', 'operating cash flow', 'ocf'],
            'investing_cash_flow': ['cash from investing activities', 'investing cash flow'],
            'financing_cash_flow': ['cash from financing activities', 'financing cash flow'],
            'net_cash_flow': ['net cash flow', 'net increase in cash'],
        }
        
        data = self._extract_line_items(df, mappings)
        return data
    
    def _extract_line_items(self, df: pd.DataFrame, mappings: Dict[str, List[str]]) -> Dict[str, float]:
        """Extract line items from dataframe based on mappings"""
        result = {}
        
        # Convert all columns to string for searching
        df_str = df.astype(str)
        
        for key, search_terms in mappings.items():
            value = self._find_value(df, df_str, search_terms)
            if value is not None:
                result[key] = value
        
        return result
    
    def _find_value(self, df: pd.DataFrame, df_str: pd.DataFrame, search_terms: List[str]) -> Optional[float]:
        """Find a value in the dataframe by searching for terms"""
        for term in search_terms:
            # Search in first column (usually contains labels)
            if len(df.columns) > 0:
                first_col = df_str.iloc[:, 0].str.lower()
                matches = first_col.str.contains(term.lower(), na=False)
                
                if matches.any():
                    # Get the row index
                    row_idx = matches.idxmax()
                    
                    # Try to find numeric value in the same row
                    row = df.iloc[row_idx]
                    for val in row[1:]:  # Skip first column (label)
                        try:
                            # Clean and convert to float
                            if pd.notna(val):
                                cleaned = str(val).replace(',', '').replace('$', '').replace('(', '-').replace(')', '').strip()
                                return float(cleaned)
                        except (ValueError, TypeError):
                            continue
        
        return None


class CSVStatementParser:
    """
    Parses financial statements from CSV files
    Similar to Excel parser but for CSV format
    """
    
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.excel_parser = None
    
    def parse(self) -> Dict[str, any]:
        """Parse CSV file using pandas"""
        try:
            # Read CSV
            df = pd.read_csv(self.file_path)
            
            # Determine statement type from content
            statement_type = self._identify_statement_type(df)
            
            result = {
                'balance_sheet': {},
                'income_statement': {},
                'cash_flow': {},
                'metadata': {
                    'file_path': self.file_path,
                    'statement_type': statement_type,
                    'parsed_at': datetime.now().isoformat()
                }
            }
            
            # Create temporary Excel parser to reuse parsing logic
            temp_parser = ExcelStatementParser(self.file_path)
            
            if statement_type == 'balance_sheet':
                result['balance_sheet'] = temp_parser._parse_balance_sheet(df)
            elif statement_type == 'income_statement':
                result['income_statement'] = temp_parser._parse_income_statement(df)
            elif statement_type == 'cash_flow':
                result['cash_flow'] = temp_parser._parse_cash_flow(df)
            
            return result
            
        except Exception as e:
            raise ValueError(f"Error parsing CSV file: {str(e)}")
    
    def _identify_statement_type(self, df: pd.DataFrame) -> Optional[str]:
        """Identify statement type from CSV content"""
        content_str = ' '.join(df.astype(str).values.flatten()).lower()
        
        if 'current assets' in content_str or 'total assets' in content_str:
            return 'balance_sheet'
        elif 'revenue' in content_str or 'net income' in content_str:
            return 'income_statement'
        elif 'operating activities' in content_str:
            return 'cash_flow'
        
        return 'income_statement'  # Default


def parse_statement_file(file_path: str) -> Dict[str, any]:
    """
    Universal parser that detects file type and parses accordingly
    """
    if file_path.endswith(('.xlsx', '.xls')):
        parser = ExcelStatementParser(file_path)
    elif file_path.endswith('.csv'):
        parser = CSVStatementParser(file_path)
    else:
        raise ValueError(f"Unsupported file format: {file_path}")
    
    return parser.parse()
