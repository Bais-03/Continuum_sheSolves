from fastapi import APIRouter

from app.api.endpoints import auth, households, graph
from app.api.endpoints.domain import (
    docs_router,
    fields_router,
    scores_router,
    tasks_router,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(households.router)
api_router.include_router(docs_router)
api_router.include_router(fields_router)
api_router.include_router(scores_router)
api_router.include_router(tasks_router)
api_router.include_router(graph.router)