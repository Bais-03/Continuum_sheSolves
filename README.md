# Continuum

## Successor Readiness for Households

> **Continuum is designed around readiness rather than storage.**
>
> It helps households understand what exists, what is missing, what a successor would need to know, and what should happen first during a crisis.

**Domain:** FinTech · Digital Legacy  
**Team:** Clock it  
**Problem Statement:** Continuum — Successor Readiness for Households

---

## Overview

One person often holds most of a household's financial knowledge. If that person dies or becomes unavailable, the family may have to reconstruct that knowledge while already dealing with a difficult situation.

Continuum approaches this problem as a **successor-readiness problem**, rather than simply a document-storage problem.

Instead of only storing documents and providing access, Continuum aims to:

- measure household readiness,
- identify knowledge gaps,
- map household information into a knowledge graph,
- simulate the first 30 days after a disruption,
- generate a prioritized action playbook, and
- support guardian threshold release.

---

## The Core Idea

### Traditional storage-first approach

```text
Store documents
      ↓
Provide access
      ↓
Depend on manual discovery
```

### Continuum

```text
Measure readiness
      ↓
Identify knowledge gaps
      ↓
Build household knowledge graph
      ↓
Simulate Day-Zero
      ↓
Generate prioritized action playbook
      ↓
Support guardian threshold release
```

The central idea is simple:

> **Documents are not readiness. Continuum measures readiness and turns missing knowledge into actionable next steps.**

---

## How Continuum Works

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

### 1. Upload

The prototype accepts synthetic household documents through the document workflow.

The presentation currently describes **8 synthetic document types**.

### 2. Extract

Fields are extracted from uploaded documents and associated with confidence scores.

The current prototype uses a **`.txt` / `.md` mock extractor**. OCR and LLM-assisted extraction are identified as future enhancements.

### 3. Confirm

A person reviews and confirms extracted information.

This human-confirmation step is important because extracted information is not automatically treated as trusted household knowledge.

### 4. Map

Confirmed information is mapped into a **household knowledge graph**, connecting people, assets, liabilities, documents, and responsibilities.

### 5. Score

Continuum evaluates household readiness across **seven dimensions**, producing dimension scores from 0–100 and an overall readiness score.

### 6. Simulate

The Day-Zero simulator represents the **first 30 days** after the primary knowledge-holder becomes unavailable.

Knowledge gaps are converted into prioritized actions.

### 7. Act

The resulting playbook turns identified gaps into concrete tasks and supports the guardian-release concept.

---

# Key Features

| Feature | Purpose |
|---|---|
| Document workflow | Upload and process synthetic household documents |
| Field extraction | Extract fields with confidence information |
| Human confirmation | Let a person approve extracted fields |
| Household knowledge graph | Map household entities and relationships |
| 7-dimension readiness score | Measure successor readiness |
| Knowledge-gap detection | Highlight missing household relationships/information |
| Day-Zero simulation | Model the first 30 days |
| Prioritized playbook | Convert gaps into actionable tasks |
| Guardian release | Support threshold-based guardian release |
| Shamir 2-of-3 | Represent threshold secret-sharing for guardian release |
| AES-GCM | Represent encrypted vault data |
| SQLite storage | Persist prototype household information |

> These capabilities describe the project as presented in the official prototype deck. The deck explicitly identifies OCR, LLM-assisted extraction, client-side encryption, security hardening, and production-grade deployment as future enhancements.

---

# Seven Readiness Dimensions

Continuum measures the things a successor would need to understand.

| Dimension | What it represents |
|---|---|
| **Asset Discovery** | Whether important household assets are known |
| **Beneficiary Completeness** | Whether beneficiary/nominee information is sufficiently mapped |
| **Deadline Awareness** | Awareness of important deadlines and time-sensitive obligations |
| **Liability Awareness** | Understanding of household liabilities and obligations |
| **Document Accessibility** | Whether required records can be located and accessed |
| **Successor Knowledge** | How much of the household's important knowledge is transferable |
| **Emergency Contacts** | Availability of relevant emergency/contact information |

Each dimension is represented on a **0–100 scale**.

The prototype uses explicit, rule-based evaluation rather than claiming a real-world benchmark.

---

# Readiness Scoring

The prototype's scoring flow is:

```text
7 dimensions
      ↓
Rule-based evaluation
      ↓
Dimension scores (0–100)
      ↓
Overall readiness score
      ↓
Identified gaps
      ↓
Day-Zero actions
```

The official presentation demonstrates an overall score of **56/100** on synthetic demo data.

This number is a prototype output, **not a real-world benchmark**.

The presentation also uses gold highlighting for dimensions below 60 in the demonstrated readiness view.

---

# Knowledge Graph

Continuum maps confirmed household information into a relationship-oriented representation.

Conceptually:

```text
                    Household Owner
                    /      |       \
                   /       |        \
                Asset    Liability   Contact
                  |
             Beneficiary
```

The graph is intended to make relationships and missing connections visible instead of leaving information scattered across individual documents.

Knowledge gaps can then feed directly into the Day-Zero playbook.

---

# Day-Zero

### The first 30 days

Day-Zero is Continuum's simulation layer for the period immediately following the loss or unavailability of the household's primary knowledge-holder.

Instead of presenting a generic checklist, the prototype connects identified knowledge gaps to prioritized actions.

```text
Knowledge Graph
      ↓
Knowledge Gap
      ↓
Priority
      ↓
Day-Zero Action
```

The official prototype presentation summarizes this as:

> **Each gap becomes a task.**

This creates a direct connection between **readiness measurement** and **action**.

---

# Guardian Release

Continuum includes a Guardian Vault concept based on:

- **Shamir 2-of-3 threshold secret sharing**
- **AES-GCM**
- guardian-based threshold release

The prototype presentation describes the release mechanism as **simulated**.

Conceptually:

```text
Guardian 1 ─┐
Guardian 2 ─┼── 2 of 3 threshold ──→ Vault release
Guardian 3 ─┘
```

The project does **not** claim production-grade security.

The official presentation explicitly identifies:

- client-side encryption,
- security hardening, and
- production-grade deployment

as future enhancements.

---

# Technical Approach

The official architecture is organized around the following layers:

```text
User Browser
     ↓
React Frontend
     ↓
FastAPI Backend
     ↓
Document Pipeline
     ↓
SQLite + Household Model
     ↓
Knowledge Graph
     ↓
Readiness Engine
     ↓
Day-Zero Simulator
     ↓
Guardian Vault
```

### Technology stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Frontend tooling | Vite |
| Frontend language | TypeScript |
| Styling | Tailwind CSS |
| Backend | FastAPI |
| Backend language | Python |
| API/data validation | Pydantic |
| API style | REST / JSON |
| Prototype database | SQLite |
| Knowledge graph | NetworkX |
| Readiness evaluation | Rule-based scoring and gaps |
| Document extraction | `.txt` / `.md` mock extractor |
| Guardian threshold concept | Shamir 2-of-3 |
| Encryption concept | AES-GCM |

---

# Current Prototype Status

The official project presentation identifies the following as implemented in the prototype:

- `.txt` / `.md` extraction using a mock extractor
- rule-based scoring and gap detection
- NetworkX knowledge graph
- SQLite storage
- Shamir 2-of-3
- AES-GCM
- automated backend tests
- a working end-to-end prototype flow
- local/offline execution
- synthetic dataset

The presentation reports **31 automated backend tests** for the prototype snapshot represented in the deck.

---

# Prototype Workflow

The demonstrated application flow is:

```text
┌───────────────┐
│  1 Dashboard  │
│ Readiness     │
│ Score         │
└───────┬───────┘
        ↓
┌────────────────────┐
│ 2 Upload & Confirm │
│ Extract → Review   │
└────────┬───────────┘
         ↓
┌────────────────────┐
│ 3 Knowledge Graph  │
│ Entities + Gaps    │
└────────┬───────────┘
         ↓
┌────────────────────┐
│ 4 Day-Zero         │
│ Prioritized Tasks  │
└────────┬───────────┘
         ↓
┌────────────────────┐
│ 5 Guardian Release │
│ Threshold concept  │
└────────────────────┘
```

The presentation describes this as a **working end-to-end workflow**.

---

# Impact and Benefits

Continuum is intended to help:

### Women in husband-managed households

The presentation identifies women in husband-managed households, roughly ages 35–65, as one important audience: helping them see what exists before a crisis.

### Adult children and guardians

Continuum can help adult children and guardians understand where important records are and what should happen first.

### Potential benefits

- **Social:** less confusion and fewer rushed decisions
- **Economic:** fewer missed premiums and EMIs, without promising savings
- **Environmental:** potentially fewer duplicate paper copies

The presentation explicitly identifies these as intended benefits rather than measured outcomes.

---

# Risks and Design Considerations

Continuum is presented as a prototype and intentionally addresses several risks:

| Risk | Prototype response |
|---|---|
| Privacy | Synthetic data currently; client-side encryption planned |
| Messy documents | Confidence scores + human confirmation |
| Being mistaken for financial advice | Labeled checklist and planned expert review before any pilot |

The system is therefore positioned as a **readiness and organizational tool**, not as financial or legal advice.

---

# Current Limitations

The official presentation identifies these limitations:

1. **Mock extractor**
2. **Synthetic documents**
3. **Guardian release is simulated**

The current prototype should therefore not be treated as a production financial-legacy platform.

---

# Future Enhancements

The project roadmap includes:

- OCR for scanned documents
- LLM-assisted extraction
- client-side encryption
- security hardening
- production-grade deployment
- real-world document testing
- user/advisor validation

These are future enhancements, not claims about the current prototype.

---

# Validation Roadmap

The presentation identifies four next validation areas:

```text
1. OCR / LLM extraction
          ↓
2. Real-world document testing
          ↓
3. Security hardening
          ↓
4. User / advisor validation
```

This progression is intended to move the prototype from synthetic/local validation toward broader validation.

---

# Why Continuum Is Different

Continuum does not begin with the question:

> "Where are my documents?"

It begins with:

> **"If I were unavailable tomorrow, would my successor be ready?"**

That changes the product from a passive storage layer into a readiness-oriented workflow:

```text
Documents
   ↓
Knowledge
   ↓
Relationships
   ↓
Readiness
   ↓
Gaps
   ↓
Actions
   ↓
Preparedness
```

---

# Demo Data

The prototype uses **synthetic documents and synthetic household data**.

This is intentional: the presentation explicitly identifies synthetic data/documents as part of the current prototype and lists real-world document testing as a next validation step.

Do not use real sensitive financial or identity documents for a prototype demonstration unless the system has been appropriately hardened and validated for that purpose.

---

# Project Structure

The prototype follows a frontend/backend architecture with dedicated layers for the document pipeline, household model, readiness logic, knowledge graph, Day-Zero simulation, and guardian functionality.

A high-level representation is:

```text
Continuum/
├── frontend/
│   ├── React / TypeScript UI
│   ├── Dashboard
│   ├── Upload & Confirm
│   ├── Knowledge Graph
│   ├── Day-Zero
│   └── Guardian Release
│
├── backend/
│   ├── FastAPI API
│   ├── Household / document state
│   ├── Readiness engine
│   ├── Knowledge graph
│   ├── Day-Zero simulator
│   └── Guardian / vault logic
│
└── README.md
```

> The detailed repository structure should be treated as implementation-specific; this README intentionally keeps this section at the architecture level.

---

# Local Prototype

The official presentation describes Continuum as capable of **local / offline execution** using synthetic data.

Because the exact repository scripts and environment configuration are implementation-specific, follow the setup instructions provided with the project codebase when running the prototype locally.

---

# Security Position

Continuum handles a sensitive problem domain, so technical honesty is important.

The prototype presentation identifies AES-GCM and Shamir 2-of-3 as implemented technologies/concepts, while also explicitly listing **client-side encryption and security hardening as future enhancements**.

Accordingly, Continuum should **not** be described as:

- bank-grade security,
- military-grade security,
- fully secure,
- unhackable,
- production-ready security, or
- guaranteed privacy.

It is a hackathon/prototype system demonstrating the architecture and workflow.

---

# Research and References

The official presentation references:

### Problem context

1. **Merrill Lynch & Age Wave (2018)** — survey on financial challenges of widowhood.
2. **Reserve Bank of India (2023)** — UDGAM portal for searching unclaimed deposits.
3. **Rajya Sabha reply, 11 Aug 2026** — unclaimed deposits in the RBI's DEA Fund, reported as ₹86,917 crore as of 30 Jun 2026.

### Technology

- Shamir, A. (1979). *How to Share a Secret*. Communications of the ACM, 22(11).
- NIST SP 800-38D — AES Galois/Counter Mode.
- PyCryptodome — Shamir secret sharing.
- FastAPI documentation.
- NetworkX documentation.
- React documentation.
- Vite documentation.
- Tailwind CSS documentation.

---

# Project Links

**GitHub Repository**

https://github.com/Bais-03/Continuum_sheSolves

**Demo Video**

https://www.youtube.com/watch?v=1Gdug3ZF8nk

---

# Team

## Clock it

**Continuum — Successor Readiness for Households**

Built for **SHE SOLVES 3.0**.

---

## Prototype Disclaimer

Continuum is a prototype created for demonstration and validation.

It uses synthetic data and should not be treated as financial, legal, investment, insurance, or estate-planning advice.

The readiness score is a rule-based prototype output and **not a real-world benchmark**.

Guardian release is simulated, and several production capabilities remain future enhancements.

---

## The Continuum Principle

> **Documents are not readiness.**
>
> **Readiness means knowing what exists, understanding what is missing, and knowing what to do next.**
