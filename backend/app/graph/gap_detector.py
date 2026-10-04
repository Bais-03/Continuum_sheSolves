"""
Continuum Knowledge Graph - Gap Detection

Person 3 responsibility:
Detect missing relationships in the household knowledge graph.

This module is intentionally independent of:
- FastAPI
- SQLAlchemy
- database persistence
- frontend code

The detector works only with the NetworkX graph produced
by KnowledgeGraphBuilder.
"""

from dataclasses import dataclass
from enum import Enum

import networkx as nx

from app.graph.entities import EntityType
from app.graph.relationships import RelationshipType


class GapSeverity(str, Enum):
    """Severity levels used by the Day-Zero engine."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


@dataclass(frozen=True)
class GraphGap:
    """
    Represents a missing relationship or piece of household knowledge.
    """

    gap_type: str
    entity_id: str
    title: str
    reason: str
    severity: GapSeverity


class GapDetector:
    """Detect readiness gaps from a Continuum knowledge graph."""

    def __init__(self, graph: nx.MultiDiGraph) -> None:
        self.graph = graph

    def _has_relationship(
        self,
        source_id: str,
        relationship_type: RelationshipType,
    ) -> bool:
        """
        Check whether a node has at least one outgoing relationship
        of the requested type.
        """

        if source_id not in self.graph:
            return False

        for _, _, edge_data in self.graph.out_edges(
            source_id,
            data=True,
        ):
            if edge_data.get("relationship") == relationship_type.value:
                return True

        return False

    def detect_beneficiary_gaps(self) -> list[GraphGap]:
        """
        Detect assets that do not have a recorded beneficiary.
        """

        gaps: list[GraphGap] = []

        for node_id, node_data in self.graph.nodes(data=True):
            if node_data.get("entity_type") != EntityType.ASSET.value:
                continue

            if not self._has_relationship(
                node_id,
                RelationshipType.HAS_BENEFICIARY,
            ):
                asset_name = node_data.get("name", node_id)

                gaps.append(
                    GraphGap(
                        gap_type="beneficiary",
                        entity_id=node_id,
                        title="Register beneficiary",
                        reason=(
                            f"Beneficiary information is missing for "
                            f"{asset_name}."
                        ),
                        severity=GapSeverity.HIGH,
                    )
                )

        return gaps

    def detect_contact_gaps(self) -> list[GraphGap]:
        """
        Detect people who do not have a recorded emergency contact.
        """

        gaps: list[GraphGap] = []

        for node_id, node_data in self.graph.nodes(data=True):
            if node_data.get("entity_type") != EntityType.PERSON.value:
                continue

            if not self._has_relationship(
                node_id,
                RelationshipType.HAS_CONTACT,
            ):
                person_name = node_data.get("name", node_id)

                gaps.append(
                    GraphGap(
                        gap_type="contact",
                        entity_id=node_id,
                        title="Add emergency contact",
                        reason=(
                            f"Emergency contact information is missing "
                            f"for {person_name}."
                        ),
                        severity=GapSeverity.MEDIUM,
                    )
                )

        return gaps

    def detect_all(self) -> list[GraphGap]:
        """
        Detect all currently supported graph gaps.
        """

        return (
            self.detect_beneficiary_gaps()
            + self.detect_contact_gaps()
        )