// Frontend logic to call the Flask backend and populate the dashboard.
// In later phases we will wire this to real APIs.

async function fetchViolations(filters = {}) {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/violations?${params.toString()}`);
  if (!response.ok) {
    console.error("Failed to fetch violations");
    return [];
  }
  const data = await response.json();
  return data.violations || [];
}

function renderViolations(rows) {
  const tbody = document.querySelector("#violationsTable tbody");
  const noData = document.getElementById("noData");
  tbody.innerHTML = "";

  if (!rows.length) {
    noData.classList.remove("hidden");
    return;
  }

  noData.classList.add("hidden");

  rows.forEach((v, idx) => {
    const tr = document.createElement("tr");

    const snapshotCell = v.snapshot_path
      ? `<img class="snapshot" src="${v.snapshot_path}" alt="snapshot" />`
      : "-";

    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${v.vehicle_number || "-"}</td>
      <td>${v.violation_type || "-"}</td>
      <td>${v.speed_kmph != null ? v.speed_kmph.toFixed(1) : "-"}</td>
      <td>${v.timestamp || "-"}</td>
      <td>${snapshotCell}</td>
    `;

    tbody.appendChild(tr);
  });
}

async function handleSearch() {
  const filters = {
    vehicle_number: document.getElementById("vehicleNumber").value.trim(),
    from_date: document.getElementById("fromDate").value,
    to_date: document.getElementById("toDate").value,
    violation_type: document.getElementById("violationType").value,
  };

  // Remove empty filters
  Object.keys(filters).forEach((k) => {
    if (!filters[k]) delete filters[k];
  });

  const violations = await fetchViolations(filters);
  renderViolations(violations);
}

function handleReset() {
  document.getElementById("vehicleNumber").value = "";
  document.getElementById("fromDate").value = "";
  document.getElementById("toDate").value = "";
  document.getElementById("violationType").value = "";
  handleSearch();
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("searchBtn").addEventListener("click", handleSearch);
  document.getElementById("resetBtn").addEventListener("click", handleReset);

  // Initial load
  handleSearch();
});


