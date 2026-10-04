# Continuum — Public Website and App Flow

## Public experience

- `/` — Landing page with Home, About, Contact and Get Started navigation.
- `/about` — Product story, seven readiness dimensions and feature overview.
- `/contact` — Contact/feedback page with a prototype form.
- `/login` — Demo login.
- `/signup` — Demo account creation.

## Authenticated experience

After login/signup, the user reaches `/dashboard`.

The existing product navigation is preserved:

1. Dashboard
2. Upload & confirm
3. Knowledge graph
4. Day-Zero
5. Guardian release

The top-right profile control shows the user's name/email and provides logout.

## Prototype authentication note

Authentication is intentionally frontend-only in this version. The account and a SHA-256 password hash are stored in browser localStorage. This is suitable for demonstrating the user journey but is **not production authentication**. The future FastAPI/backend work should replace it with server-side identity, password hashing, sessions/tokens, and persistent storage.

## Existing product code

The original dashboard implementation was moved from `/` to `/dashboard` without changing its readiness calculation, document workflow, graph, Day-Zero playbook, or Guardian cryptography implementation. Existing feature files remain separate and are not rewritten by the public-site layer.
