import pytest
from app.services.data_mapper import DataMapper
from app.services.llm_service import GeminiService

class MockGeminiService:
    async def parse_intent(self, prompt):
        return {
            "intent": "map_data",
            "mapping": {
                "Revenue": "revenue",
                "Total Income": "revenue",
                "Profit": "net_income",
                "Net Profit": "net_income"
            }
        }

@pytest.mark.asyncio
async def test_data_mapper_detect_columns():
    # Mocking GeminiService to avoid real API calls during unit tests
    mock_gemini = MockGeminiService()
    mapper = DataMapper(mock_gemini)
    
    headers = ["Total Income", "Net Profit", "Fiscal Year"]
    mapping = await mapper.detect_columns(headers)
    
    assert mapping["Total Income"] == "revenue"
    assert mapping["Net Profit"] == "net_income"

@pytest.mark.asyncio
async def test_data_mapper_clean_financial_data():
    mock_gemini = MockGeminiService()
    mapper = DataMapper(mock_gemini)
    
    row = {"Total Income": "1,200.50", "Net Profit": "$400.00"}
    mapping = {"Total Income": "revenue", "Net Profit": "net_income"}
    
    cleaned = mapper.clean_financial_data(row, mapping)
    
    assert cleaned["revenue"] == 1200.5
    assert cleaned["net_income"] == 400.0
