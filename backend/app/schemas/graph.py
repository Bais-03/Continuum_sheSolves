"""
Continuum Knowledge Graph API Schemas

Person 3 responsibility:
Defines request/response contracts for the graph
analysis endpoint.

These schemas intentionally remain independent of
SQLAlchemy models.
"""

from pydantic import BaseModel, Field


class GraphFieldInput(BaseModel):
    """Extracted field supplied to the graph engine."""

    field_label: str
    extracted_value: str | None = None
    confirmation_status: str = "UNCONFIRMED"


class GraphAnalyzeRequest(BaseModel):
    """Request body for graph analysis."""

    fields: list[GraphFieldInput] = Field(default_factory=list)


class GraphEntityOut(BaseModel):
    """Graph node returned by the API."""

    id: str
    entity_type: str
    name: str


class GraphEdgeOut(BaseModel):
    """Graph relationship returned by the API."""

    source: str
    target: str
    relationship: str


class GraphGapOut(BaseModel):
    """Detected readiness gap."""

    gap_type: str
    entity_id: str
    title: str
    reason: str
    severity: str


class DayZeroActionOut(BaseModel):
    title: str
    description: str
    priority: str
    gap_type: str
    entity_id: str

    # Persisted Task information
    task_id: str
    status: str


class GraphAnalysisResponse(BaseModel):
    """Complete graph analysis response."""

    entities: list[GraphEntityOut]
    relationships: list[GraphEdgeOut]
    gaps: list[GraphGapOut]
    actions: list[DayZeroActionOut]