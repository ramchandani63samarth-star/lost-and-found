requireLogin();

const form = document.querySelector("#report-form");
const submitBtn = form?.querySelector("button[type=submit], button:not([type])");
const btnText = submitBtn?.textContent || "Submit report";

// ✅ FIX: Set today as max date so future dates can't be selected
const dateInput = form?.querySelector("input[name=event_date]");
if (dateInput) {
  dateInput.max = new Date().toISOString().split("T")[0];
}

form?.addEventListener("submit", async e => {
  e.preventDefault();

  const data = new FormData(form);
  const eventDate = data.get("event_date");
  const today = new Date().toISOString().split("T")[0];

  if (eventDate > today) {
    return toast("Event date cannot be in the future.", "error");
  }

  setLoading(submitBtn, true, btnText);
  try {
    const result = await api("/items", { method: "POST", body: data });
    toast("Report submitted successfully!");
    setTimeout(() => location.href = `item.html?id=${result.itemId}`, 700);
  } catch (err) {
    toast(err.message, "error");
    setLoading(submitBtn, false, btnText);
  }
});
