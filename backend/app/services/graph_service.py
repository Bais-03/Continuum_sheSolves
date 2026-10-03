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
from app.graph.gap_detector import GapDetector, GraphGap
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
        Build the knowledge graph from the household's
        existing confirmed extracted fields.

        No new database records are created.
        """

        documents = (
            db.query(Document)
            .filter(Document.household_id == household.id)
            .all()
        )

        fields: list[dict] = []

        for document in documents:
            for field in document.fields:
                fields.append(
                    {
                        "field_label": field.field_label,
                        "extracted_value": field.extracted_value,
                        "confirmation_status": field.confirmation_status,
                    }
                )

        return self.analyze_fields(fields)