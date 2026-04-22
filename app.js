import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAVZiX604ehucKc2dTySaLEs7DwxHzBeYc",
  authDomain: "points-system-98b72.firebaseapp.com",
  databaseURL: "https://points-system-98b72-default-rtdb.firebaseio.com",
  projectId: "points-system-98b72",
  storageBucket: "points-system-98b72.firebasestorage.app",
  messagingSenderId: "244004306850",
  appId: "1:244004306850:web:ac1ecf505a2d317d32bcfb",
  measurementId: "G-25PCRHN2ZW",
};

const CONFIG_PATH = "points/config";
const DEFAULT_AMOUNTS = [1, 5, 10, 20];

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const configRef = ref(db, CONFIG_PATH);

const el = {
  toggle: document.getElementById("enableToggle"),
  percentage: document.getElementById("percentageInput"),
  ratesBody: document.getElementById("ratesBody"),
  saveBtn: document.getElementById("saveBtn"),
  status: document.getElementById("statusText"),
};

function formatPoints(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "0.00";
  return v.toFixed(2);
}

function computePoints(amount, percentage) {
  const p = Number(percentage);
  const a = Number(amount);
  if (!Number.isFinite(p) || !Number.isFinite(a)) return 0;
  return (a * p) / 100;
}

function renderTable(amounts, percentage) {
  el.ratesBody.innerHTML = amounts
    .map(
      (amt) => `
    <tr>
      <td>₱ ${Number(amt).toFixed(2)}</td>
      <td>${formatPoints(computePoints(amt, percentage))}</td>
    </tr>
  `
    )
    .join("");
}

function setStatus(msg, type) {
  el.status.textContent = msg;
  el.status.classList.remove("is-error", "is-ok");
  if (type === "error") el.status.classList.add("is-error");
  if (type === "ok") el.status.classList.add("is-ok");
}

function readUiState() {
  const enabled = el.toggle.getAttribute("aria-checked") === "true";
  const percentage = parseFloat(el.percentage.value);
  return {
    enabled,
    percentage: Number.isFinite(percentage) ? percentage : 0,
    amounts: DEFAULT_AMOUNTS,
    updatedAt: Date.now(),
  };
}

function applyState(data) {
  const enabled = Boolean(data?.enabled);
  const percentage = Number.isFinite(Number(data?.percentage)) ? Number(data.percentage) : 0;
  const amounts = Array.isArray(data?.amounts) && data.amounts.length ? data.amounts.map(Number) : DEFAULT_AMOUNTS;

  el.toggle.setAttribute("aria-checked", enabled ? "true" : "false");
  el.percentage.value = String(percentage);
  renderTable(amounts, percentage);
}

el.toggle.addEventListener("click", () => {
  const on = el.toggle.getAttribute("aria-checked") !== "true";
  el.toggle.setAttribute("aria-checked", on ? "true" : "false");
  const pct = parseFloat(el.percentage.value) || 0;
  renderTable(DEFAULT_AMOUNTS, pct);
});

el.percentage.addEventListener("input", () => {
  const pct = parseFloat(el.percentage.value) || 0;
  renderTable(DEFAULT_AMOUNTS, pct);
});

el.saveBtn.addEventListener("click", async () => {
  el.saveBtn.disabled = true;
  setStatus("Saving…", null);
  try {
    const payload = readUiState();
    await set(configRef, payload);
    setStatus("Saved to Firebase.", "ok");
  } catch (e) {
    console.error(e);
    setStatus(e?.message || "Save failed. Check console & database rules.", "error");
  } finally {
    el.saveBtn.disabled = false;
  }
});

async function bootstrap() {
  setStatus("Loading…", null);
  try {
    const snap = await get(configRef);
    if (snap.exists()) {
      applyState(snap.val());
      setStatus("Loaded from Firebase.", "ok");
    } else {
      applyState({ enabled: false, percentage: 0, amounts: DEFAULT_AMOUNTS });
      setStatus("No config yet — adjust and save.", null);
    }
  } catch (e) {
    console.error(e);
    applyState({ enabled: false, percentage: 0, amounts: DEFAULT_AMOUNTS });
    setStatus(e?.message || "Could not read Firebase. Check rules & URL.", "error");
  }
}

bootstrap();
