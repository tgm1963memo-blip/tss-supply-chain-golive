"""Offset/limit slicing for policy-filtered DBF rows (used by express_sync_engine)."""


class OffsetLimitSlicer:
    """Apply offset then limit after policy filtering."""

    def __init__(self, offset=0, limit=None):
        self.offset = max(int(offset or 0), 0)
        self.limit = limit
        self.policy_filtered_count = 0
        self.synced_count = 0
        self.stopped = False

    def accept_policy_row(self):
        """
        Call when a row passes policy filters.
        Returns True if the row should be mapped/upserted.
        """
        if self.stopped:
            return False

        self.policy_filtered_count += 1

        if self.policy_filtered_count <= self.offset:
            return False

        if self.limit is not None and self.synced_count >= self.limit:
            self.stopped = True
            return False

        self.synced_count += 1
        if self.limit is not None and self.synced_count >= self.limit:
            self.stopped = True
        return True

    @property
    def rows_skipped_by_offset(self):
        return min(self.policy_filtered_count, self.offset)

    def summary_fields(self):
        return {
            "offset": self.offset,
            "limit": self.limit,
            "policy_filtered_rows": self.policy_filtered_count,
            "rows_skipped_by_offset": self.rows_skipped_by_offset,
            "selected_rows_after_slice": self.synced_count,
        }
