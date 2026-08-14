function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}

function itemCard(item) {
  const img = item.image_url ? `${APP_CONFIG.API_ORIGIN}${item.image_url}` : "";
  const date = item.event_date ? new Date(item.event_date).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "";
  return `
  <article class="item-card">
    <div class="item-image">${img ? `<img src="${img}" alt="${escapeHtml(item.title)} photo" loading="lazy">` : `<span class="item-placeholder">${item.type === "lost" ? "?" : "✓"}</span>`}</div>
    <div class="item-body">
      <div class="chips">
        <span class="chip ${item.type}">${item.type.toUpperCase()}</span>
        <span class="chip">${escapeHtml(item.category)}</span>
        ${item.status !== "active" ? `<span class="chip chip-status">${escapeHtml(item.status)}</span>` : ""}
      </div>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.description).slice(0, 110)}${item.description.length > 110 ? "…" : ""}</p>
      <div class="meta">📍 ${escapeHtml(item.location)} · 📅 ${date}</div>
      <a class="text-link" href="item.html?id=${item.id}">View details →</a>
    </div>
  </article>`;
}

// Spinner for grid loading
function gridSpinner() {
  return `<div class="grid-loading"><div class="spinner"></div><p>Loading…</p></div>`;
}

let _toastTimer = null;
function toast(message, kind = "") {
  // Remove existing toast if present
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  clearTimeout(_toastTimer);

  const t = document.createElement("div");
  t.className = `toast ${kind}`;
  t.textContent = message;
  document.body.appendChild(t);
  // Animate in
  requestAnimationFrame(() => t.classList.add("toast-show"));
  _toastTimer = setTimeout(() => {
    t.classList.remove("toast-show");
    setTimeout(() => t.remove(), 300);
  }, 3200);
}
