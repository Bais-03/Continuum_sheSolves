# Continuum — Modular Project Structure

This package reorganizes the existing Continuum prototype without changing its frontend implementation or visual design.

## Structure

```text
Continuum/
├── frontend/                 # Existing React/TanStack website
│   ├── src/
│   │   ├── routes/            # Dashboard, Upload, Graph, Day-Zero, Guardian
│   │   ├── components/ui/     # Only UI primitives actually imported by the app
│   │   ├── hooks/
│   │   ├── lib/               # Existing store, readiness logic, mock extraction, crypto, utilities
│   │   ├── router.tsx
│   │   ├── start.ts
│   │   ├── server.ts
│   │   ├── routeTree.gen.ts
│   │   └── styles.css
│   ├── public/
│   ├── package.json
│   └── ...
├── backend/                   # Reserved for future backend; not implemented in the uploaded code
└── docs/
    └── ARCHITECTURE.md
```

## Important preservation rule

The source implementation inside `frontend/src` was not refactored or redesigned. Files were only reorganized at the project level and unused UI component files were removed.

The existing website behavior, routes, styling, and UI are intended to remain unchanged.

## Current implementation boundary

Implemented in the frontend:
- Dashboard/readiness score
- `.txt` / `.md` mock extraction
- Human confirmation/editing
- Knowledge graph visualization
- Day-Zero playbook
- Browser AES-GCM + Shamir 2-of-3 prototype
- In-memory state

Not implemented in this uploaded codebase:
- FastAPI backend
- SQLite persistence
- NetworkX backend graph
- OCR/LLM extraction
- production authentication/security
- persistent multi-user storage

See `backend/README.md` before adding backend modules.
