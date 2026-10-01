# Continuum Backend

## Current status

The uploaded Continuum implementation is a frontend-first prototype. It does **not** currently contain a FastAPI/Express backend, database server, or NetworkX backend service.

This folder is intentionally kept separate so the team can add the backend independently without changing the existing frontend UI or implementation.

### Planned backend modules
- `api/` — REST API layer
- `database/` — SQLite persistence
- `services/document_intelligence/` — extraction service
- `services/readiness/` — readiness engine
- `services/graph/` — knowledge graph
- `services/dayzero/` — Day-Zero task engine
- `tests/` — backend tests

Do not treat these planned modules as implemented in the current prototype.
