const rows = document.querySelector("#flip-rows");
const updated = document.querySelector("#last-updated");
const method = document.querySelector("#method");
const membershipFilter = document.querySelector("#membership-filter");
const issueDate = document.querySelector("#issue-date");
const candidateCount = document.querySelector("#candidate-count");
const bestHourly = document.querySelector("#best-hourly");
const membersCount = document.querySelector("#members-count");
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
let items = [];

function cell(value, className = "") {
  const td = document.createElement("td");
  td.textContent = value;
  td.className = className;
  return td;
}

function showError(message) {
  rows.replaceChildren();
  const tr = document.createElement("tr");
  const td = cell(message, "status error");
  td.colSpan = 5;
  tr.append(td);
  rows.append(tr);
  updated.textContent = "Unavailable";
  issueDate.textContent = "Unavailable";
  candidateCount.textContent = "—";
  bestHourly.textContent = "—";
  membersCount.textContent = "—";
}

function matchesMembership(item) {
  if (membershipFilter.value === "members") {
    return item.members;
  }
  if (membershipFilter.value === "free") {
    return !item.members;
  }
  return true;
}

function renderRows() {
  rows.replaceChildren();
  const visibleItems = items.filter(matchesMembership);

  for (const item of visibleItems) {
    const tr = document.createElement("tr");
    const nameCell = document.createElement("td");
    const link = document.createElement("a");
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = item.name;
    link.className = "item-link";
    nameCell.append(link);

    tr.append(
      nameCell,
      cell(number.format(item.recommended_buy), "numeric price"),
      cell(number.format(item.recommended_sell), "numeric price"),
      cell(`${number.format(item.estimated_profit_per_hour)} gp`, "numeric profit"),
      cell(`${number.format(item.max_profit)} gp`, "numeric profit"),
    );
    rows.append(tr);
  }

  if (visibleItems.length === 0) {
    const tr = document.createElement("tr");
    const td = cell("No recommendations match this filter.", "status");
    td.colSpan = 5;
    tr.append(td);
    rows.append(tr);
  }
}

membershipFilter.addEventListener("change", renderRows);

try {
  const response = await fetch("data/flips.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`data request returned ${response.status}`);
  }

  const data = await response.json();
  if (!Array.isArray(data.items)) {
    throw new Error("data file has no items array");
  }

  const timestamp = new Date(data.updated_at);
  if (Number.isNaN(timestamp.getTime())) {
    throw new Error("data file has an invalid timestamp");
  }

  updated.dateTime = timestamp.toISOString();
  updated.textContent = timestamp.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  updated.title = timestamp.toISOString();
  issueDate.textContent = timestamp.toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  method.textContent =
    "Estimated profit includes expected fills and time. Max profit assumes the full buy limit fills and sells.";

  items = data.items;
  candidateCount.textContent = number.format(items.length);
  bestHourly.textContent = `${number.format(Math.max(...items.map((item) => item.estimated_profit_per_hour)))} gp`;
  membersCount.textContent = number.format(items.filter((item) => item.members).length);
  renderRows();
} catch (error) {
  console.error(error);
  showError("The latest shortlist could not be loaded. Please try again later.");
}
