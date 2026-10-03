"""
Continuum Knowledge Graph - Field Normalizer

Person 3 responsibility:
Convert confirmed extracted fields into normalized graph
entities and relationships.

Important:
- Only CONFIRMED fields become trusted graph facts.
- This module does not access the database.
- This module does not call FastAPI.
- Unknown fields are ignored rather than guessed.
"""

from dataclasses import dataclass

from app.graph.builder import GraphRelationship
from app.graph.entities import EntityType, GraphEntity
from app.graph.relationships import RelationshipType


@dataclass(frozen=True)
class NormalizedGraphData:
    """Normalized graph input produced from extracted fields."""

    entities: list[GraphEntity]
    relationships: list[GraphRelationship]


class GraphFieldNormalizer:
    """
    Converts confirmed extracted-field dictionaries into graph data.

    The input format intentionally mirrors the existing ExtractedField
    contract without coupling this module to SQLAlchemy.
    """

    CONFIRMED = "CONFIRMED"

    def normalize(
        self,
        fields: list[dict],
    ) -> NormalizedGraphData:
        """
        Normalize supported confirmed fields into graph entities
        and deterministic relationships.
        """

        entities: dict[str, GraphEntity] = {}
        relationships: list[GraphRelationship] = []

        owner: GraphEntity | None = None
        asset: GraphEntity | None = None
        beneficiary: GraphEntity | None = None
        liability: GraphEntity | None = None
        contact: GraphEntity | None = None

        for field in fields:
            if field.get("confirmation_status") != self.CONFIRMED:
                continue

            label = str(field.get("field_label", "")).strip()
            value = str(field.get("extracted_value", "")).strip()

            if not label or not value:
                continue

            normalized_label = label.lower()

            if self._is_owner_field(normalized_label):
                owner = GraphEntity(
                    id=self._make_id("person", value),
                    entity_type=EntityType.PERSON,
                    name=value,
                )
                entities[owner.id] = owner

            elif self._is_asset_field(normalized_label):
                asset = GraphEntity(
                    id=self._make_id("asset", value),
                    entity_type=EntityType.ASSET,
                    name=value,
                )
                entities[asset.id] = asset

            elif self._is_beneficiary_field(normalized_label):
                beneficiary = GraphEntity(
                    id=self._make_id("person", value),
                    entity_type=EntityType.PERSON,
                    name=value,
                )
                entities[beneficiary.id] = beneficiary

            elif self._is_liability_field(normalized_label):
                liability = GraphEntity(
                    id=self._make_id("liability", value),
                    entity_type=EntityType.LIABILITY,
                    name=value,
                )
                entities[liability.id] = liability

            elif self._is_contact_field(normalized_label):
                contact = GraphEntity(
                    id=self._make_id("contact", value),
                    entity_type=EntityType.CONTACT,
                    name=value,
                )
                entities[contact.id] = contact

        # Create relationships only when BOTH sides are explicitly
        # available from confirmed fields.

        if owner is not None and asset is not None:
            relationships.append(
                (
                    owner,
                    RelationshipType.OWNS,
                    asset,
                )
            )

        if asset is not None and beneficiary is not None:
            relationships.append(
                (
                    asset,
                    RelationshipType.HAS_BENEFICIARY,
                    beneficiary,
                )
            )

        if owner is not None and liability is not None:
            relationships.append(
                (
                    owner,
                    RelationshipType.BORROWS,
                    liability,
                )
            )

        if owner is not None and contact is not None:
            relationships.append(
                (
                    owner,
                    RelationshipType.HAS_CONTACT,
                    contact,
                )
            )

        return NormalizedGraphData(
            entities=list(entities.values()),
            relationships=relationships,
        )

    @staticmethod
    def _make_id(prefix: str, value: str) -> str:
        """Create a deterministic graph ID from a value."""

        normalized = value.lower().replace(" ", "_")
        return f"{prefix}:{normalized}"

    @staticmethod
    def _is_owner_field(label: str) -> bool:
        return label in {
            "owner",
            "owner name",
            "policy holder",
            "policyholder",
            "account holder",
            "account owner",
        }

    @staticmethod
    def _is_asset_field(label: str) -> bool:
        return label in {
            "asset",
            "asset name",
            "policy",
            "policy name",
            "account",
            "account name",
            "property",
            "property name",
        }

    @staticmethod
    def _is_beneficiary_field(label: str) -> bool:
        return (
            "nominee" in label
            or "beneficiary" in label
        )

    @staticmethod
    def _is_liability_field(label: str) -> bool:
        return (
            "loan" in label
            or "mortgage" in label
            or "debt" in label
            or "liability" in label
        )

    @staticmethod
    def _is_contact_field(label: str) -> bool:
        return (
            "emergency contact" in label
            or label == "contact"
            or "contact name" in label
        )