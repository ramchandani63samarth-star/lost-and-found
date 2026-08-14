const form = document.querySelector("#auth-form");
if (form) {
  const btn = form.querySelector("button[type=submit], button:not([type])");
  const btnText = btn ? btn.textContent : "";

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const isRegister = form.dataset.mode === "register";
    const data = Object.fromEntries(new FormData(form).entries());

    // Client-side validation
    if (isRegister && (!data.name || !data.name.trim())) {
      return toast("Full name is required.", "error");
    }
    if (!data.email || !data.password) {
      return toast("Email and password are required.", "error");
    }

    setLoading(btn, true, btnText);
    try {
      const result = await api(isRegister ? "/auth/register" : "/auth/login", {
        method: "POST",
        body: JSON.stringify(data)
      });

      if (isRegister) {
        toast("Account created! Redirecting to login…");
        setTimeout(() => location.href = "login.html", 900);
      } else {
        localStorage.setItem("clf_token", result.token);
        localStorage.setItem("clf_user", JSON.stringify(result.user));
        location.href = "dashboard.html";
      }
    } catch (err) {
      toast(err.message, "error");
      setLoading(btn, false, btnText);
    }
  });
}
