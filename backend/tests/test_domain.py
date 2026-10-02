import pytest
from app.models.domain import Document, ExtractedField, ReadinessScore, Task

pytestmark = pytest.mark.asyncio

def get_csrf_headers(client):
    csrf_token = client.cookies.get("csrf_token")
    return {"X-CSRF-Token": csrf_token}

async def test_document_crud(signed_up_client):
    client, user_data = signed_up_client
    headers = get_csrf_headers(client)
    
    # Create Document (metadata)
    doc_data = {"filename": "test.pdf", "document_type": "ID"}
    r = await client.post("/api/v1/documents", json=doc_data, headers=headers)
    assert r.status_code == 201
    doc_id = r.json()["id"]
    
    # Get Document
    r = await client.get(f"/api/v1/documents/{doc_id}")
    assert r.status_code == 200
    assert r.json()["filename"] == "test.pdf"
    
    # Update Document
    r = await client.patch(f"/api/v1/documents/{doc_id}", json={"document_type": "PASSPORT"}, headers=headers)
    assert r.status_code == 200
    assert r.json()["document_type"] == "PASSPORT"
    
    # List Documents
    r = await client.get("/api/v1/documents")
    assert r.status_code == 200
    assert len(r.json()) > 0

async def test_task_crud(signed_up_client):
    client, user_data = signed_up_client
    headers = get_csrf_headers(client)
    
    # Create Task
    task_data = {"title": "Update Will"}
    r = await client.post("/api/v1/tasks", json=task_data, headers=headers)
    assert r.status_code == 201
    task_id = r.json()["id"]
    
    # Update Task
    r = await client.patch(f"/api/v1/tasks/{task_id}", json={"status": "DONE"}, headers=headers)
    assert r.status_code == 200
    assert r.json()["status"] == "DONE"
    
    # Delete Task
    r = await client.delete(f"/api/v1/tasks/{task_id}", headers=headers)
    assert r.status_code == 204

async def test_scores_list(signed_up_client):
    client, user_data = signed_up_client
    
    r = await client.get("/api/v1/scores")
    assert r.status_code == 200
    assert isinstance(r.json(), list)

async def test_csrf_protection_missing_header(signed_up_client):
    client, user_data = signed_up_client
    
    # No headers, so missing CSRF
    task_data = {"title": "Will Fail"}
    r = await client.post("/api/v1/tasks", json=task_data)
    assert r.status_code == 403
    assert "CSRF token missing" in r.text

async def test_csrf_protection_invalid_header(signed_up_client):
    client, user_data = signed_up_client
    
    # Invalid CSRF header
    task_data = {"title": "Will Fail"}
    r = await client.post("/api/v1/tasks", json=task_data, headers={"X-CSRF-Token": "invalid_token"})
    assert r.status_code == 403
    assert "CSRF token mismatch" in r.text
