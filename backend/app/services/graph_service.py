"""
Continuum Graph Service

Person 3 responsibility:
Provide the integration boundary between normalized extracted
fields and the knowledge graph / Day-Zero engine.

Flow:

confirmed extracted fields
        ↓
GraphFieldNormalizer
        ↓
KnowledgeGraphBuilder
        ↓
GapDetector
        ↓
DayZeroGenerator
"""

from dataclasses import dataclass

import networkx as nx
from sqlalchemy.orm import Session

from app.dayzero.generator import DayZeroAction, DayZeroGenerator
from app.graph.builder import GraphRelationship, KnowledgeGraphBuilder
from app.graph.entities import GraphEntity
from app.graph.gap_detector import GapDetector, GapSeverity, GraphGap
from app.services.conflict_detector import ConflictDetector
from app.graph.normalizer import GraphFieldNormalizer
from app.models.domain import Document
from app.models.household import Household

@dataclass(frozen=True)
class GraphAnalysisResult:
    """Complete result produced by the graph analysis pipeline."""

    graph: nx.MultiDiGraph
    gaps: list[GraphGap]
    actions: list[DayZeroAction]


class GraphService:
    """
    Orchestrates the complete Person 3 graph pipeline.

    This service keeps the core graph analysis independent of
    FastAPI. Database-backed household analysis is provided
    through an explicit integration method.
    """

    def __init__(self) -> None:
        self.normalizer = GraphFieldNormalizer()
        self.builder = KnowledgeGraphBuilder()
        self.dayzero_generator = DayZeroGenerator()
        self.conflict_detector = ConflictDetector()

    def analyze(
        self,
        entities: list[GraphEntity],
        relationships: list[GraphRelationship],
    ) -> GraphAnalysisResult:
        """
        Analyze already-normalized graph data.

        This method is retained for compatibility with the
        existing graph tests and callers.
        """

        graph = self.builder.build(
            entities,
            relationships,
        )

        gaps = GapDetector(graph).detect_all()

        actions = self.dayzero_generator.generate(gaps)

        return GraphAnalysisResult(
            graph=graph,
            gaps=gaps,
            actions=actions,
        )

    def analyze_fields(
        self,
        fields: list[dict],
    ) -> GraphAnalysisResult:
        """
        Run the complete graph pipeline directly from extracted fields.

        Only confirmed supported fields become graph facts.
        """

        normalized = self.normalizer.normalize(fields)

        return self.analyze(
            normalized.entities,
            normalized.relationships,
        )

    def analyze_household(
        self,
        db: Session,
        household: Household,
    ) -> GraphAnalysisResult:
        """
        Build the graph from confirmed household fields and detect
        conflicts across the household's source documents.
        """

        documents = (
            db.query(Document)
            .filter(Document.household_id == household.id)
            .all()
        )

        fields: list[dict] = []
        conflict_documents: list[dict] = []

        for document in documents:
            document_fields: list[dict] = []

            for field in document.fields:
                field_data = {
                    "field_label": field.field_label,
                    "extracted_value": field.extracted_value,
                    "confirmation_status": field.confirmation_status,
                }

                fields.append(field_data)
                document_fields.append(field_data)

            conflict_documents.append(
                {
                    "id": str(document.id),
                    "filename": document.filename,
                    "fields": document_fields,
                }
            )

        # Add the authenticated household owner as a graph fact only
        # when no confirmed owner field exists in the documents.
        has_confirmed_owner = any(
            str(field.get("confirmation_status", "")).upper() == "CONFIRMED"
            and str(field.get("field_label", "")).strip().lower()
            in {
                "owner",
                "owner name",
                "primary owner",
                "policy holder",
                "policyholder",
                "account holder",
                "account owner",
                "property owner",
                "borrower",
            }
            and str(field.get("extracted_value") or "").strip()
            for field in fields
        )

        if not has_confirmed_owner and household.owner is not None:
            fields.append(
                {
                    "field_label": "Owner",
                    "extracted_value": household.owner.full_name,
                    "confirmation_status": "CONFIRMED",
                }
            )

        # Preserve the existing graph and beneficiary/contact analysis.
        result = self.analyze_fields(fields)

        # Detect disagreements using original document boundaries.
        conflicts = self.conflict_detector.detect(conflict_documents)

        conflict_gaps = [
            GraphGap(
                gap_type="conflict",
                entity_id=conflict.conflict_id,
                title=(
                    "Resolve conflicting "
                    f"{conflict.field_label.replace('_', ' ')}"
                ),
                reason=conflict.reason,
                severity=GapSeverity.HIGH,
            )
            for conflict in conflicts
        ]

        combined_gaps = [*result.gaps, *conflict_gaps]

        # Generate actions from the combined gaps so task synchronization
        # receives exactly the actions corresponding to this analysis.
        combined_actions = self.dayzero_generator.generate(combined_gaps)

        return GraphAnalysisResult(
            graph=result.graph,
            gaps=combined_gaps,
            actions=combined_actions,
        )