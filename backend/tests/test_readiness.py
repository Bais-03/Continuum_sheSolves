import pytest
from app.models.domain import Document, ExtractedField, ReadinessScore
from tests.test_domain import get_csrf_headers

pytestmark = pytest.mark.asyncio

async def test_field_confirm_reject_and_recalculation(signed_up_client):
    client, user_data = signed_up_client
    headers = get_csrf_headers(client)
    
    # 1. Upload a document with key-value fields
    file_content = b"Nominee: Meera Kulkarni\nEMI Date: 5th of every month"
    files = {"file": ("test_doc.txt", file_content, "text/plain")}
    
    r_up = await client.post("/api/v1/documents/upload", files=files, headers=headers)
    assert r_up.status_code == 201
    doc_id = r_up.json()["id"]
    fields = r_up.json()["fields"]
    assert len(fields) == 2
    
    nominee_field = next(f for f in fields if f["field_label"] == "Nominee")
    emi_field = next(f for f in fields if f["field_label"] == "EMI Date")
    
    assert nominee_field["confirmation_status"] == "UNCONFIRMED"
    assert emi_field["confirmation_status"] == "UNCONFIRMED"
    
    # 2. Check initial scores (unconfirmed fields don't add bonus points)
    r_score1 = await client.get("/api/v1/scores")
    assert r_score1.status_code == 200
    scores1 = r_score1.json()
    beneficiary_dim1 = next(d for d in scores1["dimensions"] if d["dimension"] == "beneficiary")
    assert beneficiary_dim1["confirmed_count"] == 0
    assert beneficiary_dim1["unconfirmed_count"] == 1
    initial_score = beneficiary_dim1["score"]

    # 3. Confirm nominee field with edited value
    r_conf = await client.post(
        f"/api/v1/fields/{nominee_field['id']}/confirm", 
        json={"extracted_value": "Meera Kulkarni (Spouse)"}, 
        headers=headers
    )
    assert r_conf.status_code == 200
    assert r_conf.json()["confirmation_status"] == "CONFIRMED"
    assert r_conf.json()["extracted_value"] == "Meera Kulkarni (Spouse)"

    # 4. Score should automatically recalculate and increase
    r_score2 = await client.get("/api/v1/scores")
    scores2 = r_score2.json()
    beneficiary_dim2 = next(d for d in scores2["dimensions"] if d["dimension"] == "beneficiary")
    assert beneficiary_dim2["confirmed_count"] == 1
    assert beneficiary_dim2["score"] > initial_score

    # 5. Reject EMI field
    r_rej = await client.post(f"/api/v1/fields/{emi_field['id']}/reject", headers=headers)
    assert r_rej.status_code == 200
    assert r_rej.json()["confirmation_status"] == "REJECTED"

    # 6. Check score recalculation after rejection
    r_score3 = await client.get("/api/v1/scores")
    scores3 = r_score3.json()
    deadline_dim = next(d for d in scores3["dimensions"] if d["dimension"] == "deadline")
    assert deadline_dim["rejected_count"] == 1
    assert deadline_dim["confirmed_count"] == 0

    # 7. Manual recalculation endpoint test
    r_recalc = await client.post("/api/v1/scores/recalculate", headers=headers)
    assert r_recalc.status_code == 200
    assert r_recalc.json()["overall_score"] == scores3["overall_score"]

async def test_field_isolation(signed_up_client, client):
    user1_client, _ = signed_up_client
    headers1 = get_csrf_headers(user1_client)

    # Upload document for user 1
    files = {"file": ("doc.txt", b"Policy: 12345", "text/plain")}
    r = await user1_client.post("/api/v1/documents/upload", files=files, headers=headers1)
    field_id = r.json()["fields"][0]["id"]

    # Logout user 1 and signup user 2
    await user1_client.post("/api/v1/auth/logout", headers=headers1)
    await user1_client.post("/api/v1/auth/signup", json={"full_name": "Other User", "email": "other@example.com", "password": "password"})
    headers2 = get_csrf_headers(user1_client)

    # User 2 tries to view, confirm, or edit user 1's field
    r_get = await user1_client.get(f"/api/v1/fields/{field_id}")
    assert r_get.status_code == 404

    r_conf = await user1_client.post(f"/api/v1/fields/{field_id}/confirm", json={}, headers=headers2)
    assert r_conf.status_code == 404

    r_rej = await user1_client.post(f"/api/v1/fields/{field_id}/reject", headers=headers2)
    assert r_rej.status_code == 404
