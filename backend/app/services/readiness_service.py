from datetime import datetime, timezone
from typing import Dict, List, Optional
from sqlalchemy.orm import Session

from app.models.domain import Document, ExtractedField, ReadinessScore

DIMENSIONS_CONFIG = [
    {"key": "asset", "label": "Asset discovery", "weight": 1.0, "base": 20.0},
    {"key": "beneficiary", "label": "Beneficiary completeness", "weight": 1.5, "base": 15.0},
    {"key": "deadline", "label": "Deadline awareness", "weight": 1.0, "base": 20.0},
    {"key": "liability", "label": "Liability awareness", "weight": 1.0, "base": 20.0},
    {"key": "access", "label": "Document accessibility", "weight": 1.25, "base": 15.0},
    {"key": "successor", "label": "Successor knowledge", "weight": 1.5, "base": 15.0},
    {"key": "contacts", "label": "Emergency contacts", "weight": 1.0, "base": 20.0},
]

def classify_dimension(label: str) -> str:
    """Map a field label to one of the 7 standard readiness dimensions."""
    s = label.lower()
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

class ReadinessService:
    @staticmethod
    def calculate_and_save_scores(db: Session, household_id: str) -> Dict:
        """
        Calculates readiness scores per dimension and overall score based strictly
        on CONFIRMED fields for documents belonging to the household.
        Persists calculation in readiness_scores table.
        """
        # Fetch all documents and fields for the household
        docs = db.query(Document).filter(Document.household_id == household_id).all()
        doc_ids = [d.id for d in docs]
        
        all_fields = []
        if doc_ids:
            all_fields = db.query(ExtractedField).filter(ExtractedField.document_id.in_(doc_ids)).all()

        # Group fields by dimension
        dim_fields: Dict[str, List[ExtractedField]] = {d["key"]: [] for d in DIMENSIONS_CONFIG}
        for field in all_fields:
            dim_key = field.readiness_dimension or classify_dimension(field.field_label)
            if dim_key in dim_fields:
                dim_fields[dim_key].append(field)
            else:
                dim_fields["asset"].append(field)

        now = datetime.now(timezone.utc)
        dimension_breakdowns = []
        total_weighted_score = 0.0
        total_weight = sum(d["weight"] for d in DIMENSIONS_CONFIG)

        for config in DIMENSIONS_CONFIG:
            key = config["key"]
            label = config["label"]
            weight = config["weight"]
            base = config["base"]

            fields = dim_fields[key]
            confirmed = [f for f in fields if f.confirmation_status == "CONFIRMED"]
            unconfirmed = [f for f in fields if f.confirmation_status == "UNCONFIRMED"]
            rejected = [f for f in fields if f.confirmation_status == "REJECTED"]

            # Each confirmed field adds 20 points, capped at 100 max score
            earned_points = len(confirmed) * 20.0
            score = min(100.0, base + earned_points)

            # Generate transparent human-readable explanations
            explanations = []
            if len(confirmed) == 0:
                explanations.append(f"No confirmed items for {label.lower()} yet.")
            else:
                explanations.append(f"{len(confirmed)} item(s) confirmed and verified.")

            if unconfirmed:
                pending_labels = [f"'{f.field_label}'" for f in unconfirmed[:3]]
                explanations.append(f"{len(unconfirmed)} field(s) pending confirmation: {', '.join(pending_labels)}")

            if rejected:
                explanations.append(f"{len(rejected)} field(s) marked rejected.")

            if score >= 100.0:
                explanations.append("Dimension score is fully maximized.")

            dimension_breakdowns.append({
                "dimension": key,
                "label": label,
                "score": round(score, 1),
                "weight": weight,
                "base": base,
                "confirmed_count": len(confirmed),
                "unconfirmed_count": len(unconfirmed),
                "rejected_count": len(rejected),
                "explanations": explanations
            })

            total_weighted_score += score * weight

            # Upsert into readiness_scores table
            score_rec = db.query(ReadinessScore).filter(
                ReadinessScore.household_id == household_id,
                ReadinessScore.dimension == key
            ).first()

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
                    calculation_timestamp=now
                )
                db.add(score_rec)

        db.commit()

        overall_score = round(total_weighted_score / total_weight) if total_weight > 0 else 0

        return {
            "overall_score": overall_score,
            "dimensions": dimension_breakdowns,
            "last_calculated": now
        }

    @staticmethod
    def get_household_scores(db: Session, household_id: str) -> Dict:
        """
        Retrieves current readiness scores and breakdown for a household,
        triggering recalculation if no scores exist yet.
        """
        existing_scores = db.query(ReadinessScore).filter(
            ReadinessScore.household_id == household_id
        ).all()

        if not existing_scores:
            return ReadinessService.calculate_and_save_scores(db, household_id)

        return ReadinessService.calculate_and_save_scores(db, household_id)
