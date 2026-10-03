"""
Continuum Knowledge Graph - Entity Definitions

Person 3 responsibility:
Defines the supported entity types used by the NetworkX
knowledge graph.

This module contains no SQLAlchemy or FastAPI code.
"""

from dataclasses import dataclass
from enum import Enum


class EntityType(str, Enum):
    """Supported node types in the Continuum knowledge graph."""

    PERSON = "PERSON"
    ASSET = "ASSET"
    LIABILITY = "LIABILITY"
    DOCUMENT = "DOCUMENT"
    CONTACT = "CONTACT"


@dataclass(frozen=True)
class GraphEntity:
    """
    Represents a single node in the knowledge graph.

    Attributes:
        id: Stable identifier used by NetworkX.
        entity_type: Type of entity represented by this node.
        name: Human-readable name.
    """

    id: str
    entity_type: EntityType
    name: str