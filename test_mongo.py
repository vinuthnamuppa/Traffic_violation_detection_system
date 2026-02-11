from datetime import datetime
from backend.models.violation import Violation, insert_violation, list_violations

v = Violation(
    vehicle_number="KA01AB1234",
    violation_type="over_speeding",
    speed_kmph=78.5,
    timestamp=datetime.utcnow(),
    snapshot_path="data/snapshots/test_violation.jpg",
)

violation_id = insert_violation(v)
print("Inserted ID:", violation_id)

rows = list_violations(limit=5)
for r in rows:
    print(r)