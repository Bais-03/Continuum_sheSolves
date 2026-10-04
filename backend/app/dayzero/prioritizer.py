"""
Continuum Day-Zero - Gap Prioritization

Person 3 responsibility:
Convert detected graph-gap severity into a deterministic
priority ordering for Day-Zero actions.

This module does not create database tasks.
It only orders GraphGap objects.
"""

from app.graph.gap_detector import GapSeverity, GraphGap


# Lower number means higher priority.
PRIORITY_RANK = {
    GapSeverity.HIGH: 1,
    GapSeverity.MEDIUM: 2,
    GapSeverity.LOW: 3,
}


class GapPrioritizer:
    """Sort detected gaps from highest to lowest priority."""

    @staticmethod
    def priority_rank(gap: GraphGap) -> int:
        """Return the numeric priority rank of a gap."""

        return PRIORITY_RANK[gap.severity]

    @classmethod
    def prioritize(
        cls,
        gaps: list[GraphGap],
    ) -> list[GraphGap]:
        """
        Return gaps ordered from highest to lowest priority.

        The original list is not modified.
        """

        return sorted(
            gaps,
            key=cls.priority_rank,
        )