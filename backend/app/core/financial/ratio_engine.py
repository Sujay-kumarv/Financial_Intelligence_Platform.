"""
Financial Ratio Computation Engine
Calculates all financial ratios from statement data
CRITICAL: All calculations are deterministic - NO LLM involvement
"""
from typing import Dict, Optional
from decimal import Decimal, ROUND_HALF_UP


class RatioEngine:
    """
    Computes financial ratios from statement data
    All formulas follow standard accounting principles (GAAP/IFRS)
    """
    
    def __init__(self, balance_sheet: Dict, income_statement: Dict, cash_flow: Optional[Dict] = None):
        self.bs = balance_sheet
        self.is_ = income_statement
        self.cf = cash_flow or {}
    
    def _safe_divide(self, numerator: float, denominator: float) -> Optional[float]:
        """Safely divide two numbers, return None if denominator is zero"""
        if denominator == 0 or denominator is None:
            return None
        return round(numerator / denominator, 4)
    
    # ===========================
    # LIQUIDITY RATIOS
    # ===========================
    
    def current_ratio(self) -> Optional[float]:
        """
        Current Ratio = Current Assets / Current Liabilities
        Benchmark: > 1.5 (Healthy), 1.0-1.5 (Warning), < 1.0 (Critical)
        """
        current_assets = self.bs.get('current_assets', 0)
        current_liabilities = self.bs.get('current_liabilities', 0)
        return self._safe_divide(current_assets, current_liabilities)
    
    def quick_ratio(self) -> Optional[float]:
        """
        Quick Ratio = (Current Assets - Inventory) / Current Liabilities
        Benchmark: > 1.0 (Healthy), 0.7-1.0 (Warning), < 0.7 (Critical)
        """
        current_assets = self.bs.get('current_assets', 0)
        inventory = self.bs.get('inventory', 0)
        current_liabilities = self.bs.get('current_liabilities', 0)
        return self._safe_divide(current_assets - inventory, current_liabilities)
    
    def cash_ratio(self) -> Optional[float]:
        """
        Cash Ratio = Cash & Cash Equivalents / Current Liabilities
        Benchmark: > 0.5 (Healthy), 0.2-0.5 (Warning), < 0.2 (Critical)
        """
        cash = self.bs.get('cash_and_equivalents', 0)
        current_liabilities = self.bs.get('current_liabilities', 0)
        return self._safe_divide(cash, current_liabilities)
    
    def working_capital(self) -> float:
        """
        Working Capital = Current Assets - Current Liabilities
        Positive and growing is healthy
        """
        current_assets = self.bs.get('current_assets', 0)
        current_liabilities = self.bs.get('current_liabilities', 0)
        return current_assets - current_liabilities
    
    def operating_cash_flow_ratio(self) -> Optional[float]:
        """
        Operating Cash Flow Ratio = Operating Cash Flow / Current Liabilities
        Benchmark: > 0.5 (Healthy)
        """
        ocf = self.cf.get('operating_cash_flow', 0)
        current_liabilities = self.bs.get('current_liabilities', 0)
        return self._safe_divide(ocf, current_liabilities)
    
    # ===========================
    # PROFITABILITY RATIOS
    # ===========================
    
    def gross_profit_margin(self) -> Optional[float]:
        """
        Gross Profit Margin = (Revenue - COGS) / Revenue × 100
        Industry-dependent benchmarks
        """
        revenue = self.is_.get('revenue', 0)
        cogs = self.is_.get('cost_of_goods_sold', 0)
        margin = self._safe_divide(revenue - cogs, revenue)
        return margin * 100 if margin is not None else None
    
    def operating_profit_margin(self) -> Optional[float]:
        """
        Operating Profit Margin = Operating Income / Revenue × 100
        Benchmark: > 15% (Healthy), 5-15% (Warning), < 5% (Critical)
        """
        operating_income = self.is_.get('operating_income', 0)
        revenue = self.is_.get('revenue', 0)
        margin = self._safe_divide(operating_income, revenue)
        return margin * 100 if margin is not None else None
    
    def net_profit_margin(self) -> Optional[float]:
        """
        Net Profit Margin = Net Income / Revenue × 100
        Benchmark: > 10% (Healthy), 3-10% (Warning), < 3% (Critical)
        """
        net_income = self.is_.get('net_income', 0)
        revenue = self.is_.get('revenue', 0)
        margin = self._safe_divide(net_income, revenue)
        return margin * 100 if margin is not None else None
    
    def return_on_assets(self) -> Optional[float]:
        """
        ROA = Net Income / Total Assets × 100
        Benchmark: > 5% (Healthy), 2-5% (Average), < 2% (Poor)
        """
        net_income = self.is_.get('net_income', 0)
        total_assets = self.bs.get('total_assets', 0)
        roa = self._safe_divide(net_income, total_assets)
        return roa * 100 if roa is not None else None
    
    def return_on_equity(self) -> Optional[float]:
        """
        ROE = Net Income / Shareholders' Equity × 100
        Benchmark: > 15% (Healthy), 10-15% (Average), < 10% (Poor)
        """
        net_income = self.is_.get('net_income', 0)
        equity = self.bs.get('total_equity', 0)
        roe = self._safe_divide(net_income, equity)
        return roe * 100 if roe is not None else None
    
    def return_on_invested_capital(self) -> Optional[float]:
        """
        ROIC = NOPAT / Invested Capital × 100
        NOPAT = Operating Income × (1 - Tax Rate)
        Invested Capital = Total Debt + Total Equity
        """
        operating_income = self.is_.get('operating_income', 0)
        tax_rate = self.is_.get('tax_rate', 0.25)  # Default 25%
        nopat = operating_income * (1 - tax_rate)
        
        total_debt = self.bs.get('total_debt', 0)
        total_equity = self.bs.get('total_equity', 0)
        invested_capital = total_debt + total_equity
        
        roic = self._safe_divide(nopat, invested_capital)
        return roic * 100 if roic is not None else None
    
    # ===========================
    # SOLVENCY RATIOS
    # ===========================
    
    def debt_to_equity(self) -> Optional[float]:
        """
        Debt-to-Equity = Total Debt / Total Equity
        Benchmark: < 1.0 (Healthy), 1.0-2.0 (Warning), > 2.0 (Critical)
        """
        total_debt = self.bs.get('total_debt', 0)
        total_equity = self.bs.get('total_equity', 0)
        return self._safe_divide(total_debt, total_equity)
    
    def debt_to_assets(self) -> Optional[float]:
        """
        Debt-to-Assets = Total Debt / Total Assets
        Benchmark: < 0.4 (Healthy), 0.4-0.6 (Warning), > 0.6 (Critical)
        """
        total_debt = self.bs.get('total_debt', 0)
        total_assets = self.bs.get('total_assets', 0)
        return self._safe_divide(total_debt, total_assets)
    
    def interest_coverage(self) -> Optional[float]:
        """
        Interest Coverage = EBIT / Interest Expense
        Benchmark: > 3.0 (Healthy), 1.5-3.0 (Warning), < 1.5 (Critical)
        """
        ebit = self.is_.get('ebit', 0)
        interest_expense = self.is_.get('interest_expense', 0)
        return self._safe_divide(ebit, interest_expense)
    
    def equity_ratio(self) -> Optional[float]:
        """
        Equity Ratio = Total Equity / Total Assets
        Benchmark: > 0.5 (Healthy)
        """
        total_equity = self.bs.get('total_equity', 0)
        total_assets = self.bs.get('total_assets', 0)
        return self._safe_divide(total_equity, total_assets)
    
    def debt_service_coverage(self) -> Optional[float]:
        """
        DSCR = Operating Income / Total Debt Service
        Benchmark: > 1.25 (Healthy)
        """
        operating_income = self.is_.get('operating_income', 0)
        debt_service = self.is_.get('total_debt_service', 0)
        return self._safe_divide(operating_income, debt_service)
    
    # ===========================
    # EFFICIENCY RATIOS
    # ===========================
    
    def asset_turnover(self) -> Optional[float]:
        """
        Asset Turnover = Revenue / Average Total Assets
        Higher is better (industry-dependent)
        """
        revenue = self.is_.get('revenue', 0)
        total_assets = self.bs.get('total_assets', 0)
        return self._safe_divide(revenue, total_assets)
    
    def inventory_turnover(self) -> Optional[float]:
        """
        Inventory Turnover = COGS / Average Inventory
        Benchmark: > 5 (varies by industry)
        """
        cogs = self.is_.get('cost_of_goods_sold', 0)
        inventory = self.bs.get('inventory', 0)
        return self._safe_divide(cogs, inventory)
    
    def receivables_turnover(self) -> Optional[float]:
        """
        Receivables Turnover = Revenue / Average Accounts Receivable
        Higher is better
        """
        revenue = self.is_.get('revenue', 0)
        ar = self.bs.get('accounts_receivable', 0)
        return self._safe_divide(revenue, ar)
    
    def days_sales_outstanding(self) -> Optional[float]:
        """
        DSO = 365 / Receivables Turnover
        Lower is better (< 45 days ideal)
        """
        receivables_turnover = self.receivables_turnover()
        if receivables_turnover is None or receivables_turnover == 0:
            return None
        return 365 / receivables_turnover
    
    def days_inventory_outstanding(self) -> Optional[float]:
        """
        DIO = 365 / Inventory Turnover
        Lower is better
        """
        inventory_turnover = self.inventory_turnover()
        if inventory_turnover is None or inventory_turnover == 0:
            return None
        return 365 / inventory_turnover
    
    def cash_conversion_cycle(self) -> Optional[float]:
        """
        CCC = DSO + DIO - DPO
        Lower is better
        """
        dso = self.days_sales_outstanding()
        dio = self.days_inventory_outstanding()
        dpo = self.is_.get('days_payable_outstanding', 0)
        
        if dso is None or dio is None:
            return None
        
        return dso + dio - dpo
    
    # ===========================
    # COMPUTE ALL RATIOS
    # ===========================
    
    def compute_all_ratios(self) -> Dict[str, Dict[str, Optional[float]]]:
        """
        Compute all financial ratios
        Returns organized dictionary by category
        """
        return {
            "liquidity": {
                "current_ratio": self.current_ratio(),
                "quick_ratio": self.quick_ratio(),
                "cash_ratio": self.cash_ratio(),
                "working_capital": self.working_capital(),
                "operating_cash_flow_ratio": self.operating_cash_flow_ratio()
            },
            "profitability": {
                "gross_profit_margin": self.gross_profit_margin(),
                "operating_profit_margin": self.operating_profit_margin(),
                "net_profit_margin": self.net_profit_margin(),
                "return_on_assets": self.return_on_assets(),
                "return_on_equity": self.return_on_equity(),
                "return_on_invested_capital": self.return_on_invested_capital()
            },
            "solvency": {
                "debt_to_equity": self.debt_to_equity(),
                "debt_to_assets": self.debt_to_assets(),
                "interest_coverage": self.interest_coverage(),
                "equity_ratio": self.equity_ratio(),
                "debt_service_coverage": self.debt_service_coverage()
            },
            "efficiency": {
                "asset_turnover": self.asset_turnover(),
                "inventory_turnover": self.inventory_turnover(),
                "receivables_turnover": self.receivables_turnover(),
                "days_sales_outstanding": self.days_sales_outstanding(),
                "days_inventory_outstanding": self.days_inventory_outstanding(),
                "cash_conversion_cycle": self.cash_conversion_cycle()
            }
        }
