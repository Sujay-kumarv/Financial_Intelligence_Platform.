"""
Risk Assessment Engine
Calculates financial health score and identifies red flags
"""
from typing import Dict, List, Optional
from enum import Enum


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RiskScorer:
    """
    Assesses financial risk and calculates health score (0-100)
    Identifies red flags and warning signs
    """
    
    def __init__(self, ratios: Dict[str, Dict[str, float]]):
        """
        Initialize with computed financial ratios
        ratios: Dictionary from RatioEngine.compute_all_ratios()
        """
        self.ratios = ratios
        self.red_flags = []
        self.warnings = []
    
    def calculate_health_score(self) -> float:
        """
        Calculate overall financial health score (0-100)
        Higher is better
        """
        scores = {
            'liquidity': self._score_liquidity(),
            'profitability': self._score_profitability(),
            'solvency': self._score_solvency(),
            'efficiency': self._score_efficiency()
        }
        
        # Weighted average
        weights = {
            'liquidity': 0.25,
            'profitability': 0.35,
            'solvency': 0.30,
            'efficiency': 0.10
        }
        
        total_score = sum(scores[k] * weights[k] for k in scores.keys())
        return round(total_score, 2)
    
    def _score_liquidity(self) -> float:
        """Score liquidity ratios (0-100)"""
        score = 0
        max_score = 100
        
        liquidity = self.ratios.get('liquidity', {})
        
        # Current Ratio (40 points)
        current_ratio = liquidity.get('current_ratio')
        if current_ratio:
            if current_ratio >= 2.0:
                score += 40
            elif current_ratio >= 1.5:
                score += 30
            elif current_ratio >= 1.0:
                score += 15
                self.warnings.append("Current ratio below healthy threshold")
            else:
                score += 5
                self.red_flags.append("Critical liquidity: Current ratio < 1.0")
        
        # Quick Ratio (30 points)
        quick_ratio = liquidity.get('quick_ratio')
        if quick_ratio:
            if quick_ratio >= 1.0:
                score += 30
            elif quick_ratio >= 0.7:
                score += 20
            else:
                score += 10
                self.warnings.append("Quick ratio below 0.7")
        
        # Cash Ratio (30 points)
        cash_ratio = liquidity.get('cash_ratio')
        if cash_ratio:
            if cash_ratio >= 0.5:
                score += 30
            elif cash_ratio >= 0.2:
                score += 20
            else:
                score += 10
        
        return score
    
    def _score_profitability(self) -> float:
        """Score profitability ratios (0-100)"""
        score = 0
        
        profitability = self.ratios.get('profitability', {})
        
        # Net Profit Margin (30 points)
        npm = profitability.get('net_profit_margin')
        if npm:
            if npm >= 10:
                score += 30
            elif npm >= 5:
                score += 20
            elif npm >= 0:
                score += 10
                self.warnings.append("Low profit margin")
            else:
                score += 0
                self.red_flags.append("Negative profit margin - company is losing money")
        
        # ROE (35 points)
        roe = profitability.get('return_on_equity')
        if roe:
            if roe >= 15:
                score += 35
            elif roe >= 10:
                score += 25
            elif roe >= 5:
                score += 15
            else:
                score += 5
                self.warnings.append("ROE below 5%")
        
        # ROA (20 points)
        roa = profitability.get('return_on_assets')
        if roa:
            if roa >= 5:
                score += 20
            elif roa >= 2:
                score += 12
            else:
                score += 5
        
        # Operating Margin (15 points)
        opm = profitability.get('operating_profit_margin')
        if opm:
            if opm >= 15:
                score += 15
            elif opm >= 10:
                score += 10
            elif opm >= 5:
                score += 5
            else:
                self.warnings.append("Low operating margin")
        
        return score
    
    def _score_solvency(self) -> float:
        """Score solvency ratios (0-100)"""
        score = 0
        
        solvency = self.ratios.get('solvency', {})
        
        # Debt-to-Equity (40 points)
        dte = solvency.get('debt_to_equity')
        if dte is not None:
            if dte < 0.5:
                score += 40
            elif dte < 1.0:
                score += 30
            elif dte < 2.0:
                score += 15
                self.warnings.append("Elevated debt levels")
            else:
                score += 5
                self.red_flags.append("High debt burden - D/E ratio > 2.0")
        
        # Interest Coverage (35 points)
        ic = solvency.get('interest_coverage')
        if ic:
            if ic >= 5.0:
                score += 35
            elif ic >= 3.0:
                score += 25
            elif ic >= 1.5:
                score += 12
                self.warnings.append("Interest coverage below 3.0")
            else:
                score += 3
                self.red_flags.append("Critical: Cannot cover interest payments")
        
        # Debt-to-Assets (25 points)
        dta = solvency.get('debt_to_assets')
        if dta is not None:
            if dta < 0.4:
                score += 25
            elif dta < 0.6:
                score += 15
            else:
                score += 5
                self.warnings.append("High debt relative to assets")
        
        return score
    
    def _score_efficiency(self) -> float:
        """Score efficiency ratios (0-100)"""
        score = 0
        
        efficiency = self.ratios.get('efficiency', {})
        
        # Asset Turnover (40 points)
        at = efficiency.get('asset_turnover')
        if at:
            if at >= 1.5:
                score += 40
            elif at >= 1.0:
                score += 30
            elif at >= 0.5:
                score += 20
            else:
                score += 10
        
        # Days Sales Outstanding (30 points)
        dso = efficiency.get('days_sales_outstanding')
        if dso:
            if dso <= 30:
                score += 30
            elif dso <= 45:
                score += 20
            elif dso <= 60:
                score += 10
            else:
                self.warnings.append("High DSO - slow collections")
        
        # Cash Conversion Cycle (30 points)
        ccc = efficiency.get('cash_conversion_cycle')
        if ccc:
            if ccc <= 30:
                score += 30
            elif ccc <= 60:
                score += 20
            elif ccc <= 90:
                score += 10
            else:
                self.warnings.append("Long cash conversion cycle")
        
        return score
    
    def assess_risk_level(self) -> RiskLevel:
        """Determine overall risk level"""
        score = self.calculate_health_score()
        
        if score >= 75:
            return RiskLevel.LOW
        elif score >= 60:
            return RiskLevel.MEDIUM
        elif score >= 40:
            return RiskLevel.HIGH
        else:
            return RiskLevel.CRITICAL
    
    def get_assessment(self) -> Dict:
        """
        Get comprehensive risk assessment
        """
        health_score = self.calculate_health_score()
        risk_level = self.assess_risk_level()
        
        # Categorize risks
        liquidity_risk = self._categorize_score(self._score_liquidity())
        profitability_risk = self._categorize_score(self._score_profitability())
        solvency_risk = self._categorize_score(self._score_solvency())
        efficiency_risk = self._categorize_score(self._score_efficiency())
        
        return {
            'overall_score': health_score,
            'risk_level': risk_level.value,
            'category_scores': {
                'liquidity': {
                    'score': self._score_liquidity(),
                    'risk': liquidity_risk
                },
                'profitability': {
                    'score': self._score_profitability(),
                    'risk': profitability_risk
                },
                'solvency': {
                    'score': self._score_solvency(),
                    'risk': solvency_risk
                },
                'efficiency': {
                    'score': self._score_efficiency(),
                    'risk': efficiency_risk
                }
            },
            'red_flags': self.red_flags,
            'warnings': self.warnings,
            'recommendation': self._get_recommendation(health_score, risk_level)
        }
    
    def _categorize_score(self, score: float) -> str:
        """Convert numeric score to risk category"""
        if score >= 75:
            return "low"
        elif score >= 60:
            return "medium"
        elif score >= 40:
            return "high"
        else:
            return "critical"
    
    def _get_recommendation(self, score: float, risk_level: RiskLevel) -> str:
        """Get recommendation based on score"""
        if risk_level == RiskLevel.LOW:
            return "Strong financial health. Continue monitoring key metrics."
        elif risk_level == RiskLevel.MEDIUM:
            return "Moderate financial health. Address warnings to improve position."
        elif risk_level == RiskLevel.HIGH:
            return "Elevated financial risk. Immediate attention needed on red flags."
        else:
            return "Critical financial condition. Urgent intervention required."
