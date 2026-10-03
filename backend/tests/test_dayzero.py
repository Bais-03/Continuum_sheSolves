"""
Tests for Continuum Person 3 Day-Zero functionality.

Covers:
G05 - High severity gap gets higher priority
G06 - No gaps produce no unnecessary action
T07 - Owner -> Asset -> Edge created
T08 - Missing relation -> Gap identified
T09 - Beneficiary gap -> Day-Zero action created
"""

from app.dayzero.generator import DayZeroGenerator
from app.dayzero.prioritizer import GapPrioritizer
from app.graph.builder import KnowledgeGraphBuilder
from app.graph.entities import EntityType, GraphEntity
from app.graph.gap_detector import GapDetector
from app.graph.relationships import RelationshipType
from app.graph.normalizer import GraphFieldNormalizer
from app.graph.builder import KnowledgeGraphBuilder
from app.graph.gap_detector import GapDetector
from app.dayzero.generator import DayZeroGenerator


def build_basic_graph():
    """Create a reusable household graph for tests."""

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

    return graph


def test_high_severity_gap_gets_higher_priority():
    """G05: HIGH beneficiary gap comes before MEDIUM contact gap."""

    graph = build_basic_graph()

    gaps = GapDetector(graph).detect_all()
    prioritized = GapPrioritizer.prioritize(gaps)

    assert prioritized[0].gap_type == "beneficiary"
    assert prioritized[0].severity.value == "high"


def test_no_gaps_produce_no_action():
    """G06: A complete graph should produce no Day-Zero actions."""

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

    beneficiary = GraphEntity(
        "p2",
        EntityType.PERSON,
        "Priya Sharma",
    )

    contact = GraphEntity(
        "c1",
        EntityType.CONTACT,
        "Family Doctor",
    )

    graph = KnowledgeGraphBuilder().build(
        [person, asset, beneficiary, contact],
        [
            (
                person,
                RelationshipType.OWNS,
                asset,
            ),
            (
                asset,
                RelationshipType.HAS_BENEFICIARY,
                beneficiary,
            ),
            (
                person,
                RelationshipType.HAS_CONTACT,
                contact,
            ),
            (
                beneficiary,
                RelationshipType.HAS_CONTACT,
                contact,
            ),
        ],
    )

    gaps = GapDetector(graph).detect_all()
    actions = DayZeroGenerator().generate(gaps)

    assert gaps == []
    assert actions == []


def test_owner_to_asset_edge_is_created():
    """T07: Owner -> Asset relationship exists in graph."""

    graph = build_basic_graph()

    assert graph.has_edge("p1", "a1")


def test_missing_relation_is_detected():
    """T08: Missing beneficiary relationship becomes a graph gap."""

    graph = build_basic_graph()

    gaps = GapDetector(graph).detect_beneficiary_gaps()

    assert len(gaps) == 1
    assert gaps[0].gap_type == "beneficiary"


def test_beneficiary_gap_creates_dayzero_action():
    """T09: Beneficiary gap becomes a Day-Zero action."""

    graph = build_basic_graph()

    gaps = GapDetector(graph).detect_beneficiary_gaps()
    actions = DayZeroGenerator().generate(gaps)

    assert len(actions) == 1

    action = actions[0]

    assert action.title == "Register beneficiary"
    assert action.priority == "high"
    assert action.gap_type == "beneficiary"
    assert action.entity_id == "a1"


def test_confirmed_fields_generate_dayzero_action():
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

    normalized = GraphFieldNormalizer().normalize(fields)

    graph = KnowledgeGraphBuilder().build(
        normalized.entities,
        normalized.relationships,
    )

    gaps = GapDetector(graph).detect_all()

    actions = DayZeroGenerator().generate(gaps)

    assert len(actions) == 2

    assert actions[0].title == "Register beneficiary"
    assert actions[0].priority == "high"

    assert actions[1].title == "Add emergency contact"
    assert actions[1].priority == "medium"