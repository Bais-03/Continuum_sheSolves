# Continuum Backend

Continuum is a household successor-readiness platform. The backend is built with Python 3.12, FastAPI, SQLite, SQLAlchemy 2.x, and Alembic.

## Phase 1, 2, & 3 Completed

The backend currently supports:
* **Authentication**: Cookie-based JWT authentication with strictly enforced CSRF protection for all state-changing endpoints (`POST`, `PATCH`, `DELETE`).
* **Household Management**: Automatic household creation on signup. Strict cross-tenant isolation on all models and physical files.
* **Domain Models**: Documents, Extracted Fields, Readiness Scores, and Tasks.
* **Secure Document Upload**: Multipart document uploading with local storage abstraction, file-size limits, and path traversal protection.
* **Basic Processing Pipeline**: Support for `.txt` extraction via basic deterministic parsing, automatically generating unconfirmed `ExtractedField` records and recording lifecycle statuses.

### Data Models & Relationships

- **User**: Represents a registered user.
- **Household**: The primary tenant boundary. Owned by a `User`.
- **HouseholdMember**: Members of a household.
- **Document**: Represents an uploaded document. Tracks `upload_status` and `storage_reference`.
- **ExtractedField**: Represents data extracted from a document. Belongs to a `Document`.
- **ReadinessScore**: Tracks readiness progress across dimensions. Belongs to a `Household`.
- **Task**: Tracks actionable items (Day-Zero tasks). Belongs to a `Household`.

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

### API Endpoints

All endpoints are prefixed with `/api/v1`.
Cookie-based authentication is required (except `/auth/signup` and `/auth/login`).
All `POST`, `PATCH`, and `DELETE` endpoints strictly require the `X-CSRF-Token` header.

#### Auth & Households
* `POST /auth/signup`
* `POST /auth/login`
* `POST /auth/logout`
* `GET /auth/me`
* `GET /households/me`

#### Documents
* `GET /documents` - List all household documents
* `POST /documents/upload` - Upload a document (`multipart/form-data`) and trigger processing
* `GET /documents/{id}` - Get document metadata and extracted fields
* `GET /documents/{id}/download` - Download the physical document file securely
* `PATCH /documents/{id}` - Update document metadata
* `DELETE /documents/{id}` - Delete a document and its stored physical file

#### Extracted Fields
* `GET /fields/{id}` - Get field details
* `PATCH /fields/{id}` - Update extracted field value or confirmation status

#### Readiness Scores
* `GET /scores` - List all score dimensions for the household

#### Tasks
* `GET /tasks` - List all household tasks
* `POST /tasks` - Create a new task
* `GET /tasks/{id}` - Get task details
* `PATCH /tasks/{id}` - Update task details
* `DELETE /tasks/{id}` - Delete a task

### Storage & Security Information
* **Local Storage Directory**: Files are stored securely in `./storage` (configurable via `STORAGE_DIR`).
* **Upload Limits**: Maximum file upload size is set to 5 MB (`MAX_UPLOAD_SIZE`). Empty files are rejected.
* **File Naming**: To prevent path traversal attacks, physical files are named using random UUIDs rather than user-provided filenames. The original filename is stored strictly as metadata.
* **Supported Extraction Formats**: Only `text/plain` files are parsed for extraction. All other formats are securely stored but skip extraction, transitioning immediately to a `COMPLETED` upload status.
* **Processing Lifecycle**: Documents transition from `UPLOADED` -> `PROCESSING` -> `COMPLETED` (or `FAILED`).

### Current Limitations
* Document file upload leverages local filesystem storage, meaning it is not yet scalable (to be adapted to S3/Azure Blob).
* ML-based OCR extraction and parsing is mocked and not yet implemented (Phase 4 scope).
* Readiness scoring algorithms are not yet integrated into the backend.
* Guardian Vault and Shamir Secret Sharing is strictly a frontend prototype right now.
