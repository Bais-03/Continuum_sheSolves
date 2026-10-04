# Continuum — Public Website & Application Flow

> **Continuum — Successor Readiness for Households**
>
> The web experience takes a visitor from the product story into an authenticated readiness workflow: **understand → upload → confirm → map → score → simulate → act**.

---

## 1. Product Flow at a Glance

```text
                    PUBLIC EXPERIENCE
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│                     LANDING PAGE                     │
│                       /                              │
│          Home · About · Contact · Get Started       │
└─────────────────────────┬────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
          /about                   /contact
              │
              ▼
            /signup
              │
              ▼
            /login
              │
              ▼
                 AUTHENTICATED EXPERIENCE
                          │
                          ▼
┌──────────────────────────────────────────────────────┐
│                     DASHBOARD                        │
│                  /dashboard                           │
│                                                      │
│              Readiness score + gaps                  │
└─────────────────────────┬────────────────────────────┘
                          │
                          ▼
                 2. UPLOAD & CONFIRM
                          │
                          ▼
                 3. KNOWLEDGE GRAPH
                          │
                          ▼
                    4. DAY-ZERO
                          │
                          ▼
                 5. GUARDIAN RELEASE
```

The original flow defines the five authenticated stages as Dashboard, Upload & Confirm, Knowledge Graph, Day-Zero, and Guardian Release. fileciteturn57file0L13-L23

---

# 2. Public Website

The public experience introduces the problem before asking the user to enter the application.

## `/` — Landing Page

### Purpose

The landing page explains the core Continuum idea and provides the entry point into the product.

### Primary navigation

```text
Continuum
│
├── Home
├── About
├── Contact
└── Get Started
```

### Main message

The public experience should communicate:

> **If you were unavailable tomorrow, would your successor be ready?**

The page should position Continuum as a **readiness system**, not simply a document-storage application.

---

# 3. `/about` — Product Story

The About page explains:

- the household successor-readiness problem,
- why documents alone are insufficient,
- the seven readiness dimensions,
- the core product features,
- the Continuum workflow.

The seven dimensions are:

```text
Asset Discovery
Beneficiary Completeness
Deadline Awareness
Liability Awareness
Document Accessibility
Successor Knowledge
Emergency Contacts
```

The page should connect these dimensions back to the central product question:

> **What would a successor need to know if the primary knowledge-holder were suddenly unavailable?**

---

# 4. `/contact` — Contact & Feedback

The Contact page provides a lightweight prototype feedback experience.

Typical flow:

```text
Visitor
  ↓
Contact / Feedback Form
  ↓
Submit
  ↓
Prototype confirmation
```

This is a prototype contact experience and should not be presented as a production customer-support system unless a persistent backend workflow is added.

---

# 5. `/signup` — Account Creation

Signup is the entry point into the authenticated application.

```text
Signup
  ↓
Create account
  ↓
Household context
  ↓
Authenticated application
  ↓
Dashboard
```

The current application includes household-aware backend functionality, so authenticated requests can be associated with the relevant household.

---

# 6. `/login` — Authentication

The login page authenticates the user before allowing access to household data.

```text
Login
  ↓
Authenticated session
  ↓
Dashboard
```

### Important security boundary

The original public-flow document described authentication as frontend-only and localStorage-based. fileciteturn57file0L25-L27

The current Continuum implementation has evolved beyond that prototype boundary with backend authentication and authenticated household API access.

Nevertheless, production-grade identity management, deployment security, and comprehensive security hardening should still be treated as future production concerns.

---

# 7. Authenticated Application Shell

After successful authentication, the user enters:

```text
/dashboard
```

The primary application navigation is:

```text
1 Dashboard
2 Upload & confirm
3 Knowledge graph
4 Day-Zero
5 Guardian release
```

This navigation mirrors the product's conceptual progression:

```text
Understand
   ↓
Prepare
   ↓
Map
   ↓
Simulate
   ↓
Release
```

The top-right profile control exposes the current user's identity and logout functionality.

---

# 8. Stage 1 — Dashboard

## `/dashboard`

The dashboard is the user's readiness command center.

### Main responsibilities

It presents:

- overall readiness score,
- seven readiness dimensions,
- biggest readiness gaps,
- actions that can improve readiness,
- a route into the document workflow.

Conceptually:

```text
Household Data
      ↓
Confirmed Facts
      ↓
Readiness Engine
      ↓
┌─────────────────────────────┐
│ Overall Readiness           │
│                             │
│ 7 Dimension Scores          │
│                             │
│ Biggest Gaps                │
└─────────────────────────────┘
```

### Example

```text
Readiness
    56 / 100

Asset Discovery             100
Beneficiary Completeness      75
Deadline Awareness            20
Liability Awareness           60
Document Accessibility        15
Successor Knowledge            35
Emergency Contacts            100
```

The score is a **prototype rule-based readiness measurement**, not a validated financial, legal, or actuarial benchmark.

---

# 9. Stage 2 — Upload & Confirm

## `/upload`

This stage transforms household documents into confirmed household facts.

### Flow

```text
Select document
      ↓
Upload
      ↓
Extract fields
      ↓
Review extracted information
      ↓
Confirm / Reject
      ↓
Confirmed household facts
```

The interface supports both:

- individual field confirmation, and
- **Confirm All** for efficient review of all eligible unconfirmed fields.

### Why confirmation matters

Continuum intentionally separates:

```text
Extracted information
        ≠
Trusted household information
```

Only information that passes the application's confirmation rules should drive downstream household analysis.

---

# 10. Stage 3 — Knowledge Graph

## `/graph`

The Knowledge Graph transforms confirmed information into relationships.

### The graph connects

```text
People
Assets
Liabilities
Documents
Contacts
Beneficiaries
```

### Example

```text
                    Arjun Sharma
                   /     |       \
                  /      |        \
               OWNS     OWNS      OWNS
                ↓        ↓         ↓
           Insurance    Bank    Pune Home
                │        │         │
          BENEFICIARY BENEFICIARY  GAP
                ↓        ↓
             Kavya    Kavya

                 │
              BORROWS
                 ↓
           HDFC Home Loan

                 │
           HAS_CONTACT
                 ↓
            Neha Sharma
```

---

# 11. Graph → Gap Detection

The Knowledge Graph is not only a visualization.

It is an analysis layer.

For example:

```text
Pune Family Home
       │
       └── beneficiary missing
                 ↓
          Knowledge Gap
                 ↓
            HIGH priority
```

The graph page exposes:

- entity count,
- relationship count,
- knowledge-gap count,
- Day-Zero action count,
- interactive graph relationships,
- selected-node information,
- detected gaps,
- generated actions.

The frontend receives the graph analysis from the backend rather than maintaining a separate hardcoded graph model.

---

# 12. Stage 4 — Day-Zero

## `/playbook`

Day-Zero simulates the first 30 days after the primary household knowledge-holder becomes unavailable.

The key difference from a generic checklist is that actions are generated from the **actual knowledge gaps detected in the household graph**.

```text
Knowledge Graph
      ↓
Knowledge Gap
      ↓
Severity / Priority
      ↓
Day-Zero Generator
      ↓
Action
```

Example:

```text
Gap:
Beneficiary missing for Pune Family Home

          ↓

Day-Zero:

P1 — Register beneficiary

Reason:
Beneficiary information is missing for Pune Family Home.
```

---

# 13. Day-Zero Completion

Generated actions can be marked complete.

Example:

```text
Before:

1/1 done
0% complete

☐ P1 Register beneficiary
```

After completion:

```text
1/1 done
100% complete

☑ P1 Register beneficiary
```

The completion state gives the simulation a clear action-oriented endpoint rather than leaving the user with only a score.

---

# 14. Stage 5 — Guardian Release

## `/guardian`

The Guardian Release experience represents the final stage of the Continuum workflow.

The conceptual model is:

```text
Guardian 1 ─┐
Guardian 2 ─┼── 2 of 3 threshold ──→ Release
Guardian 3 ─┘
```

The prototype incorporates the concept of:

- Shamir 2-of-3 threshold sharing
- AES-GCM encrypted data

The guardian flow should be understood as a **prototype release mechanism**, not a production-grade digital estate or financial custody service.

---

# 15. Complete User Journey

A successful user journey looks like:

```text
┌───────────────┐
│   LANDING     │
│      /        │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ ABOUT / STORY  │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ SIGNUP / LOGIN│
└───────┬───────┘
        │
        ▼
┌───────────────┐
│   DASHBOARD   │
│ Readiness     │
└───────┬───────┘
        │
        ▼
┌────────────────┐
│ UPLOAD &       │
│ CONFIRM        │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ KNOWLEDGE      │
│ GRAPH          │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ KNOWLEDGE GAP  │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ DAY-ZERO       │
│ ACTION         │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ ACTION         │
│ COMPLETED      │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ GUARDIAN       │
│ RELEASE        │
└────────────────┘
```

---

# 16. Data Flow Behind the UI

The user sees a simple five-stage application, but the underlying flow is:

```text
Document
   ↓
Extraction
   ↓
Human Confirmation
   ↓
Persisted Household Facts
   ├───────────────┐
   ↓               ↓
Readiness       Graph Normalization
Engine              ↓
   ↓            Knowledge Graph
Score               ↓
                    Gap Detector
                         ↓
                    Prioritizer
                         ↓
                   Day-Zero Action
```

This gives Continuum a traceable relationship between what the user uploads and what the product recommends.

---

# 17. Error and Empty States

Each major stage should have a meaningful state for:

### Loading

```text
Loading household data...
```

### Empty

```text
No confirmed household information yet.
Upload and confirm documents to build readiness.
```

### Error

```text
Unable to load household analysis.
Please try again.
```

The goal is to avoid presenting an empty graph or an apparently healthy household when the backend data is unavailable.

---

# 18. Navigation Rules

The application navigation intentionally mirrors the user's mental journey.

### Dashboard

Answers:

> **How ready are we?**

### Upload & Confirm

Answers:

> **What do we actually know?**

### Knowledge Graph

Answers:

> **How is everything connected?**

### Day-Zero

Answers:

> **What would happen first?**

### Guardian Release

Answers:

> **How could access be released?**

This creates a narrative rather than a collection of disconnected pages.

---

# 19. Current Implementation Boundary

### Implemented

- Public landing experience
- About page
- Contact page
- Signup/login flow
- Authenticated dashboard
- Document upload
- Mock/synthetic `.txt` / `.md` extraction
- Human field confirmation
- Confirm All workflow
- Readiness scoring
- Dynamic NetworkX knowledge graph
- Relationship normalization
- Knowledge-gap detection
- Dynamic Day-Zero generation
- Day-Zero action completion
- Guardian release prototype
- AES-GCM / Shamir prototype concepts
- Backend API integration
- SQLite persistence

### Future / production enhancements

- OCR for arbitrary scanned documents
- LLM-assisted extraction
- stronger production identity/security architecture
- production key management
- client-side end-to-end encryption architecture
- security audit and hardening
- production deployment
- real-world validation with appropriate privacy controls

---

# 20. Product Story in One Flow

The entire website can be understood through one question:

> **If you were unavailable tomorrow, would your successor be ready?**

Continuum answers it progressively:

```text
Dashboard
"How ready are we?"
       ↓
Upload & Confirm
"What do we know?"
       ↓
Knowledge Graph
"How is it connected?"
       ↓
Day-Zero
"What is missing?"
       ↓
Action
"What should happen first?"
       ↓
Guardian Release
"How can access be safely released?"
```

---

# 21. UX Principle

The public website introduces the **problem**.

The authenticated application provides the **evidence**.

The Knowledge Graph exposes the **relationships**.

Day-Zero provides the **action**.

Guardian Release represents the **continuity mechanism**.

Together:

```text
STORY
  ↓
EVIDENCE
  ↓
UNDERSTANDING
  ↓
ACTION
  ↓
CONTINUITY
```

---

# 22. Final Summary

Continuum's web flow is intentionally progressive:

```text
Public Website
      ↓
Authentication
      ↓
Readiness Dashboard
      ↓
Document Confirmation
      ↓
Knowledge Graph
      ↓
Knowledge Gaps
      ↓
Day-Zero Actions
      ↓
Guardian Release
```

The product therefore does more than display documents.

It takes the user from:

> **"What do we have?"**

to:

> **"Is someone else actually ready to manage it?"**

and finally to:

> **"What should we do next?"**

That progression is the core of the Continuum experience.
