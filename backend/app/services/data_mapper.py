"""
Data Mapper Service
Automates financial data column mapping and cleaning.
"""
from typing import List, Dict, Any, Optional
import pandas as pd
import io
from app.services.llm_service import gemini_service

class DataMapper:
    def __init__(self):
        # Standard schema mapping targets
        self.standard_fields = [
            "revenue", "cogs", "gross_profit", "operating_expenses",
            "operating_income", "net_income", "total_assets", "total_liabilities",
            "total_equity", "current_assets", "current_liabilities"
        ]

    async def auto_map_columns(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """
        Detect column names and map them to the standard financial schema using AI.
        """
        try:
            # Read sample headers
            if filename.endswith('.csv'):
                df = pd.read_csv(io.BytesIO(file_content), nrows=5)
            else:
                df = pd.read_excel(io.BytesIO(file_content), nrows=5)
            
            headers = df.columns.tolist()
            sample_data = df.head(3).to_dict()

            # Use LLM to map headers to standard fields
            prompt = f"""Map these raw financial headers to our standard schema.
            Raw Headers: {headers}
            Sample Data: {sample_data}
            Standard Schema: {self.standard_fields}
            
            Return a JSON mapping object: {{ "raw_header": "standard_field" }}
            """
            
            mapping = await gemini_service.parse_intent(prompt) # Reusing parse_intent as it returns JSON
            
            return {
                "success": True,
                "mapping": mapping,
                "headers": headers,
                "preview_rows": df.head(3).values.tolist()
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def clean_headers(self, df: pd.DataFrame, mapping: Dict[str, str]) -> pd.DataFrame:
        """
        Rename columns based on AI mapping and clean irregular headers.
        """
        return df.rename(columns=mapping)

data_mapper = DataMapper()
