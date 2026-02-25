"""
Trend Analysis Engine
Analyzes financial trends over time (YoY, QoQ, CAGR)
"""
from typing import List, Dict, Optional
from datetime import datetime
from decimal import Decimal
import statistics


class TrendAnalyzer:
    """
    Analyzes financial trends and patterns
    Calculates growth rates, trends, and forecasts
    """
    
    def __init__(self, historical_data: List[Dict]):
        """
        Initialize with historical financial data
        historical_data: List of dicts with 'period', 'metrics' keys
        """
        self.data = sorted(historical_data, key=lambda x: x['period'])
    
    def year_over_year_growth(self, metric_name: str) -> List[Dict]:
        """
        Calculate Year-over-Year growth rate
        Returns list of {period, value, yoy_growth, yoy_growth_pct}
        """
        results = []
        
        for i, current in enumerate(self.data):
            current_value = current['metrics'].get(metric_name)
            
            if current_value is None:
                continue
            
            result = {
                'period': current['period'],
                'value': current_value,
                'yoy_growth': None,
                'yoy_growth_pct': None
            }
            
            # Find previous year data
            if i > 0:
                previous = self.data[i - 1]
                previous_value = previous['metrics'].get(metric_name)
                
                if previous_value and previous_value != 0:
                    growth = current_value - previous_value
                    growth_pct = (growth / previous_value) * 100
                    
                    result['yoy_growth'] = round(growth, 2)
                    result['yoy_growth_pct'] = round(growth_pct, 2)
            
            results.append(result)
        
        return results
    
    def quarter_over_quarter_growth(self, metric_name: str) -> List[Dict]:
        """
        Calculate Quarter-over-Quarter growth rate
        Returns list of {period, value, qoq_growth, qoq_growth_pct}
        """
        results = []
        
        for i, current in enumerate(self.data):
            current_value = current['metrics'].get(metric_name)
            
            if current_value is None:
                continue
            
            result = {
                'period': current['period'],
                'value': current_value,
                'qoq_growth': None,
                'qoq_growth_pct': None
            }
            
            # Compare with previous period
            if i > 0:
                previous = self.data[i - 1]
                previous_value = previous['metrics'].get(metric_name)
                
                if previous_value and previous_value != 0:
                    growth = current_value - previous_value
                    growth_pct = (growth / previous_value) * 100
                    
                    result['qoq_growth'] = round(growth, 2)
                    result['qoq_growth_pct'] = round(growth_pct, 2)
            
            results.append(result)
        
        return results
    
    def cagr(self, metric_name: str, years: Optional[int] = None) -> Optional[float]:
        """
        Calculate Compound Annual Growth Rate (CAGR)
        CAGR = (Ending Value / Beginning Value)^(1/years) - 1
        """
        if len(self.data) < 2:
            return None
        
        # Get first and last values
        first_period = self.data[0]
        last_period = self.data[-1]
        
        beginning_value = first_period['metrics'].get(metric_name)
        ending_value = last_period['metrics'].get(metric_name)
        
        if not beginning_value or not ending_value or beginning_value <= 0:
            return None
        
        # Calculate number of years
        if years is None:
            years = len(self.data) - 1
        
        if years == 0:
            return 0.0
        
        # CAGR formula
        cagr = (pow(ending_value / beginning_value, 1 / years) - 1) * 100
        return round(cagr, 2)
    
    def moving_average(self, metric_name: str, periods: int = 3) -> List[Dict]:
        """
        Calculate moving average for smoothing trends
        """
        results = []
        values = []
        
        for i, current in enumerate(self.data):
            current_value = current['metrics'].get(metric_name)
            
            if current_value is None:
                continue
            
            values.append(current_value)
            
            # Calculate moving average
            if len(values) >= periods:
                ma = statistics.mean(values[-periods:])
            else:
                ma = statistics.mean(values)
            
            results.append({
                'period': current['period'],
                'value': current_value,
                'moving_average': round(ma, 2)
            })
        
        return results
    
    def trend_direction(self, metric_name: str) -> str:
        """
        Determine overall trend direction: 'increasing', 'decreasing', 'stable'
        """
        if len(self.data) < 2:
            return 'insufficient_data'
        
        values = [d['metrics'].get(metric_name) for d in self.data if d['metrics'].get(metric_name) is not None]
        
        if len(values) < 2:
            return 'insufficient_data'
        
        # Calculate linear regression slope
        n = len(values)
        x = list(range(n))
        
        # Calculate slope
        x_mean = statistics.mean(x)
        y_mean = statistics.mean(values)
        
        numerator = sum((x[i] - x_mean) * (values[i] - y_mean) for i in range(n))
        denominator = sum((x[i] - x_mean) ** 2 for i in range(n))
        
        if denominator == 0:
            return 'stable'
        
        slope = numerator / denominator
        
        # Determine direction based on slope
        if slope > 0.05 * y_mean:  # Increasing by more than 5% on average
            return 'increasing'
        elif slope < -0.05 * y_mean:  # Decreasing by more than 5% on average
            return 'decreasing'
        else:
            return 'stable'
    
    def volatility(self, metric_name: str) -> Optional[float]:
        """
        Calculate volatility (standard deviation) of a metric
        """
        values = [d['metrics'].get(metric_name) for d in self.data if d['metrics'].get(metric_name) is not None]
        
        if len(values) < 2:
            return None
        
        return round(statistics.stdev(values), 2)
    
    def analyze_all_trends(self, metric_name: str) -> Dict:
        """
        Comprehensive trend analysis for a metric
        """
        return {
            'metric': metric_name,
            'yoy_growth': self.year_over_year_growth(metric_name),
            'qoq_growth': self.quarter_over_quarter_growth(metric_name),
            'cagr': self.cagr(metric_name),
            'trend_direction': self.trend_direction(metric_name),
            'volatility': self.volatility(metric_name),
            'moving_average': self.moving_average(metric_name),
            'data_points': len(self.data)
        }
    
    def compare_metrics(self, metric1: str, metric2: str) -> Dict:
        """
        Compare trends between two metrics
        """
        return {
            'metric1': {
                'name': metric1,
                'cagr': self.cagr(metric1),
                'trend': self.trend_direction(metric1)
            },
            'metric2': {
                'name': metric2,
                'cagr': self.cagr(metric2),
                'trend': self.trend_direction(metric2)
            }
        }
