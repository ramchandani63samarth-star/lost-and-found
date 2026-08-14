const grid = document.querySelector("#item-grid");
const searchForm = document.querySelector("#search-form");
const resetBtn = document.querySelector("#reset-filters");

async function loadItems() {
  if (!grid) return;
  grid.innerHTML = gridSpinner();

  const fd = searchForm ? new FormData(searchForm) : new FormData();
  const params = new URLSearchParams();
  for (const [k, v] of fd.entries()) if (v) params.set(k, v);

  try {
    const items = await api(`/items?${params.toString()}`);
    if (!items.length) {
      grid.innerHTML = `<div class="empty">
        <p>No matching reports found.</p>
        <button class="btn btn-ghost" onclick="resetAndLoad()">Clear filters</button>
      </div>`;
      return;
    }
    grid.innerHTML = items.map(itemCard).join("");
  } catch (e) {
    grid.innerHTML = `<div class="empty error-msg">⚠️ ${escapeHtml(e.message)}</div>`;
  }
}

function resetAndLoad() {
  if (searchForm) searchForm.reset();
  loadItems();
}

searchForm?.addEventListener("submit", e => { e.preventDefault(); loadItems(); });
resetBtn?.addEventListener("click", resetAndLoad);

document.addEventListener("DOMContentLoaded", loadItems);
