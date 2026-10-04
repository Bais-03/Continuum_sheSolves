"""
Continuum Knowledge Graph - NetworkX Builder

Person 3 responsibility:
Build an in-memory NetworkX knowledge graph from
normalized entities and relationships.

This module intentionally has no FastAPI or SQLAlchemy
dependencies so it can be tested independently.
"""

from typing import Iterable, Tuple

import networkx as nx

from app.graph.entities import GraphEntity
from app.graph.relationships import (
    RelationshipType,
    is_valid_relationship,
)


# A relationship is represented as:
# (source_entity, relationship_type, target_entity)
GraphRelationship = Tuple[
    GraphEntity,
    RelationshipType,
    GraphEntity,
]


class KnowledgeGraphBuilder:
    """Builds a directed NetworkX graph for one household."""

    def __init__(self) -> None:
        self.graph = nx.MultiDiGraph()

    def add_entity(self, entity: GraphEntity) -> None:
        """
        Add an entity as a node.

        The entity ID becomes the NetworkX node ID.
        Entity type and display name are stored as attributes.
        """

        self.graph.add_node(
            entity.id,
            entity_type=entity.entity_type.value,
            name=entity.name,
        )

    def add_relationship(
        self,
        source: GraphEntity,
        relationship_type: RelationshipType,
        target: GraphEntity,
    ) -> None:
        """
        Add a validated relationship between two existing entities.

        Raises:
            ValueError: if the relationship is not valid for
            the supplied source and target entity types.
        """

        if not is_valid_relationship(
            relationship_type,
            source.entity_type,
            target.entity_type,
        ):
            raise ValueError(
                f"Invalid relationship: "
                f"{source.entity_type.value} "
                f"-[{relationship_type.value}]-> "
                f"{target.entity_type.value}"
            )

        # Ensure nodes exist before adding the edge.
        self.add_entity(source)
        self.add_entity(target)

        self.graph.add_edge(
            source.id,
            target.id,
            relationship=relationship_type.value,
        )

    def build(
        self,
        entities: Iterable[GraphEntity],
        relationships: Iterable[GraphRelationship],
    ) -> nx.MultiDiGraph:
        """
        Build and return the complete NetworkX graph.

        Existing graph state is cleared before rebuilding so that
        repeated calls do not accidentally duplicate stale data.
        """

        self.graph.clear()

        for entity in entities:
            self.add_entity(entity)

        for source, relationship_type, target in relationships:
            self.add_relationship(
                source,
                relationship_type,
                target,
            )

        return self.graph

    def get_graph(self) -> nx.MultiDiGraph:
        """Return the current graph instance."""

        return self.graph