// ✅ FIX: Guard against missing user before accessing .role
const _adminUser = currentUser();
if (!_adminUser) {
  location.href = "login.html";
} else if (_adminUser.role !== "admin") {
  toast("Admin access required.", "error");
  setTimeout(() => { location.href = "dashboard.html"; }, 800);
}

async function loadAdmin() {
  try {
    const s = await api("/admin/stats");
    for (const k of ["users", "lost", "found", "returned", "pending"]) {
      const el = document.querySelector(`#stat-${k}`);
      if (el) el.textContent = s[k] ?? "–";
    }

    const [items, claims] = await Promise.all([api("/admin/items"), api("/admin/claims")]);

    const itemsEl = document.querySelector("#admin-items");
    if (itemsEl) {
      itemsEl.innerHTML = items.length
        ? items.slice(0, 20).map(i => `
          <tr>
            <td>#${i.id}</td>
            <td>${escapeHtml(i.title)}</td>
            <td><span class="chip ${i.type}">${i.type}</span></td>
            <td>${escapeHtml(i.reporter_name)}</td>
            <td>${escapeHtml(i.status)}</td>
            <td><button class="small-danger" onclick="deleteItem(${i.id}, this)">Delete</button></td>
          </tr>`).join("")
        : `<tr><td colspan="6" class="empty-cell">No items.</td></tr>`;
    }

    const claimsEl = document.querySelector("#admin-claims");
    if (claimsEl) {
      claimsEl.innerHTML = claims.length
        ? claims.slice(0, 20).map(c => `
          <tr>
            <td>#${c.id}</td>
            <td>${escapeHtml(c.title)}</td>
            <td>${escapeHtml(c.claimant_name)}</td>
            <td><span class="chip ${c.status === "approved" ? "found" : c.status === "rejected" ? "lost" : ""}">${escapeHtml(c.status)}</span></td>
            <td>${c.status === "pending"
              ? `<button onclick="reviewClaim(${c.id},'approved')">Approve</button>
                 <button class="small-danger" onclick="reviewClaim(${c.id},'rejected')">Reject</button>`
              : "—"
            }</td>
          </tr>`).join("")
        : `<tr><td colspan="5" class="empty-cell">No claims.</td></tr>`;
    }

  } catch (e) {
    toast(e.message, "error");
  }
}

async function deleteItem(id, btn) {
  if (!confirm("Permanently delete this report? This cannot be undone.")) return;
  btn.disabled = true;
  try {
    await api(`/admin/items/${id}`, { method: "DELETE" });
    toast("Report deleted.");
    loadAdmin();
  } catch (e) {
    toast(e.message, "error");
    btn.disabled = false;
  }
}

async function reviewClaim(id, status) {
  try {
    await api(`/claims/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    toast(`Claim ${status}.`);
    loadAdmin();
  } catch (e) {
    toast(e.message, "error");
  }
}

document.addEventListener("DOMContentLoaded", loadAdmin);
