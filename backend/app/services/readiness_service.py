
from datetime import datetime, timezone
from typing import Dict, List, Optional, Iterable
import re
import unicodedata

from sqlalchemy.orm import Session

from app.models.domain import Document, ExtractedField, ReadinessScore


DIMENSIONS_CONFIG = [
    # Transparent prototype targets, not statistically validated thresholds.
    {"key": "asset", "label": "Asset discovery", "weight": 1.0, "base": 20.0, "target_slots": 4},
    {"key": "beneficiary", "label": "Beneficiary completeness", "weight": 1.5, "base": 15.0, "target_slots": 3},
    {"key": "deadline", "label": "Deadline awareness", "weight": 1.0, "base": 20.0, "target_slots": 3},
    {"key": "liability", "label": "Liability awareness", "weight": 1.0, "base": 20.0, "target_slots": 3},
    {"key": "access", "label": "Document accessibility", "weight": 1.25, "base": 15.0, "target_slots": 3},
    {"key": "successor", "label": "Successor knowledge", "weight": 1.5, "base": 15.0, "target_slots": 3},
    {"key": "contacts", "label": "Emergency contacts", "weight": 1.0, "base": 20.0, "target_slots": 3},
]


def classify_dimension(label: str) -> str:
    """Map a field label to one of the seven readiness dimensions."""
    s = (label or "").lower()

    if any(k in s for k in ["nominee", "beneficiar"]):
        return "beneficiary"
    if any(k in s for k in ["due", "date", "emi", "renew", "expiry", "deadline"]):
        return "deadline"
    if any(k in s for k in ["loan", "debt", "outstanding", "credit", "mortgage", "liability"]):
        return "liability"
    if any(k in s for k in ["location", "kept", "locker", "password", "key", "access", "almirah", "shelf"]):
        return "access"
    if any(k in s for k in ["contact", "phone", "doctor", "hospital", "emergency"]):
        return "contacts"
    if any(k in s for k in ["call", "advisor", "ca", "lawyer", "successor", "trustee"]):
        return "successor"

    return "asset"


# Conservative aliases: labels are merged only where their meaning is clear.
_LABEL_ALIASES = {
    "nominee name": "beneficiary",
    "beneficiary name": "beneficiary",
    "nominee": "beneficiary",
    "beneficiary": "beneficiary",
    "emi date": "payment deadline",
    "due date": "payment deadline",
    "deadline": "payment deadline",
    "renewal date": "renewal deadline",
    "expiry date": "renewal deadline",
    "emergency phone": "emergency contact",
    "phone number": "contact number",
    "mobile number": "contact number",
    "contact number": "contact number",
    "emergency contact": "emergency contact",
    "policy number": "policy identifier",
    "account number": "account identifier",
}


def normalize_evidence_label(label: Optional[str]) -> str:
    """Normalize labels so obvious duplicate fields share one evidence slot."""
    value = unicodedata.normalize("NFKC", label or "").casefold().strip()
    value = re.sub(r"[^\w\s]", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    return _LABEL_ALIASES.get(value, value)


def has_meaningful_value(value: Optional[str]) -> bool:
    """Reject empty and common placeholder values."""
    if value is None:
        return False

    normalized = value.strip().casefold()
    return normalized not in {
        "",
        "n/a",
        "na",
        "none",
        "null",
        "unknown",
        "tbd",
        "-",
        "not available",
    }


def calculate_dimension_score(
    base: float,
    target_slots: int,
    confirmed_fields: Iterable[object],
) -> Dict:
    """
    Calculate an explainable score from distinct meaningful evidence labels.

    Only fields passed as confirmed_fields can contribute. The caller is
    responsible for filtering by confirmation status.
    """
    confirmed_fields = list(confirmed_fields)

    meaningful = [
        field
        for field in confirmed_fields
        if has_meaningful_value(getattr(field, "extracted_value", None))
    ]

    unique_labels = {
        normalize_evidence_label(getattr(field, "field_label", ""))
        for field in meaningful
    }
    unique_labels.discard("")

    target_slots = max(1, int(target_slots))
    coverage = min(len(unique_labels) / target_slots, 1.0)
    score = min(100.0, base + (100.0 - base) * coverage)

    return {
        "score": round(score, 1),
        "evidence_count": len(unique_labels),
        "target_slots": target_slots,
        "coverage": round(coverage, 3),
        "duplicate_count": max(0, len(meaningful) - len(unique_labels)),
        "empty_value_count": len(confirmed_fields) - len(meaningful),
    }


class ReadinessService:

    @staticmethod
    def calculate_and_save_scores(db: Session, household_id: str) -> Dict:
        """
        Calculate and persist readiness scores using confirmed evidence
        from documents belonging to the specified household.
        """
        docs = (
            db.query(Document)
            .filter(Document.household_id == household_id)
            .all()
        )
        doc_ids = [doc.id for doc in docs]

        all_fields = []
        if doc_ids:
            all_fields = (
                db.query(ExtractedField)
                .filter(ExtractedField.document_id.in_(doc_ids))
                .all()
            )

        dim_fields: Dict[str, List[ExtractedField]] = {
            config["key"]: [] for config in DIMENSIONS_CONFIG
        }

        for field in all_fields:
            dim_key = field.readiness_dimension or classify_dimension(
                field.field_label
            )

            if dim_key in dim_fields:
                dim_fields[dim_key].append(field)
            else:
                dim_fields["asset"].append(field)

        now = datetime.now(timezone.utc)
        dimension_breakdowns = []
        total_weighted_score = 0.0
        total_weight = sum(config["weight"] for config in DIMENSIONS_CONFIG)

        for config in DIMENSIONS_CONFIG:
            key = config["key"]
            label = config["label"]
            weight = config["weight"]
            base = config["base"]
            target_slots = config["target_slots"]

            fields = dim_fields[key]

            confirmed = [
                field for field in fields
                if field.confirmation_status == "CONFIRMED"
            ]
            unconfirmed = [
                field for field in fields
                if field.confirmation_status == "UNCONFIRMED"
            ]
            rejected = [
                field for field in fields
                if field.confirmation_status == "REJECTED"
            ]

            score_result = calculate_dimension_score(
                base=base,
                target_slots=target_slots,
                confirmed_fields=confirmed,
            )
            score = score_result["score"]

            explanations = []

            if not confirmed:
                explanations.append(
                    f"No confirmed items for {label.lower()} yet."
                )
            else:
                explanations.append(
                    f"{len(confirmed)} field(s) confirmed; "
                    f"{score_result['evidence_count']} distinct meaningful "
                    "evidence slot(s) count toward coverage."
                )

            if score_result["duplicate_count"]:
                explanations.append(
                    f"{score_result['duplicate_count']} duplicate field(s) "
                    "did not increase evidence coverage."
                )

            if score_result["empty_value_count"]:
                explanations.append(
                    f"{score_result['empty_value_count']} confirmed "
                    "field(s) contained empty or placeholder values "
                    "and did not count as evidence."
                )

            explanations.append(
                f"Evidence coverage: {score_result['evidence_count']}/"
                f"{target_slots} slots "
                f"({round(score_result['coverage'] * 100)}%)."
            )

            if unconfirmed:
                pending_labels = [
                    f"'{field.field_label}'"
                    for field in unconfirmed[:3]
                ]
                explanations.append(
                    f"{len(unconfirmed)} field(s) pending confirmation: "
                    f"{', '.join(pending_labels)}"
                )

            if rejected:
                explanations.append(
                    f"{len(rejected)} field(s) marked rejected."
                )

            if score >= 100.0:
                explanations.append(
                    "Dimension score is fully maximized."
                )

            dimension_breakdowns.append({
                "dimension": key,
                "label": label,
                "score": round(score, 1),
                "weight": weight,
                "base": base,
                "confirmed_count": len(confirmed),
                "unconfirmed_count": len(unconfirmed),
                "rejected_count": len(rejected),
                "evidence_count": score_result["evidence_count"],
                "target_slots": score_result["target_slots"],
                "coverage": score_result["coverage"],
                "duplicate_count": score_result["duplicate_count"],
                "empty_value_count": score_result["empty_value_count"],
                "explanations": explanations,
            })

            total_weighted_score += score * weight

            score_rec = (
                db.query(ReadinessScore)
                .filter(
                    ReadinessScore.household_id == household_id,
                    ReadinessScore.dimension == key,
                )
                .first()
            )

            if score_rec:
                score_rec.score = round(score, 1)
                score_rec.weight = weight
                score_rec.calculation_timestamp = now
            else:
                score_rec = ReadinessScore(
                    household_id=household_id,
                    dimension=key,
                    score=round(score, 1),
                    weight=weight,
                    calculation_timestamp=now,
                )
                db.add(score_rec)

        db.commit()

        overall_score = (
            round(total_weighted_score / total_weight)
            if total_weight > 0
            else 0
        )

        return {
            "overall_score": overall_score,
            "dimensions": dimension_breakdowns,
            "last_calculated": now,
        }

    @staticmethod
    def get_household_scores(db: Session, household_id: str) -> Dict:
        """Retrieve and recalculate scores to keep the response up to date."""
        return ReadinessService.calculate_and_save_scores(db, household_id)
