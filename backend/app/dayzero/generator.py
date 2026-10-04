"""
Continuum Day-Zero - Action Generator

Person 3 responsibility:
Convert detected graph gaps into actionable Day-Zero
instructions.

This module does not persist tasks to the database.
The integration layer can later map these actions to
the existing Task model.
"""

from dataclasses import dataclass

from app.graph.gap_detector import GraphGap
from app.dayzero.prioritizer import GapPrioritizer


@dataclass(frozen=True)
class DayZeroAction:
    """
    An actionable task generated from a readiness gap.
    """

    title: str
    description: str
    priority: str
    gap_type: str
    entity_id: str


class DayZeroGenerator:
    """Generate prioritized Day-Zero actions from graph gaps."""

    def __init__(self) -> None:
        self.prioritizer = GapPrioritizer()

    def generate(
        self,
        gaps: list[GraphGap],
    ) -> list[DayZeroAction]:
        """
        Convert graph gaps into prioritized Day-Zero actions.

        No actions are generated when there are no gaps.
        """

        prioritized_gaps = self.prioritizer.prioritize(gaps)

        return [
            DayZeroAction(
                title=gap.title,
                description=gap.reason,
                priority=gap.severity.value,
                gap_type=gap.gap_type,
                entity_id=gap.entity_id,
            )
            for gap in prioritized_gaps
        ]