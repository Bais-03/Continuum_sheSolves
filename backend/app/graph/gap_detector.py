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

    # ------------------------------------------------------------------
    # Relationship helper
    # ------------------------------------------------------------------

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

    # ------------------------------------------------------------------
    # Household responsibility helper
    # ------------------------------------------------------------------

    def _is_household_responsible_person(
        self,
        node_id: str,
    ) -> bool:
        """
        Return True when a person appears to have household
        responsibility based on the graph.

        A person is considered responsible if they:
        - own at least one asset, OR
        - borrow at least one liability.

        This prevents beneficiaries, nominees, and other people
        from automatically being treated as household managers
        who require their own emergency contact.
        """

        if node_id not in self.graph:
            return False

        node_data = self.graph.nodes[node_id]

        if (
            node_data.get("entity_type")
            != EntityType.PERSON.value
        ):
            return False

        owns_asset = self._has_relationship(
            node_id,
            RelationshipType.OWNS,
        )

        borrows_liability = self._has_relationship(
            node_id,
            RelationshipType.BORROWS,
        )

        return owns_asset or borrows_liability

    # ------------------------------------------------------------------
    # Beneficiary gaps
    # ------------------------------------------------------------------

    def detect_beneficiary_gaps(self) -> list[GraphGap]:
        """
        Detect assets that do not have a recorded beneficiary.

        The current Continuum graph rule treats every ASSET as
        beneficiary-relevant. This keeps the rule simple and
        transparent for the prototype.

        Example:

            Life Insurance Policy
                    ↓
              no beneficiary
                    ↓
              HIGH gap
        """

        gaps: list[GraphGap] = []

        for node_id, node_data in self.graph.nodes(
            data=True
        ):
            if (
                node_data.get("entity_type")
                != EntityType.ASSET.value
            ):
                continue

            if self._has_relationship(
                node_id,
                RelationshipType.HAS_BENEFICIARY,
            ):
                continue

            asset_name = node_data.get(
                "name",
                node_id,
            )

            gaps.append(
                GraphGap(
                    gap_type="beneficiary",
                    entity_id=node_id,
                    title="Register beneficiary",
                    reason=(
                        f"Beneficiary information is missing "
                        f"for {asset_name}."
                    ),
                    severity=GapSeverity.HIGH,
                )
            )

        return gaps

    # ------------------------------------------------------------------
    # Contact gaps
    # ------------------------------------------------------------------

    def detect_contact_gaps(self) -> list[GraphGap]:
        """
        Detect people who need an emergency contact.

        Rules:
        1. A standalone PERSON with no contact is a gap.
        2. A household-responsible PERSON who owns an asset or
        borrows a liability and has no contact is a gap.
        3. A person who appears only as a beneficiary/nominee is
        NOT automatically considered a household responsibility
        holder and therefore does not get a contact gap.

        This allows:
            Raj Sharma -> contact gap

        while avoiding:
            Kavya Sharma -> contact gap

        when Kavya only appears as a beneficiary.
        """

        gaps: list[GraphGap] = []

        for node_id, node_data in self.graph.nodes(data=True):
            if (
                node_data.get("entity_type")
                != EntityType.PERSON.value
            ):
                continue

            # -------------------------------------------------------------
            # If this person is only a beneficiary/nominee, do not
            # automatically require an emergency contact for them.
            #
            # Example:
            #
            # SecureLife Term Plan
            #        |
            #   HAS_BENEFICIARY
            #        |
            #      Kavya
            #
            # Kavya should not become a contact gap merely because
            # she is a beneficiary.
            # -------------------------------------------------------------
            has_beneficiary_relationship = False

            for source_id, _, edge_data in self.graph.in_edges(
                node_id,
                data=True,
            ):
                if (
                    edge_data.get("relationship")
                    == RelationshipType.HAS_BENEFICIARY.value
                ):
                    has_beneficiary_relationship = True
                    break

            # Check whether this person has actual household
            # responsibility.
            is_responsible = self._is_household_responsible_person(
                node_id
            )

            # If the person is only a beneficiary and has no
            # household responsibility, skip them.
            if has_beneficiary_relationship and not is_responsible:
                continue

            # -------------------------------------------------------------
            # Everyone else who is a PERSON without an emergency
            # contact gets a contact gap.
            #
            # This preserves the original expected behavior for:
            #     Raj Sharma
            #
            # and for an authenticated household owner with no
            # relationships yet.
            # -------------------------------------------------------------
            if self._has_relationship(
                node_id,
                RelationshipType.HAS_CONTACT,
            ):
                continue

            person_name = node_data.get(
                "name",
                node_id,
            )

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

    # ------------------------------------------------------------------
    # All supported gaps
    # ------------------------------------------------------------------

    def detect_all(self) -> list[GraphGap]:
        """
        Detect all currently supported graph gaps.
        """

        return (
            self.detect_beneficiary_gaps()
            + self.detect_contact_gaps()
        )