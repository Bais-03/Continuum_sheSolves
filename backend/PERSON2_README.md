# Person 2 — Document Intelligence & Readiness

Owns **UPLOAD → EXTRACT → CONFIRM → SCORE**. Pure Python, JSON in/out. Does not
depend on Person 1's database, Person 3's graph or Person 4's frontend.

```
backend/
├── document_intelligence/   extractor.py classifier.py confidence.py schemas.py tests/ fixtures/
├── readiness/               engine.py scoring.py gaps.py tests/ (JSON fixtures)
└── demo_person2.py
```

## Run
```bash
cd backend
pip install pytest
python -m pytest          # unit tests D01–D08 + extras
python demo_person2.py    # Document -> Extract -> Confirm -> Score -> Gap
```

## How it works
- **Extractor** turns `Label: value` lines into fields; `Section:` headers set the doc type.
  Empty/None/undecodable input returns a document with a warning (never raises).
- **Classifier** maps labels to the 7 dimensions (`asset, beneficiary, deadline, liability,
  access, successor, contacts`) or `unclassified`.
- **Confidence** = label strength (exact 0.85 / keyword 0.70 / none 0.40) ± value-shape check
  (valid date, number, id, name). `Nominee: Priya` → 0.95. Explicit "Missing" → 0.90.
- **Confirm**: `Document.confirm(field_id, value=None)`; only confirmed fields score.
- **Scoring** mirrors the frontend `computeScores`: `min(100, base + 8 pts per confirmed field)`,
  weighted mean (weights 1 / 1.5 / 1 / 1 / 1.25 / 1.5 / 1), same baselines. Missing and
  unclassified fields earn 0 points. Pass `baselines={...}` to `assess()` to override.
- **Gaps**: `missing_value` (high), `low_dimension` (<50) and `low_confidence` (<0.7) (medium),
  `unconfirmed` and `unclassified` (low).

Field output: `{"label":"Nominee","value":"Priya","dimension":"beneficiary","confidence":0.95}`
(`to_dict(full=True)` adds id/missing/confirmed/points).
Readiness output: `ReadinessReport.to_dict()` → `dimensions` (7), `overall`, `gaps`.

## Limits
Rule-based and text-only (TXT/MD), like the frontend mock. No OCR/LLM extraction.
