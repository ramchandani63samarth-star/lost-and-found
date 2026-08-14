const id = new URLSearchParams(location.search).get("id");

async function loadItem() {
  const container = document.querySelector("#item-detail");
  if (!id || isNaN(Number(id))) {
    container.innerHTML = `<div class="empty">Invalid item ID.</div>`;
    return;
  }
  container.innerHTML = gridSpinner();

  try {
    const item = await api(`/items/${id}`);
    const user = currentUser();
    const image = item.image_url
      ? `<img class="detail-image" src="${APP_CONFIG.API_ORIGIN}${item.image_url}" alt="${escapeHtml(item.title)}">`
      : `<div class="detail-placeholder"><span>No image provided</span></div>`;

    const date = new Date(item.event_date).toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric"
    });

    const statusClass = { active: "found", claimed: "lost", returned: "found", closed: "lost" }[item.status] || "";

    container.innerHTML = `
      <div class="detail-grid">
        <div>${image}</div>
        <div>
          <div class="chips">
            <span class="chip ${item.type}">${item.type.toUpperCase()}</span>
            <span class="chip">${escapeHtml(item.category)}</span>
            <span class="chip ${statusClass}">${escapeHtml(item.status)}</span>
          </div>
          <h1>${escapeHtml(item.title)}</h1>
          <p class="lead">${escapeHtml(item.description)}</p>
          <div class="detail-list">
            <div><span class="detail-label">📍 Location</span><span>${escapeHtml(item.location)}</span></div>
            <div><span class="detail-label">📅 Date</span><span>${date}</span></div>
            <div><span class="detail-label">👤 Reported by</span><span>${escapeHtml(item.reporter_name)}</span></div>
          </div>
          <div class="detail-actions">
            ${user && user.id !== item.user_id && item.status === "active"
              ? `<button class="btn btn-primary" id="claim-trigger">Submit a Claim</button>`
              : ""}
            <a class="btn btn-ghost" href="items.html">← Back to browse</a>
          </div>
        </div>
      </div>
      <div id="claim-box"></div>
      <section class="matches">
        <h2>Possible Matches</h2>
        <div id="match-grid" class="cards"></div>
      </section>`;

    document.querySelector("#claim-trigger")?.addEventListener("click", showClaim);
    loadMatches();
  } catch (e) {
    container.innerHTML = `<div class="empty">⚠️ ${escapeHtml(e.message)}</div>`;
  }
}

function showClaim() {
  const claimBox = document.querySelector("#claim-box");
  // Toggle: if already open, close it
  if (claimBox.innerHTML.trim()) { claimBox.innerHTML = ""; return; }

  claimBox.innerHTML = `
    <div class="form-card claim-form-card">
      <h2>Submit a Claim</h2>
      <p class="lead">Explain why you believe this item belongs to you.</p>
      <div id="claim-form">
        <label>Your explanation <span class="req">*</span>
          <textarea id="claim-message" placeholder="Describe identifying details, when you lost it, etc." required></textarea>
        </label>
        <label>Verification question (optional)
          <input id="claim-vq" placeholder="e.g. What colour is the strap?">
        </label>
        <label>Your answer
          <input id="claim-va" placeholder="Only you and the owner will see this.">
        </label>
        <div class="form-actions">
          <button class="btn btn-primary" id="claim-submit-btn">Submit Claim</button>
          <button class="btn btn-ghost" id="claim-cancel-btn">Cancel</button>
        </div>
      </div>
    </div>`;

  const submitBtn = document.querySelector("#claim-submit-btn");
  document.querySelector("#claim-cancel-btn").addEventListener("click", () => { claimBox.innerHTML = ""; });
  submitBtn.addEventListener("click", async () => {
    const message = document.querySelector("#claim-message").value.trim();
    if (!message) { toast("Please explain why this item is yours.", "error"); return; }

    setLoading(submitBtn, true, "Submit Claim");
    try {
      await api("/claims", {
        method: "POST",
        body: JSON.stringify({
          item_id: Number(id),
          message,
          verification_question: document.querySelector("#claim-vq").value || null,
          verification_answer: document.querySelector("#claim-va").value || null
        })
      });
      toast("Claim submitted successfully!");
      claimBox.innerHTML = `<div class="claim-success">✅ Your claim has been submitted. The reporter will be notified.</div>`;
    } catch (err) {
      toast(err.message, "error");
      setLoading(submitBtn, false, "Submit Claim");
    }
  });
}

async function loadMatches() {
  const matchGrid = document.querySelector("#match-grid");
  if (!matchGrid) return;
  matchGrid.innerHTML = `<p class="muted-text">Looking for matches…</p>`;
  try {
    // ✅ No auth needed anymore — backend fixed
    const matches = await api(`/items/${id}/matches`);
    matchGrid.innerHTML = matches.length
      ? matches.map(x => itemCard({
          ...x,
          description: `Match score: ${x.match_score}% — ${x.description}`
        })).join("")
      : `<div class="empty">No strong matches found yet.</div>`;
  } catch {
    matchGrid.innerHTML = `<div class="empty">Could not load matches.</div>`;
  }
}

loadItem();
