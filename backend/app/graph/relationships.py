"""
Continuum Knowledge Graph - Relationship Definitions

Person 3 responsibility:
Defines the typed relationships that can exist between
entities in the Continuum knowledge graph.

This module contains no SQLAlchemy or FastAPI code.
"""

from enum import Enum

from app.graph.entities import EntityType


class RelationshipType(str, Enum):
    """Supported relationships in the Continuum knowledge graph."""

    OWNS = "OWNS"
    BORROWS = "BORROWS"
    HAS_DOCUMENT = "HAS_DOCUMENT"
    HAS_BENEFICIARY = "HAS_BENEFICIARY"
    HAS_CONTACT = "HAS_CONTACT"
    KNOWS = "KNOWS"


# Defines which source and target entity types are valid
# for each relationship.
RELATIONSHIP_RULES = {
    RelationshipType.OWNS: {
        "source": {EntityType.PERSON},
        "target": {EntityType.ASSET},
    },
    RelationshipType.BORROWS: {
        "source": {EntityType.PERSON},
        "target": {EntityType.LIABILITY},
    },
    RelationshipType.HAS_DOCUMENT: {
        "source": {
            EntityType.PERSON,
            EntityType.ASSET,
            EntityType.LIABILITY,
        },
        "target": {EntityType.DOCUMENT},
    },
    RelationshipType.HAS_BENEFICIARY: {
        "source": {EntityType.ASSET},
        "target": {EntityType.PERSON},
    },
    RelationshipType.HAS_CONTACT: {
        "source": {EntityType.PERSON},
        "target": {EntityType.CONTACT},
    },
    RelationshipType.KNOWS: {
        "source": {EntityType.PERSON},
        "target": {EntityType.PERSON},
    },
}


def is_valid_relationship(
    relationship_type: RelationshipType,
    source_type: EntityType,
    target_type: EntityType,
) -> bool:
    """
    Check whether a relationship is valid for the supplied
    source and target entity types.
    """

    rule = RELATIONSHIP_RULES.get(relationship_type)

    if rule is None:
        return False

    return (
        source_type in rule["source"]
        and target_type in rule["target"]
    )