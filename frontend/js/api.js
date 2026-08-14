function token() { return localStorage.getItem("clf_token"); }
function currentUser() {
  try { return JSON.parse(localStorage.getItem("clf_user") || "null"); } catch { return null; }
}

async function api(path, options = {}) {
  const headers = options.headers || {};
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (token()) headers.Authorization = `Bearer ${token()}`;

  let response;
  try {
    response = await fetch(`${APP_CONFIG.API_BASE}${path}`, { ...options, headers });
  } catch (networkErr) {
    throw new Error("Cannot reach the server. Make sure the backend is running.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}

function requireLogin() {
  if (!token()) {
    toast("Please log in to continue.", "error");
    setTimeout(() => { location.href = "login.html"; }, 800);
  }
}

function logout() {
  localStorage.removeItem("clf_token");
  localStorage.removeItem("clf_user");
  location.href = "index.html";
}

// Loading state helpers
function setLoading(el, isLoading, originalText = "") {
  if (!el) return;
  el.disabled = isLoading;
  el.textContent = isLoading ? "Please wait…" : originalText;
}

function nav() {
  const user = currentUser();
  const el = document.querySelector("#nav-actions");
  if (!el) return;
  el.innerHTML = user
    ? `<a href="dashboard.html">Dashboard</a>
       <a href="items.html">Browse</a>
       <a href="report.html">Report</a>
       ${user.role === "admin" ? `<a href="admin.html">Admin</a>` : ""}
       <button class="btn btn-ghost" onclick="logout()">Logout</button>`
    : `<a href="items.html">Browse</a>
       <a href="login.html">Login</a>
       <a class="btn btn-primary" href="register.html">Get Started</a>`;
}
document.addEventListener("DOMContentLoaded", nav);
