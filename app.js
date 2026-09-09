const rows = document.querySelector("#flip-rows");
const updated = document.querySelector("#last-updated");
const method = document.querySelector("#method");
const filterButtons = document.querySelectorAll(".filter-button");
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
let items = [];
let activeFilter = "all";

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
}

function matchesMembership(item) {
  if (activeFilter === "members") {
    return item.members;
  }
  if (activeFilter === "free") {
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

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((filter) => {
      const isActive = filter === button;
      filter.classList.toggle("is-active", isActive);
      filter.setAttribute("aria-pressed", String(isActive));
    });
    renderRows();
  });
});

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
  method.textContent =
    "The list ranks items by expected profit each hour.";

  items = data.items;
  renderRows();
} catch (error) {
  console.error(error);
  showError("The latest shortlist could not be loaded. Please try again later.");
}
