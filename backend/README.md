# Continuum Backend

Continuum is a household successor-readiness platform. The backend is built with Python 3.12, FastAPI, SQLite, SQLAlchemy 2.x, and Alembic.

## Completed Phases (1, 2, 3 & 4)

The backend currently supports:
* **Authentication**: Cookie-based JWT authentication with strictly enforced CSRF protection for all state-changing endpoints (`POST`, `PATCH`, `DELETE`).
* **Household Management**: Automatic household creation on signup. Strict cross-tenant isolation on all models and physical files.
* **Domain Models**: Documents, Extracted Fields, Readiness Scores, and Tasks.
* **Secure Document Upload**: Multipart document uploading with local storage abstraction, file-size limits, and path traversal protection.
* **Deterministic Extraction & Field Confirmation**: Support for `.txt` extraction via basic deterministic parsing, generating unconfirmed `ExtractedField` records. Endpoints for listing, editing, confirming, and rejecting extracted fields.
* **Deterministic Readiness Scoring Engine**: Transparent, formula-driven calculation across 7 household dimensions based strictly on confirmed fields, providing human-readable explanations and automatic score updates upon field confirm/reject or document upload/delete.
* **Frontend Integration**: Connected React 19 frontend interfaces to FastAPI endpoints with credentialed requests and CSRF tokens.

---

### Seven Readiness Dimensions & Scoring Formula

1. **Asset Discovery (`asset`)** — Weight: `1.0` (Base: 20.0)
2. **Beneficiary Completeness (`beneficiary`)** — Weight: `1.5` (Base: 15.0)
3. **Deadline Awareness (`deadline`)** — Weight: `1.0` (Base: 20.0)
4. **Liability Awareness (`liability`)** — Weight: `1.0` (Base: 20.0)
5. **Document Accessibility (`access`)** — Weight: `1.25` (Base: 15.0)
6. **Successor Knowledge (`successor`)** — Weight: `1.5` (Base: 15.0)
7. **Emergency Contacts (`contacts`)** — Weight: `1.0` (Base: 20.0)

**Calculation Rules:**
* Each confirmed field (`confirmation_status == "CONFIRMED"`) in a dimension adds 20.0 points.
* Dimension score = `min(100.0, base_score + (confirmed_count * 20.0))`.
* Overall score = `round( sum(dimension_score * weight) / sum(weight) )`.
* Unconfirmed (`UNCONFIRMED`) and rejected (`REJECTED`) fields do not add points to readiness scores until verified by a human.

---

### Local Run Commands

#### Windows PowerShell
```powershell
# Create virtual environment & install dependencies
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Run migrations
.\venv\Scripts\alembic.exe upgrade head

# Start the development server
.\venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
```

#### Unix (macOS / Linux)
```bash
# Create virtual environment & install dependencies
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start the development server
uvicorn app.main:app --reload --port 8000
```

---

### Test Commands
Run the complete test suite (includes in-memory SQLite isolation per test):

**Windows PowerShell:**
```powershell
.\venv\Scripts\pytest.exe tests/ -v
```

**Unix:**
```bash
pytest tests/ -v
```

---

### API Endpoints

All endpoints are prefixed with `/api/v1`.
Cookie-based authentication is required for protected routes.
All `POST`, `PATCH`, and `DELETE` endpoints strictly require the `X-CSRF-Token` header.

#### Auth & Households
* `POST /auth/signup`
* `POST /auth/login`
* `POST /auth/logout`
* `GET /auth/me`
* `GET /households/me`

#### Documents
* `GET /documents` - List all household documents
* `POST /documents/upload` - Upload a document (`multipart/form-data`) and trigger processing & score calculation
* `GET /documents/{id}` - Get document metadata and extracted fields
* `GET /documents/{id}/fields` - List extracted fields for a specific document
* `GET /documents/{id}/download` - Download the physical document file securely
* `PATCH /documents/{id}` - Update document metadata
* `DELETE /documents/{id}` - Delete a document and its stored physical file (triggers score recalculation)

#### Extracted Fields & Confirmation
* `GET /fields/{id}` - Get field details
* `PATCH /fields/{id}` - Update extracted field value or confirmation status (`UNCONFIRMED`, `CONFIRMED`, `REJECTED`)
* `POST /fields/{id}/confirm` - Confirm field (optional `{ "extracted_value": "..." }` body)
* `POST /fields/{id}/reject` - Reject field

#### Readiness Scores
* `GET /scores` - Retrieve overall score, dimension breakdowns, and human-readable missing data explanations
* `GET /scores/raw` - Raw list of readiness score records
* `POST /scores/recalculate` - Force score recalculation

#### Tasks
* `GET /tasks` - List all household tasks
* `POST /tasks` - Create a new task
* `GET /tasks/{id}` - Get task details
* `PATCH /tasks/{id}` - Update task details
* `DELETE /tasks/{id}` - Delete a task

---

### Current Limitations
* Document file upload leverages local filesystem storage (`./storage`).
* Extraction is strictly deterministic text parsing (`Key: Value`) for `.txt` files.
* ML/OCR intelligent understanding, Celery background queues, and AWS S3 storage adapters belong to future phases.
