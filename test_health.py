import pytest

@pytest.mark.asyncio
async def test_health_check_endpoint(client):
    """Test the /health endpoint reports healthy status."""
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "healthy"
    assert "database" in data
    assert "groq" in data
    assert "chromadb" in data
