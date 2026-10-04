# Continuum — Modularized Prototype

Continuum is a household successor-readiness prototype. It measures whether the person who may need to take over a household can discover, understand and act on important financial/administrative information.

## Run

```bash
cd frontend
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Structure

```text
Continuum_Modularized/
├── frontend/
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── continuum-mark.png
│   │   └── robots.txt
│   │   └──
│   └── src/
│       ├── components/
│       │   ├── PublicNavbar.tsx
│       │   ├── PublicFooter.tsx
│       │   ├── ProtectedShell.tsx
│       │   └── ui/
│       ├── lib/
│       │   ├── auth.ts
│       │   ├── store.ts
│       │   └── shamir.ts
│       └── routes/
│           ├── index.tsx       # Public landing page
│           ├── about.tsx
│           ├── contact.tsx
│           ├── login.tsx
│           ├── signup.tsx
│           ├── dashboard.tsx  # Existing Continuum dashboard
│           ├── upload.tsx
│           ├── graph.tsx
│           ├── playbook.tsx
│           └── guardian.tsx
├── backend/
└── docs/
```

## User flow

```text
Loading screen
      ↓
Landing page
      ↓
Get Started
  ↙       ↘
Login    Sign up
   \       /
    Dashboard
        ↓
Upload → Graph → Day-Zero → Guardian
        ↓
     Profile / Logout
```

## Prototype authentication

Login/signup are currently browser-local demo authentication. A SHA-256 hash is stored locally with the demo profile. This is **not production authentication** and should be replaced by the future FastAPI/backend auth layer.

## Existing feature preservation

The original dashboard/readiness logic, upload and confirmation flow, knowledge graph, Day-Zero playbook and Guardian AES-GCM + Shamir 2-of-3 prototype remain in the frontend. The public website is layered around those features rather than rewriting their implementation.
