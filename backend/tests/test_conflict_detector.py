from app.services.conflict_detector import ConflictDetector


def make_document(document_id, filename, fields):
    return {
        "id": document_id,
        "filename": filename,
        "fields": fields,
    }


def make_field(label, value, status="CONFIRMED"):
    return {
        "field_label": label,
        "extracted_value": value,
        "confirmation_status": status,
    }


def test_detects_conflicting_confirmed_owner_names():
    documents = [
        make_document(
            "doc-1",
            "insurance.pdf",
            [make_field("Policy Holder", "Raj Sharma")],
        ),
        make_document(
            "doc-2",
            "bank.pdf",
            [make_field("Account Holder", "Ravi Sharma")],
        ),
    ]

    conflicts = ConflictDetector().detect(documents)

    assert len(conflicts) == 1
    assert conflicts[0].field_label == "owner_name"
    assert conflicts[0].first_document in {"insurance.pdf", "bank.pdf"}
    assert conflicts[0].second_document in {"insurance.pdf", "bank.pdf"}
    assert "neither value has been selected as correct" in conflicts[0].reason


def test_matching_values_ignore_case_and_extra_whitespace():
    documents = [
        make_document(
            "doc-1",
            "insurance.pdf",
            [make_field("Owner Name", "Raj Sharma")],
        ),
        make_document(
            "doc-2",
            "bank.pdf",
            [make_field("Account Holder", "  RAJ   SHARMA  ")],
        ),
    ]

    assert ConflictDetector().detect(documents) == []


def test_ignores_unconfirmed_fields():
    documents = [
        make_document(
            "doc-1",
            "insurance.pdf",
            [make_field("Owner Name", "Raj Sharma", "CONFIRMED")],
        ),
        make_document(
            "doc-2",
            "bank.pdf",
            [make_field("Account Holder", "Ravi Sharma", "UNCONFIRMED")],
        ),
    ]

    assert ConflictDetector().detect(documents) == []


def test_does_not_compare_fields_from_the_same_document():
    documents = [
        make_document(
            "doc-1",
            "combined.pdf",
            [
                make_field("Owner Name", "Raj Sharma"),
                make_field("Account Holder", "Ravi Sharma"),
            ],
        ),
    ]

    assert ConflictDetector().detect(documents) == []


def test_conflict_id_is_stable_between_runs():
    documents = [
        make_document(
            "doc-1",
            "insurance.pdf",
            [make_field("Owner Name", "Raj Sharma")],
        ),
        make_document(
            "doc-2",
            "bank.pdf",
            [make_field("Account Holder", "Ravi Sharma")],
        ),
    ]

    detector = ConflictDetector()

    first = detector.detect(documents)
    second = detector.detect(documents)

    assert len(first) == len(second) == 1
    assert first[0].conflict_id == second[0].conflict_id