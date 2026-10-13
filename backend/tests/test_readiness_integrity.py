from types import SimpleNamespace

import pytest

from app.services.readiness_service import calculate_dimension_score


def field(label, value):
    return SimpleNamespace(
        field_label=label,
        extracted_value=value,
    )


def test_duplicate_labels_do_not_increase_evidence_coverage():
    confirmed_fields = [
        field("Nominee", "Meera Kulkarni"),
        field("Nominee", "Meera Kulkarni"),
        field("Beneficiary Name", "Meera Kulkarni"),
    ]

    result = calculate_dimension_score(
        base=15.0,
        target_slots=3,
        confirmed_fields=confirmed_fields,
    )

    assert result["evidence_count"] == 1
    assert result["duplicate_count"] == 2
    assert result["coverage"] == pytest.approx(0.333, abs=0.001)
    assert result["score"] == pytest.approx(43.3)


def test_empty_and_placeholder_values_do_not_count_as_evidence():
    confirmed_fields = [
        field("Nominee", "   "),
        field("Beneficiary Name", "unknown"),
        field("Emergency Contact", None),
        field("Policy Number", "POL-123"),
    ]

    result = calculate_dimension_score(
        base=20.0,
        target_slots=3,
        confirmed_fields=confirmed_fields,
    )

    assert result["evidence_count"] == 1
    assert result["empty_value_count"] == 3
    assert result["duplicate_count"] == 0
    assert result["coverage"] == pytest.approx(0.333, abs=0.001)
    assert result["score"] == pytest.approx(46.7)


def test_score_never_exceeds_100_percent_coverage():
    confirmed_fields = [
        field("Policy Number", "POL-123"),
        field("Account Number", "ACC-456"),
        field("Nominee", "Meera"),
        field("Emergency Contact", "9876543210"),
        field("Renewal Date", "2030-01-01"),
    ]

    result = calculate_dimension_score(
        base=20.0,
        target_slots=3,
        confirmed_fields=confirmed_fields,
    )

    assert result["evidence_count"] == 5
    assert result["coverage"] == 1.0
    assert result["score"] == 100.0