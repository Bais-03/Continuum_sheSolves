"""
Tests for Continuum Person 3 knowledge graph functionality.

Covers:
G01 - Person owns asset -> edge created
G02 - Missing beneficiary -> gap detected
G03 - Missing contact -> contact gap detected
G04 - Multiple gaps -> all identified
"""

from app.graph.builder import KnowledgeGraphBuilder
from app.graph.entities import EntityType, GraphEntity
from app.graph.gap_detector import GapDetector, GapSeverity
from app.graph.relationships import RelationshipType
from app.graph.normalizer import GraphFieldNormalizer
from app.services.graph_service import GraphService
from httpx import AsyncClient
from app.main import app
from app.models.domain import Document, ExtractedField
from app.services.graph_service import GraphService


def test_person_owns_asset_creates_edge():
    """G01: Person -> OWNS -> Asset edge is created."""

    person = GraphEntity(
        "p1",
        EntityType.PERSON,
        "Raj Sharma",
    )

    asset = GraphEntity(
        "a1",
        EntityType.ASSET,
        "LIC Policy",
    )

    graph = KnowledgeGraphBuilder().build(
        [person, asset],
        [
            (
                person,
                RelationshipType.OWNS,
                asset,
            )
        ],
    )

    assert graph.has_node("p1")
    assert graph.has_node("a1")
    assert graph.has_edge("p1", "a1")

    edge_data = graph.get_edge_data("p1", "a1")

    assert edge_data is not None
    assert any(
        data["relationship"] == RelationshipType.OWNS.value
        for data in edge_data.values()
    )


def test_missing_beneficiary_creates_gap():
    """G02: Asset without beneficiary produces a HIGH gap."""

    person = GraphEntity(
        "p1",
        EntityType.PERSON,
        "Raj Sharma",
    )

    asset = GraphEntity(
        "a1",
        EntityType.ASSET,
        "LIC Policy",
    )

    graph = KnowledgeGraphBuilder().build(
        [person, asset],
        [
            (
                person,
                RelationshipType.OWNS,
                asset,
            )
        ],
    )

    gaps = GapDetector(graph).detect_beneficiary_gaps()

    assert len(gaps) == 1
    assert gaps[0].gap_type == "beneficiary"
    assert gaps[0].entity_id == "a1"
    assert gaps[0].severity == GapSeverity.HIGH


def test_missing_contact_creates_gap():
    """G03: Person without contact produces a contact gap."""

    person = GraphEntity(
        "p1",
        EntityType.PERSON,
        "Raj Sharma",
    )

    graph = KnowledgeGraphBuilder().build(
        [person],
        [],
    )

    gaps = GapDetector(graph).detect_contact_gaps()

    assert len(gaps) == 1
    assert gaps[0].gap_type == "contact"
    assert gaps[0].entity_id == "p1"
    assert gaps[0].severity == GapSeverity.MEDIUM


def test_multiple_gaps_are_identified():
    """G04: Multiple missing relationships are all detected."""

    person = GraphEntity(
        "p1",
        EntityType.PERSON,
        "Raj Sharma",
    )

    asset = GraphEntity(
        "a1",
        EntityType.ASSET,
        "LIC Policy",
    )

    graph = KnowledgeGraphBuilder().build(
        [person, asset],
        [
            (
                person,
                RelationshipType.OWNS,
                asset,
            )
        ],
    )

    gaps = GapDetector(graph).detect_all()

    gap_types = {gap.gap_type for gap in gaps}

    assert "beneficiary" in gap_types
    assert "contact" in gap_types
    assert len(gaps) == 2

def test_confirmed_owner_and_asset_create_owns_relationship():
    fields = [
        {
            "field_label": "Policy Holder",
            "extracted_value": "Raj Sharma",
            "confirmation_status": "CONFIRMED",
        },
        {
            "field_label": "Policy",
            "extracted_value": "LIC Policy",
            "confirmation_status": "CONFIRMED",
        },
    ]

    result = GraphFieldNormalizer().normalize(fields)

    assert len(result.entities) == 2
    assert len(result.relationships) == 1

    source, relationship, target = result.relationships[0]

    assert source.name == "Raj Sharma"
    assert relationship.value == "OWNS"
    assert target.name == "LIC Policy"


def test_confirmed_beneficiary_creates_beneficiary_relationship():
    fields = [
        {
            "field_label": "Policy Holder",
            "extracted_value": "Raj Sharma",
            "confirmation_status": "CONFIRMED",
        },
        {
            "field_label": "Policy",
            "extracted_value": "LIC Policy",
            "confirmation_status": "CONFIRMED",
        },
        {
            "field_label": "Nominee",
            "extracted_value": "Priya Sharma",
            "confirmation_status": "CONFIRMED",
        },
    ]

    result = GraphFieldNormalizer().normalize(fields)

    assert len(result.relationships) == 2

    relationship_values = [
        relationship.value
        for _, relationship, _ in result.relationships
    ]

    assert "OWNS" in relationship_values
    assert "HAS_BENEFICIARY" in relationship_values


def test_unconfirmed_fields_are_ignored():
    fields = [
        {
            "field_label": "Policy Holder",
            "extracted_value": "Raj Sharma",
            "confirmation_status": "UNCONFIRMED",
        },
        {
            "field_label": "Policy",
            "extracted_value": "LIC Policy",
            "confirmation_status": "CONFIRMED",
        },
    ]

    result = GraphFieldNormalizer().normalize(fields)

    assert len(result.entities) == 1
    assert result.entities[0].name == "LIC Policy"
    assert result.relationships == []


def test_unknown_field_is_ignored():
    fields = [
        {
            "field_label": "Premium Due Date",
            "extracted_value": "2026-11-15",
            "confirmation_status": "CONFIRMED",
        }
    ]

    result = GraphFieldNormalizer().normalize(fields)

    assert result.entities == []
    assert result.relationships == []

def test_graph_service_analyzes_confirmed_fields_end_to_end():
    fields = [
        {
            "field_label": "Policy Holder",
            "extracted_value": "Raj Sharma",
            "confirmation_status": "CONFIRMED",
        },
        {
            "field_label": "Policy",
            "extracted_value": "LIC Policy",
            "confirmation_status": "CONFIRMED",
        },
    ]

    result = GraphService().analyze_fields(fields)

    assert result.graph.number_of_nodes() == 2
    assert result.graph.number_of_edges() == 1

    edge_data = list(result.graph.edges(data=True))

    assert edge_data[0][2]["relationship"] == "OWNS"

    assert len(result.gaps) == 2

    gap_types = {gap.gap_type for gap in result.gaps}

    assert "beneficiary" in gap_types
    assert "contact" in gap_types

    assert len(result.actions) == 2

    assert result.actions[0].title == "Register beneficiary"
    assert result.actions[0].priority == "high"

async def test_graph_analyze_api(signed_up_client):
    client, user_data = signed_up_client

    response = await client.post(
        "/api/v1/graph/analyze",
        json={
            "fields": [
                {
                    "field_label": "Policy Holder",
                    "extracted_value": "Raj Sharma",
                    "confirmation_status": "CONFIRMED",
                },
                {
                    "field_label": "Policy",
                    "extracted_value": "LIC Policy",
                    "confirmation_status": "CONFIRMED",
                },
            ]
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data["entities"]) == 2
    assert len(data["relationships"]) == 1

    assert data["relationships"][0]["relationship"] == "OWNS"

    assert len(data["gaps"]) == 2

    gap_types = {
        gap["gap_type"]
        for gap in data["gaps"]
    }

    assert "beneficiary" in gap_types
    assert "contact" in gap_types

    assert len(data["actions"]) == 2

    assert data["actions"][0]["title"] == "Register beneficiary"
    assert data["actions"][0]["priority"] == "high"

async def test_graph_analyze_api_ignores_unconfirmed_fields(
    signed_up_client,
):
    client, user_data = signed_up_client

    response = await client.post(
        "/api/v1/graph/analyze",
        json={
            "fields": [
                {
                    "field_label": "Policy Holder",
                    "extracted_value": "Raj Sharma",
                    "confirmation_status": "UNCONFIRMED",
                },
                {
                    "field_label": "Policy",
                    "extracted_value": "LIC Policy",
                    "confirmation_status": "CONFIRMED",
                },
            ]
        },
    )

    assert response.status_code == 200

    data = response.json()

    # Only the confirmed Policy entity should enter the graph.
    assert len(data["entities"]) == 1
    assert data["entities"][0]["name"] == "LIC Policy"

    # No OWNS relationship can be created because
    # the owner was not confirmed.
    assert data["relationships"] == []

    # No unnecessary beneficiary/contact relationship
    # should be fabricated.
    gap_types = {
        gap["gap_type"]
        for gap in data["gaps"]
    }

    assert "beneficiary" in gap_types
    assert "contact" not in gap_types

async def test_graph_service_analyzes_household_database_records(
    signed_up_client,
):
    client, user_data = signed_up_client

    # Use the same in-memory test database used by conftest.py.
    from tests.conftest import TestSessionLocal

    db = TestSessionLocal()

    try:
        document = Document(
            household_id=user_data["household_id"],
            filename="insurance.txt",
            document_type="text/plain",
            storage_reference="test/insurance.txt",
            upload_status="COMPLETED",
        )

        db.add(document)
        db.commit()
        db.refresh(document)

        owner_field = ExtractedField(
            document_id=document.id,
            field_label="Policy Holder",
            extracted_value="Raj Sharma",
            confidence=1.0,
            readiness_dimension="asset",
            confirmation_status="CONFIRMED",
        )

        asset_field = ExtractedField(
            document_id=document.id,
            field_label="Policy",
            extracted_value="LIC Policy",
            confidence=1.0,
            readiness_dimension="asset",
            confirmation_status="CONFIRMED",
        )

        db.add_all([
            owner_field,
            asset_field,
        ])

        db.commit()

        from app.models.household import Household

        household = (
            db.query(Household)
            .filter(
                Household.id == user_data["household_id"]
            )
            .first()
        )

        assert household is not None

        result = GraphService().analyze_household(
            db,
            household,
        )

        assert result.graph.number_of_nodes() == 2
        assert result.graph.number_of_edges() == 1

        edges = list(
            result.graph.edges(data=True)
        )

        assert edges[0][2]["relationship"] == "OWNS"

        gap_types = {
            gap.gap_type
            for gap in result.gaps
        }

        assert "beneficiary" in gap_types
        assert "contact" in gap_types

        assert result.actions[0].title == "Register beneficiary"
        assert result.actions[0].priority == "high"

    finally:
        db.close()