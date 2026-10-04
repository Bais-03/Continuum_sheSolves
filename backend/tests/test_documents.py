import pytest
import os
from httpx import AsyncClient
from app.config import settings
from tests.test_domain import get_csrf_headers

pytestmark = pytest.mark.asyncio

async def test_document_upload_and_extraction(signed_up_client):
    client, user_data = signed_up_client
    headers = get_csrf_headers(client)
    
    # Valid Text File for extraction
    file_content = b"Name: John Doe\nAccount: 123456"
    files = {"file": ("test.txt", file_content, "text/plain")}
    
    r = await client.post("/api/v1/documents/upload", files=files, headers=headers)
    assert r.status_code == 201
    
    doc = r.json()
    assert doc["upload_status"] == "COMPLETED"
    assert doc["document_type"] == "text/plain"
    doc_id = doc["id"]
    
    # Verify extraction created fields
    r_doc = await client.get(f"/api/v1/documents/{doc_id}")
    fields = r_doc.json()["fields"]
    assert len(fields) == 2
    assert fields[0]["field_label"] == "Name"
    assert fields[0]["extracted_value"] == "John Doe"
    assert fields[0]["confirmation_status"] == "UNCONFIRMED"
    
    # Authorized download
    r_down = await client.get(f"/api/v1/documents/{doc_id}/download")
    assert r_down.status_code == 200
    assert r_down.content == file_content
    
    # Delete cleans up file
    r_del = await client.delete(f"/api/v1/documents/{doc_id}", headers=headers)
    assert r_del.status_code == 204
    
    r_get = await client.get(f"/api/v1/documents/{doc_id}")
    assert r_get.status_code == 404

async def test_document_upload_unsupported_format(signed_up_client):
    client, user_data = signed_up_client
    headers = get_csrf_headers(client)
    
    file_content = b"fake pdf content"
    files = {"file": ("test.pdf", file_content, "application/pdf")}
    
    r = await client.post("/api/v1/documents/upload", files=files, headers=headers)
    assert r.status_code == 201
    doc = r.json()
    # Unsupported formats just get marked COMPLETED but no fields extracted
    assert doc["upload_status"] == "COMPLETED"
    
    r_doc = await client.get(f"/api/v1/documents/{doc['id']}")
    assert len(r_doc.json()["fields"]) == 0

async def test_document_upload_empty_file(signed_up_client):
    client, user_data = signed_up_client
    headers = get_csrf_headers(client)
    
    files = {"file": ("empty.txt", b"", "text/plain")}
    r = await client.post("/api/v1/documents/upload", files=files, headers=headers)
    assert r.status_code == 400
    assert "empty" in r.text.lower()

async def test_document_upload_too_large(signed_up_client):
    client, user_data = signed_up_client
    headers = get_csrf_headers(client)
    
    # Just above the 5MB limit
    large_content = b"0" * (settings.MAX_UPLOAD_SIZE + 10)
    files = {"file": ("large.txt", large_content, "text/plain")}
    
    r = await client.post("/api/v1/documents/upload", files=files, headers=headers)
    assert r.status_code == 413
    assert "exceeds maximum" in r.text.lower()

async def test_cross_household_isolation(signed_up_client):
    user1_client, _ = signed_up_client
    headers1 = get_csrf_headers(user1_client)
    
    # Create doc for user 1
    files = {"file": ("user1.txt", b"User 1 Data", "text/plain")}
    r = await user1_client.post("/api/v1/documents/upload", files=files, headers=headers1)
    doc_id = r.json()["id"]
    
    # Create user 2 by logging out user 1 first, then signing up anew
    await user1_client.post("/api/v1/auth/logout", headers=headers1)
    
    r2 = await user1_client.post("/api/v1/auth/signup", json={"full_name": "User 2", "email": "user2@example.com", "password": "password"})
    assert r2.status_code == 201
    
    user2_client = user1_client
    headers2 = get_csrf_headers(user2_client)
    
    # User 2 tries to access User 1's document
    r_get = await user2_client.get(f"/api/v1/documents/{doc_id}")
    assert r_get.status_code == 404
    
    r_down = await user2_client.get(f"/api/v1/documents/{doc_id}/download")
    assert r_down.status_code == 404
    
    r_del = await user2_client.delete(f"/api/v1/documents/{doc_id}", headers=headers2)
    assert r_del.status_code == 404

