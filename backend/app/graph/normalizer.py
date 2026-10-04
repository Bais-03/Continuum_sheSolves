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

    Important design rule:
    Fields are processed in document order so that beneficiary/contact
    information is attached to the most recently identified relevant
    asset/owner instead of being incorrectly attached to the last
    asset in the entire household.
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

        # Current household owner.
        owner: GraphEntity | None = None

        # Current asset context.
        #
        # This is intentionally updated whenever a new asset is found.
        # A following beneficiary/nominee is therefore attached to
        # that specific asset.
        current_asset: GraphEntity | None = None

        # Current liability context.
        current_liability: GraphEntity | None = None

        # Current emergency contact.
        current_contact: GraphEntity | None = None

        for field in fields:
            # ---------------------------------------------------------
            # Only confirmed facts are trusted by the graph.
            # ---------------------------------------------------------
            if field.get("confirmation_status") != self.CONFIRMED:
                continue

            label = str(
                field.get("field_label", "")
            ).strip()

            value = str(
                field.get("extracted_value", "")
            ).strip()

            if not label or not value:
                continue

            normalized_label = label.lower().strip()

            # ---------------------------------------------------------
            # PERSON / OWNER
            # ---------------------------------------------------------
            if self._is_owner_field(normalized_label):
                owner = GraphEntity(
                    id=self._make_id("person", value),
                    entity_type=EntityType.PERSON,
                    name=value,
                )

                entities[owner.id] = owner

                # If a liability/contact was already discovered before
                # the owner field, connect them now.
                if current_liability is not None:
                    self._add_relationship(
                        relationships,
                        owner,
                        RelationshipType.BORROWS,
                        current_liability,
                    )

                if current_contact is not None:
                    self._add_relationship(
                        relationships,
                        owner,
                        RelationshipType.HAS_CONTACT,
                        current_contact,
                    )

            # ---------------------------------------------------------
            # ASSET
            # ---------------------------------------------------------
            elif self._is_asset_field(normalized_label):
                current_asset = GraphEntity(
                    id=self._make_id("asset", value),
                    entity_type=EntityType.ASSET,
                    name=value,
                )

                entities[current_asset.id] = current_asset

                # Owner -> Asset
                if owner is not None:
                    self._add_relationship(
                        relationships,
                        owner,
                        RelationshipType.OWNS,
                        current_asset,
                    )

            # ---------------------------------------------------------
            # BENEFICIARY / NOMINEE
            #
            # IMPORTANT:
            # "Nominee Relationship" and
            # "Beneficiary Relationship" are metadata,
            # NOT graph entities.
            #
            # The beneficiary is attached immediately to the
            # CURRENT asset. This prevents:
            #
            # Property -> Beneficiary
            #
            # when the beneficiary actually belongs to an insurance
            # policy or bank account appearing earlier.
            # ---------------------------------------------------------
            elif self._is_beneficiary_field(normalized_label):
                beneficiary = GraphEntity(
                    id=self._make_id("person", value),
                    entity_type=EntityType.PERSON,
                    name=value,
                )

                entities[beneficiary.id] = beneficiary

                if current_asset is not None:
                    self._add_relationship(
                        relationships,
                        current_asset,
                        RelationshipType.HAS_BENEFICIARY,
                        beneficiary,
                    )

            # ---------------------------------------------------------
            # LIABILITY
            # ---------------------------------------------------------
            elif self._is_liability_field(normalized_label):
                current_liability = GraphEntity(
                    id=self._make_id("liability", value),
                    entity_type=EntityType.LIABILITY,
                    name=value,
                )

                entities[current_liability.id] = current_liability

                # Owner -> Liability
                if owner is not None:
                    self._add_relationship(
                        relationships,
                        owner,
                        RelationshipType.BORROWS,
                        current_liability,
                    )

            # ---------------------------------------------------------
            # EMERGENCY CONTACT
            #
            # "Emergency Contact Relationship" is metadata,
            # NOT a separate entity.
            # ---------------------------------------------------------
            elif self._is_contact_field(normalized_label):
                current_contact = GraphEntity(
                    id=self._make_id("contact", value),
                    entity_type=EntityType.CONTACT,
                    name=value,
                )

                entities[current_contact.id] = current_contact

                # Owner -> Contact
                if owner is not None:
                    self._add_relationship(
                        relationships,
                        owner,
                        RelationshipType.HAS_CONTACT,
                        current_contact,
                    )

        return NormalizedGraphData(
            entities=list(entities.values()),
            relationships=relationships,
        )

    # -----------------------------------------------------------------
    # Relationship helper
    # -----------------------------------------------------------------

    @staticmethod
    def _add_relationship(
        relationships: list[GraphRelationship],
        source: GraphEntity,
        relationship_type: RelationshipType,
        target: GraphEntity,
    ) -> None:
        """
        Add a relationship only if the exact same relationship
        does not already exist.
        """

        relationship = (
            source,
            relationship_type,
            target,
        )

        if relationship not in relationships:
            relationships.append(relationship)

    # -----------------------------------------------------------------
    # Deterministic ID
    # -----------------------------------------------------------------

    @staticmethod
    def _make_id(
        prefix: str,
        value: str,
    ) -> str:
        """Create a deterministic graph ID from a value."""

        normalized = (
            value.lower()
            .strip()
            .replace(" ", "_")
        )

        return f"{prefix}:{normalized}"

    # -----------------------------------------------------------------
    # OWNER
    # -----------------------------------------------------------------

    @staticmethod
    def _is_owner_field(label: str) -> bool:
        """Return True for supported owner/person fields."""

        return (
            label in {
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
            or label.endswith(" owner")
        )

    # -----------------------------------------------------------------
    # ASSET
    # -----------------------------------------------------------------

    @staticmethod
    def _is_asset_field(label: str) -> bool:
        """
        Return True for actual asset fields.

        Supports fields such as:
        - Asset
        - Asset Name
        - Policy
        - Policy Name
        - Life Insurance Policy
        - Bank Account
        - Account
        - Account Name
        - Property
        - Property Name

        Explicit identifier fields such as:
        - Policy Number
        - Account Number
        - Loan Number

        are NOT treated as graph entities.
        """

        # Never treat identifiers or metadata as assets.
        if any(
            keyword in label
            for keyword in (
                "number",
                "no.",
                "id",
                "identifier",
                "relationship",
                "status",
                "frequency",
                "premium",
                "holder",
                "owner",
            )
        ):
            return False

        # Direct asset labels.
        if label in {
            "asset",
            "asset name",
            "policy",
            "policy name",
            "account",
            "account name",
            "bank account",
            "bank account name",
            "property",
            "property name",
        }:
            return True

        # Insurance / policy names.
        if "insurance policy" in label:
            return True

        # Bank-account style fields.
        if "bank account" in label:
            return True

        return False

    # -----------------------------------------------------------------
    # BENEFICIARY / NOMINEE
    # -----------------------------------------------------------------

    @staticmethod
    def _is_beneficiary_field(label: str) -> bool:
        """
        Return True only for actual beneficiary/nominee fields.

        Examples that ARE entities:
            Nominee
            Beneficiary
            Nominee Name
            Beneficiary Name

        Examples that are NOT entities:
            Nominee Relationship
            Beneficiary Relationship
        """

        # Relationship metadata must never become a person node.
        if "relationship" in label:
            return False

        return (
            "nominee" in label
            or "beneficiary" in label
        )

    # -----------------------------------------------------------------
    # LIABILITY
    # -----------------------------------------------------------------

    @staticmethod
    def _is_liability_field(label: str) -> bool:
        """
        Return True only for actual liability names.

        Examples:
            Home Loan
            Mortgage
            Debt
            Liability

        Identifier fields such as:
            Loan Number
            Mortgage Number

        must NOT create separate liability entities.
        """

        # Identifier / metadata fields are not liabilities.
        if any(
            keyword in label
            for keyword in (
                "number",
                "no.",
                "id",
                "identifier",
                "relationship",
                "status",
            )
        ):
            return False

        return (
            label in {
                "loan",
                "loan name",
                "home loan",
                "mortgage",
                "mortgage name",
                "debt",
                "debt name",
                "liability",
                "liability name",
            }
            or "loan" in label
            or "mortgage" in label
        )

        # -----------------------------------------------------------------
    # EMERGENCY CONTACT
    # -----------------------------------------------------------------

    @staticmethod
    def _is_contact_field(label: str) -> bool:
        """
        Return True only for actual emergency-contact NAME fields.

        Supported contact entity fields:
            Emergency Contact
            Emergency Contact Name
            Contact
            Contact Name

        These are NOT graph entities:
            Emergency Contact Relationship
            Emergency Contact Phone
            Emergency Contact Number
            Emergency Contact Mobile
            Emergency Contact Email
            Contact Relationship
            Contact Phone
            Contact Number
            Contact Mobile
            Contact Email
        """

        # -------------------------------------------------------------
        # Relationship metadata must not become a contact entity.
        # -------------------------------------------------------------
        if "relationship" in label:
            return False

        # -------------------------------------------------------------
        # Contact details are attributes, not graph entities.
        # -------------------------------------------------------------
        if any(
            keyword in label
            for keyword in (
                "phone",
                "mobile",
                "telephone",
                "email",
                "number",
                "address",
            )
        ):
            return False

        # -------------------------------------------------------------
        # Only actual contact-name fields become CONTACT nodes.
        # -------------------------------------------------------------
        return (
            label == "emergency contact"
            or label == "emergency contact name"
            or label == "contact"
            or label == "contact name"
        )