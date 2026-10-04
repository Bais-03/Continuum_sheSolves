# Continuum — System Architecture

> **Documents are not readiness. Continuum measures it, maps it, and turns missing knowledge into actions a successor can rehearse.**

Continuum is a modular prototype for **successor readiness in households**. The system combines document processing, human confirmation, readiness scoring, a household knowledge graph, knowledge-gap detection, Day-Zero action generation, and a guardian-release concept.

---

## 1. Architecture Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                         USER / BROWSER                       │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND — REACT                         │
│                                                             │
│  Dashboard → Upload & Confirm → Knowledge Graph             │
│                              → Day-Zero → Guardian Release   │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP / JSON
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    FASTAPI BACKEND                           │
│                                                             │
│  Auth / Household / Documents / Fields / Scores / Tasks    │
│                           │                                 │
│            ┌──────────────┼───────────────┐                 │
│            ▼              ▼               ▼                 │
│      Document Data   Readiness Engine   Graph Service        │
│                                             │               │
│                         ┌───────────────────┤               │
│                         ▼                   ▼               │
│                 NetworkX Graph       Gap Detector           │
│                                             │               │
│                                             ▼               │
│                                      Day-Zero Generator      │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    PERSISTENCE LAYER                         │
│                                                             │
│                         SQLite                              │
│              Users · Households · Documents                 │
│                    · Extracted Fields                        │
└─────────────────────────────────────────────────────────────┘
```

The architecture follows the product flow:

```text
UPLOAD
   ↓
EXTRACT
   ↓
CONFIRM
   ↓
MAP
   ↓
SCORE
   ↓
SIMULATE
   ↓
ACT
```

---

# 2. Repository Structure

```text
Continuum/
│
├── frontend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── dashboard.tsx
│   │   │   ├── upload.tsx
│   │   │   ├── graph.tsx
│   │   │   ├── playbook.tsx
│   │   │   └── guardian.tsx
│   │   │
│   │   ├── components/
│   │   │   └── ui/
│   │   │
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   └── store.ts
│   │   │
│   │   ├── router.tsx
│   │   ├── start.ts
│   │   ├── server.ts
│   │   └── styles.css
│   │
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints/
│   │   │   └── router.py
│   │   │
│   │   ├── graph/
│   │   │   ├── entities.py
│   │   │   ├── relationships.py
│   │   │   ├── builder.py
│   │   │   ├── normalizer.py
│   │   │   └── gap_detector.py
│   │   │
│   │   ├── dayzero/
│   │   │   ├── generator.py
│   │   │   └── prioritizer.py
│   │   │
│   │   ├── services/
│   │   │   └── graph_service.py
│   │   │
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── db/
│   │   └── main.py
│   │
│   ├── tests/
│   │   ├── test_graph.py
│   │   └── test_dayzero.py
│   │
│   ├── requirements.txt
│   └── ...
│
├── docs/
│   └── ARCHITECTURE.md
│
├── .gitignore
└── README.md
```

---

# 3. Frontend Architecture

The frontend is implemented with **React + TypeScript**, with TanStack Router handling application routes.

### Main routes

| Route | Responsibility |
|---|---|
| Dashboard | Household readiness overview |
| Upload & Confirm | Document upload, extraction review, and field confirmation |
| Knowledge Graph | Visualize entities, relationships, and knowledge gaps |
| Day-Zero | Display backend-generated prioritized actions |
| Guardian Release | Demonstrate the guardian/vault workflow |

### Frontend responsibilities

The frontend is responsible for:

- presenting household readiness,
- collecting document uploads,
- displaying extracted fields,
- allowing human confirmation/rejection,
- requesting graph analysis,
- rendering graph relationships,
- displaying knowledge gaps,
- displaying Day-Zero actions,
- allowing Day-Zero action completion,
- presenting the guardian-release experience.

The frontend should **not independently recreate backend graph logic** when the backend already provides the authoritative graph analysis.

---

# 4. Backend Architecture

The backend uses **FastAPI** and separates API routing, domain models, graph logic, Day-Zero generation, and persistence.

```text
FastAPI
  │
  ├── Authentication
  ├── Household APIs
  ├── Document APIs
  ├── Field confirmation APIs
  ├── Readiness APIs
  ├── Task APIs
  └── Graph analysis API
```

The backend is the authoritative source for persisted household data and graph-derived analysis.

---

# 5. Document and Confirmation Pipeline

The document pipeline follows:

```text
Document Upload
      ↓
Document Record
      ↓
Field Extraction
      ↓
Extracted Fields
      ↓
Human Review
      ↓
CONFIRMED / REJECTED / UNCONFIRMED
```

Only information that passes the application's confirmation rules should become trusted household knowledge for downstream graph analysis.

This distinction is important:

```text
Extracted ≠ Trusted
Confirmed = Eligible for household mapping
```

The current prototype uses synthetic/mock document extraction rather than claiming production OCR or LLM extraction.

---

# 6. Readiness Engine

Continuum measures readiness across seven dimensions:

1. Asset Discovery
2. Beneficiary Completeness
3. Deadline Awareness
4. Liability Awareness
5. Document Accessibility
6. Successor Knowledge
7. Emergency Contacts

Conceptually:

```text
Confirmed Household Facts
          ↓
     Readiness Rules
          ↓
  Seven Dimension Scores
          ↓
    Overall Readiness
          ↓
       Biggest Gaps
```

The readiness score is a **prototype, rule-based measurement** and should not be interpreted as a validated financial or legal benchmark.

---

# 7. Knowledge Graph Architecture

The graph layer converts confirmed household information into entities and typed relationships.

### Entity types

```text
PERSON
ASSET
LIABILITY
DOCUMENT
CONTACT
```

### Relationship types

```text
OWNS
BORROWS
HAS_DOCUMENT
HAS_BENEFICIARY
HAS_CONTACT
KNOWS
```

Example:

```text
Arjun Sharma
    │
    ├── OWNS ──────────────→ HDFC Savings Account
    │                              │
    │                              └── HAS_BENEFICIARY → Kavya Sharma
    │
    ├── OWNS ──────────────→ Pune Family Home
    │                              │
    │                              └── missing beneficiary ← GAP
    │
    ├── BORROWS ────────────→ HDFC Home Loan
    │
    └── HAS_CONTACT ────────→ Neha Sharma
```

---

# 8. Graph Normalization

The normalizer is responsible for converting extracted field labels into graph concepts.

An important design rule is:

> **Relationship metadata and contact metadata should not accidentally become independent household entities.**

For example:

```text
Nominee: Kavya Sharma
Nominee Relationship: Daughter
```

should produce:

```text
HAS_BENEFICIARY → Kavya Sharma
```

and should **not** create:

```text
PERSON → Daughter
```

Similarly:

```text
Emergency Contact: Neha Sharma
Emergency Contact Relationship: Spouse
Emergency Contact Phone: +91-...
```

should produce:

```text
HAS_CONTACT → Neha Sharma
```

while relationship/phone values remain metadata rather than graph entities.

This normalization layer prevents noisy or semantically incorrect graph nodes.

---

# 9. Graph Builder

The `KnowledgeGraphBuilder` uses **NetworkX `MultiDiGraph`**.

Its responsibilities include:

- adding typed entities,
- adding validated relationships,
- preserving entity metadata,
- validating relationship source/target types,
- constructing a graph for downstream analysis.

Example:

```text
PERSON ──OWNS──→ ASSET
PERSON ──BORROWS──→ LIABILITY
ASSET ──HAS_BENEFICIARY──→ PERSON
PERSON ──HAS_CONTACT──→ CONTACT
```

Invalid relationship combinations should be rejected rather than silently inserted into the graph.

---

# 10. Knowledge-Gap Detection

The graph is not only a visualization.

It is an analysis structure.

The gap detector examines graph relationships to identify missing information.

Example:

```text
Pune Family Home
       │
       └── HAS_BENEFICIARY → missing
                              ↓
                         Knowledge Gap
                              ↓
                            HIGH
```

The prototype currently includes relationship-based gap detection for areas such as:

- missing beneficiary relationships,
- missing emergency-contact relationships.

The gap detector should avoid false positives, such as treating a beneficiary-only person as a household-responsible person requiring an emergency-contact relationship.

---

# 11. Day-Zero Architecture

Day-Zero converts graph gaps into prioritized actions.

```text
Knowledge Graph
      ↓
Gap Detector
      ↓
GraphGap
      ↓
GapPrioritizer
      ↓
DayZeroGenerator
      ↓
DayZeroAction
```

A Day-Zero action contains:

```text
title
description
priority
gap_type
entity_id
```

Example:

```json
{
  "title": "Register beneficiary",
  "description": "Beneficiary information is missing for Pune Family Home.",
  "priority": "high",
  "gap_type": "beneficiary",
  "entity_id": "..."
}
```

This creates the project's most important traceability chain:

```text
Missing relationship
       ↓
Knowledge gap
       ↓
Priority
       ↓
Concrete action
```

---

# 12. Dynamic Day-Zero Frontend

The Day-Zero page consumes backend-generated actions rather than relying on a fixed generic checklist.

```text
POST /api/v1/graph/analyze
            ↓
GraphAnalysis
            ↓
analysis.actions
            ↓
Day-Zero Playbook
```

For example:

```text
Graph:
Pune Family Home
        ↓
Missing beneficiary
        ↓
HIGH priority gap
        ↓
Day-Zero:
"P1 — Register beneficiary"
```

The UI also supports completing generated actions and displaying completion progress.

---

# 13. Guardian Architecture

The project includes a Guardian Release experience based on the prototype's threshold-release concept.

The conceptual flow is:

```text
Guardian 1 ─┐
Guardian 2 ─┼── 2-of-3 threshold ──→ Release
Guardian 3 ─┘
```

The project materials describe **Shamir 2-of-3** and **AES-GCM** as part of the prototype.

However, production-grade security is explicitly outside the current prototype boundary.

Future work includes:

- stronger client-side encryption,
- security hardening,
- production key management,
- production deployment,
- formal security review.

---

# 14. Data Flow

The complete application data flow is:

```text
                 ┌──────────────┐
                 │    Upload    │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │  Extraction  │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │ Confirmation │
                 └──────┬───────┘
                        ↓
              ┌────────────────────┐
              │ Confirmed Household│
              │       Facts        │
              └─────────┬──────────┘
                        ↓
              ┌────────────────────┐
              │  Readiness Engine  │
              └─────────┬──────────┘
                        │
              ┌─────────┴─────────┐
              ↓                   ↓
       Readiness Score       Knowledge Graph
                                  ↓
                           Gap Detection
                                  ↓
                           Prioritization
                                  ↓
                           Day-Zero Action
```

This architecture keeps **measurement** and **action generation** connected.

---

# 15. Persistence

The current backend uses **SQLite** for prototype persistence.

Conceptually:

```text
Household
   │
   ├── Documents
   │      └── Extracted Fields
   │
   ├── Readiness / Scores
   │
   └── Tasks / Actions
```

The database provides persistence across requests, while the knowledge graph is constructed for analysis from the relevant household data.

---

# 16. API Boundary

The frontend communicates with the backend through API contracts.

Important domains include:

```text
/auth
/households
/documents
/fields
/scores
/tasks
/graph
```

The graph analysis endpoint is conceptually:

```text
POST /api/v1/graph/analyze
```

It can analyze:

- supplied graph fields, or
- the authenticated household's persisted confirmed data.

The response contains:

```text
entities
relationships
gaps
actions
```

This allows the frontend to remain focused on presentation while the backend owns graph analysis.

---

# 17. Testing Architecture

The project includes focused backend tests for the graph and Day-Zero layers.

Current focused P3 validation:

```text
19 passed
```

The test coverage includes areas such as:

- entity modeling,
- relationship validation,
- graph construction,
- normalization,
- beneficiary detection,
- contact detection,
- false-positive prevention,
- priority ordering,
- Day-Zero generation.

The application has also been manually validated through a synthetic end-to-end flow:

```text
Upload
  ↓
Extract
  ↓
Confirm All
  ↓
Readiness Score
  ↓
Knowledge Graph
  ↓
Knowledge Gap
  ↓
Day-Zero Action
  ↓
Complete Action
```

---

# 18. Current Implementation Boundary

### Implemented in the current prototype

- React + TypeScript frontend
- Dashboard/readiness view
- `.txt` / `.md` synthetic/mock extraction
- Human confirmation/editing
- FastAPI backend
- SQLite persistence
- authenticated household data flow
- readiness scoring
- NetworkX knowledge graph
- relationship normalization
- graph gap detection
- priority logic
- dynamic Day-Zero generation
- dynamic Day-Zero frontend integration
- browser-side AES-GCM / Shamir 2-of-3 prototype
- backend automated tests

### Not yet production-grade

- OCR for arbitrary scanned documents
- LLM-assisted production extraction
- client-side end-to-end encryption architecture
- production authentication/security hardening
- production key management
- production multi-user deployment
- large-scale storage/infrastructure
- real-world document validation at scale

These should be presented as future enhancements rather than current production capabilities.

---

# 19. Architecture Principles

### 1. Confirm before trusting

Extracted information should not automatically become trusted household knowledge.

### 2. Graph relationships matter

The system should reason about how people, assets, liabilities, contacts, and beneficiaries connect.

### 3. Missing relationships are actionable

A gap is valuable only when it can lead to a concrete next step.

### 4. Backend owns domain logic

The frontend visualizes and interacts with the analysis; it should not duplicate authoritative graph/gap rules.

### 5. Prototype honestly

Synthetic/mock extraction and prototype security mechanisms should be clearly distinguished from production capabilities.

### 6. Modular by responsibility

Document processing, readiness scoring, graph construction, gap detection, Day-Zero generation, and guardian functionality should remain independently testable.

---

# 20. Future Evolution

The architecture can evolve toward:

```text
Current Prototype
      ↓
OCR + richer extraction
      ↓
LLM-assisted field interpretation
      ↓
Real-world document validation
      ↓
Stronger client-side security
      ↓
Production key management
      ↓
Security review
      ↓
Production deployment
```

The knowledge graph and Day-Zero layers can also evolve toward richer relationship types, persisted task state, due dates, related records, and more sophisticated successor simulations.

---

# 21. Architecture Summary

Continuum's core architecture can be summarized in one sentence:

> **Continuum converts confirmed household information into a readiness model, a relationship graph, actionable knowledge gaps, and a prioritized Day-Zero plan.**

The key technical chain is:

```text
Documents
   ↓
Extracted Fields
   ↓
Human Confirmation
   ↓
Confirmed Facts
   ├──────────────→ Readiness Score
   │
   └──────────────→ Knowledge Graph
                          ↓
                    Gap Detection
                          ↓
                    Prioritization
                          ↓
                    Day-Zero Actions
```

This is the architectural foundation for moving Continuum from a document-oriented prototype toward a genuine **successor-readiness platform**.
