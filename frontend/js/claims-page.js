requireLogin();

async function loadClaims() {
  const myEl = document.querySelector("#my-claims");
  const recvEl = document.querySelector("#received-claims");

  try {
    const [mine, received] = await Promise.all([
      api("/claims/mine"),
      api("/claims/received")
    ]);

    myEl.innerHTML = mine.length
      ? mine.map(c => `
        <tr>
          <td><a class="text-link" href="item.html?id=${c.item_id}">${escapeHtml(c.title)}</a></td>
          <td><span class="chip ${c.type}">${c.type}</span></td>
          <td>${escapeHtml(c.reporter_name)}</td>
          <td>${new Date(c.created_at).toLocaleDateString()}</td>
          <td><span class="chip ${c.status === 'approved' ? 'found' : c.status === 'rejected' ? 'lost' : ''}">${c.status}</span></td>
        </tr>`).join("")
      : `<tr><td colspan="5" class="empty-cell">You haven't submitted any claims yet.</td></tr>`;

    recvEl.innerHTML = received.length
      ? received.map(c => `
        <tr>
          <td><a class="text-link" href="item.html?id=${c.item_id}">${escapeHtml(c.title)}</a></td>
          <td>${escapeHtml(c.claimant_name)}</td>
          <td>${escapeHtml(c.claimant_email)}</td>
          <td>${new Date(c.created_at).toLocaleDateString()}</td>
          <td><span class="chip ${c.status === 'approved' ? 'found' : c.status === 'rejected' ? 'lost' : ''}">${c.status}</span></td>
          <td>${c.status === "pending"
            ? `<button class="btn-approve" onclick="reviewClaim(${c.id},'approved',this)">Approve</button>
               <button class="btn-reject" onclick="reviewClaim(${c.id},'rejected',this)">Reject</button>`
            : "—"
          }</td>
        </tr>`).join("")
      : `<tr><td colspan="6" class="empty-cell">No claims received on your items.</td></tr>`;

  } catch (e) {
    toast(e.message, "error");
  }
}

async function reviewClaim(id, status, btn) {
  btn.disabled = true;
  try {
    await api(`/claims/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    toast(`Claim ${status}.`);
    loadClaims();
  } catch (e) {
    toast(e.message, "error");
    btn.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", loadClaims);
