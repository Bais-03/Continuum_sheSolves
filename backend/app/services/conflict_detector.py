"""Conservative detection of conflicting confirmed document fields."""

from dataclasses import dataclass
import hashlib
import re
import unicodedata


@dataclass(frozen=True)
class FieldConflict:
    """A pair of confirmed field values that need human review."""

    conflict_id: str
    field_label: str
    first_value: str
    first_document: str
    second_value: str
    second_document: str
    reason: str


class ConflictDetector:
    """Find disagreements in a small, explicit set of identity fields."""

    # Deliberately narrow: do not compare general policy/account attributes
    # that may legitimately differ between separate assets.
    FIELD_ALIASES = {
        "owner": "owner_name",
        "owner name": "owner_name",
        "primary owner": "owner_name",
        "policy holder": "owner_name",
        "policyholder": "owner_name",
        "account holder": "owner_name",
        "account owner": "owner_name",
        "property owner": "owner_name",
        "borrower": "owner_name",
        "date of birth": "date_of_birth",
        "birth date": "date_of_birth",
        "dob": "date_of_birth",
    }

    @staticmethod
    def _normalize_label(label: object) -> str:
        label = unicodedata.normalize("NFKC", str(label or ""))
        label = re.sub(r"\s+", " ", label.casefold()).strip()
        return label

    @staticmethod
    def _normalize_value(value: object) -> str:
        value = unicodedata.normalize("NFKC", str(value or ""))
        return re.sub(r"\s+", " ", value.casefold()).strip()

    @staticmethod
    def _meaningful(value: object) -> bool:
        return bool(str(value or "").strip())

    def detect(self, documents: list[dict]) -> list[FieldConflict]:
        """
        Each document dictionary must contain:
          id, filename, fields

        Each field dictionary must contain:
          field_label, extracted_value, confirmation_status
        """
        candidates: dict[str, list[dict]] = {}

        for document in documents:
            document_id = str(document.get("id") or "")
            filename = str(document.get("filename") or "Unknown document")

            for field in document.get("fields", []):
                if str(field.get("confirmation_status", "")).upper() != "CONFIRMED":
                    continue

                value = str(field.get("extracted_value") or "").strip()
                if not self._meaningful(value):
                    continue

                raw_label = self._normalize_label(field.get("field_label"))
                canonical_label = self.FIELD_ALIASES.get(raw_label)
                if canonical_label is None:
                    continue

                candidates.setdefault(canonical_label, []).append(
                    {
                        "document_id": document_id,
                        "filename": filename,
                        "field_label": str(field.get("field_label") or "").strip(),
                        "value": value,
                        "normalized_value": self._normalize_value(value),
                    }
                )

        conflicts: list[FieldConflict] = []
        seen: set[str] = set()

        for canonical_label, entries in candidates.items():
            for index, first in enumerate(entries):
                for second in entries[index + 1:]:
                    if not first["document_id"] or not second["document_id"]:
                        continue
                    if first["document_id"] == second["document_id"]:
                        continue
                    if first["normalized_value"] == second["normalized_value"]:
                        continue

                    identity = "|".join(
                        sorted(
                            [
                                first["document_id"],
                                second["document_id"],
                                first["normalized_value"],
                                second["normalized_value"],
                            ]
                        )
                    )
                    conflict_id = "conflict:" + hashlib.sha256(
                        f"{canonical_label}|{identity}".encode("utf-8")
                    ).hexdigest()[:20]

                    if conflict_id in seen:
                        continue
                    seen.add(conflict_id)

                    conflicts.append(
                        FieldConflict(
                            conflict_id=conflict_id,
                            field_label=canonical_label,
                            first_value=first["value"],
                            first_document=first["filename"],
                            second_value=second["value"],
                            second_document=second["filename"],
                            reason=(
                                f"Confirmed {canonical_label.replace('_', ' ')} "
                                f"values disagree across {first['filename']} "
                                f"({first['value']}) and {second['filename']} "
                                f"({second['value']}). Verify the source documents; "
                                f"neither value has been selected as correct."
                            ),
                        )
                    )

        return conflicts