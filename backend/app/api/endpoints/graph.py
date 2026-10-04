"""
Continuum Knowledge Graph API

Person 3 responsibility:
Expose the knowledge graph and Day-Zero analysis
through the existing FastAPI backend.
"""

from fastapi import APIRouter, Depends

from app.api.deps import get_current_household
from app.db.session import get_db
from app.models.household import Household
from app.schemas.graph import (
    DayZeroActionOut,
    GraphAnalysisResponse,
    GraphAnalyzeRequest,
    GraphEdgeOut,
    GraphEntityOut,
    GraphGapOut,
)
from app.services.graph_service import GraphService
from sqlalchemy.orm import Session


router = APIRouter(
    prefix="/graph",
    tags=["graph"],
)


@router.post("/analyze", response_model=GraphAnalysisResponse)
def analyze_graph(
    request: GraphAnalyzeRequest,
    household: Household = Depends(get_current_household),
    db: Session = Depends(get_db),
):
    """Analyze the authenticated household's confirmed graph data.

    With an empty request body, the graph is built directly from the
    household's persisted confirmed fields. A non-empty ``fields`` payload
    remains supported for backwards compatibility with existing API tests
    and isolated graph callers.
    """

    service = GraphService()
    if request.fields:
        fields = [field.model_dump() for field in request.fields]
        result = service.analyze_fields(fields)
    else:
        result = service.analyze_household(db, household)

    entities = [
        GraphEntityOut(
            id=node_id,
            entity_type=node_data["entity_type"],
            name=node_data["name"],
        )
        for node_id, node_data in result.graph.nodes(data=True)
    ]

    relationships = [
        GraphEdgeOut(
            source=source,
            target=target,
            relationship=edge_data["relationship"],
        )
        for source, target, edge_data
        in result.graph.edges(data=True)
    ]

    gaps = [
        GraphGapOut(
            gap_type=gap.gap_type,
            entity_id=gap.entity_id,
            title=gap.title,
            reason=gap.reason,
            severity=gap.severity.value,
        )
        for gap in result.gaps
    ]

    actions = [
        DayZeroActionOut(
            title=action.title,
            description=action.description,
            priority=action.priority,
            gap_type=action.gap_type,
            entity_id=action.entity_id,
        )
        for action in result.actions
    ]

    return GraphAnalysisResponse(
        entities=entities,
        relationships=relationships,
        gaps=gaps,
        actions=actions,
    )