requireLogin();

async function loadDashboard() {
  const user = currentUser();
  const welcomeEl = document.querySelector("#welcome");
  if (welcomeEl) welcomeEl.textContent = `Welcome back, ${user.name}.`;

  const reportsEl = document.querySelector("#recent-reports");
  const claimsEl = document.querySelector("#recent-claims");
  const reportCountEl = document.querySelector("#report-count");
  const claimCountEl = document.querySelector("#claim-count");
  const receivedCountEl = document.querySelector("#received-count");

  if (reportsEl) reportsEl.innerHTML = gridSpinner();
  if (claimsEl) claimsEl.innerHTML = gridSpinner();

  try {
    const [reports, myClaims, received] = await Promise.all([
      api("/items/mine/reports"),
      api("/claims/mine"),
      api("/claims/received")
    ]);

    if (reportCountEl) reportCountEl.textContent = reports.length;
    if (claimCountEl) claimCountEl.textContent = myClaims.length;
    if (receivedCountEl) receivedCountEl.textContent = received.filter(c => c.status === "pending").length;

    if (reportsEl) {
      reportsEl.innerHTML = reports.length
        ? reports.slice(0, 4).map(itemCard).join("")
        : `<div class="empty">No reports yet. <a class="text-link" href="report.html">Make your first report →</a></div>`;
    }

    if (claimsEl) {
      const pendingReceived = received.filter(c => c.status === "pending");
      claimsEl.innerHTML = pendingReceived.length
        ? pendingReceived.slice(0, 5).map(c => `
          <div class="claim-row">
            <div>
              <strong>${escapeHtml(c.title)}</strong>
              <span class="claim-meta"> · claimed by ${escapeHtml(c.claimant_name)} · ${new Date(c.created_at).toLocaleDateString()}</span>
            </div>
            <div class="claim-btns">
              <button class="btn-approve" onclick="reviewClaim(${c.id},'approved',this)">Approve</button>
              <button class="btn-reject" onclick="reviewClaim(${c.id},'rejected',this)">Reject</button>
            </div>
          </div>`).join("")
        : `<div class="empty">No pending claims on your items.</div>`;
    }

  } catch (e) {
    toast(e.message, "error");
    if (reportsEl) reportsEl.innerHTML = `<div class="empty">Could not load data.</div>`;
    if (claimsEl) claimsEl.innerHTML = "";
  }
}

async function reviewClaim(id, status, btn) {
  const row = btn.closest(".claim-row");
  btn.disabled = true;
  try {
    await api(`/claims/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    toast(`Claim ${status}.`);
    row.style.opacity = "0.4";
    setTimeout(loadDashboard, 1200);
  } catch (e) {
    toast(e.message, "error");
    btn.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", loadDashboard);
