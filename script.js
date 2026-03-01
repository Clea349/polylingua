// ===== ÉLÉMENTS DOM =====
const translateBtn = document.getElementById("translateBtn");
const swapBtn = document.getElementById("swapBtn");
const clearBtn = document.getElementById("clearBtn");
const copySourceBtn = document.getElementById("copySourceBtn");
const copyResultBtn = document.getElementById("copyResultBtn");
const speakBtn = document.getElementById("speakBtn");
const sourceText = document.getElementById("sourceText");
const resultText = document.getElementById("resultText");
const sourceLang = document.getElementById("sourceLang");
const targetLang = document.getElementById("targetLang");
const charCount = document.getElementById("charCount");
const detectedLang = document.getElementById("detectedLang");
const translateTime = document.getElementById("translateTime");
const errorMsg = document.getElementById("errorMsg");
const btnText = translateBtn.querySelector(".btn-text");
const btnIcon = translateBtn.querySelector(".btn-icon");
const btnLoader = translateBtn.querySelector(".btn-loader");

// ===== MAP CODE → NOM =====
const langNames = {
  auto: "Détection auto",
  fr: "Français", en: "Anglais", es: "Espagnol", de: "Allemand",
  it: "Italien", pt: "Portugais", ru: "Russe", zh: "Chinois",
  ja: "Japonais", ko: "Coréen", ar: "Arabe", nl: "Néerlandais",
  pl: "Polonais", sv: "Suédois", tr: "Turc", vi: "Vietnamien",
  th: "Thaï", hi: "Hindi", he: "Hébreu", uk: "Ukrainien",
  ro: "Roumain", cs: "Tchèque", hu: "Hongrois", id: "Indonésien",
  da: "Danois", fi: "Finnois", el: "Grec", no: "Norvégien",
  sk: "Slovaque", bg: "Bulgare", hr: "Croate", ms: "Malais",
  fa: "Persan", bn: "Bengali", ca: "Catalan"
};

// ===== API GOOGLE TRANSLATE (non-officielle, sans clé, CORS ok) =====
async function translateWithGoogle(text, from, to) {
  // sl=auto fonctionne nativement avec cette API
  const sl = (from === "auto") ? "auto" : from;
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${to}&dt=t&dt=ld&q=${encodeURIComponent(text)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  // data[0] = tableau de segments traduits [[traduit, original, ...], ...]
  const translated = data[0]
    .filter(seg => seg && seg[0])
    .map(seg => seg[0])
    .join("");

  // data[8][0][0] = langue détectée (quand sl=auto)
  let detected = null;
  if (from === "auto") {
    try {
      // Langue détectée disponible dans data[8][0][0] ou data[2]
      detected = data[2] || (data[8] && data[8][0] && data[8][0][0]);
    } catch (_) { }
  }

  return { translated, detected };
}

// ===== FALLBACK MyMemory (si Google échoue) =====
async function translateWithMyMemory(text, from, to) {
  const langPair = `${from}|${to}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data.responseData || data.responseStatus >= 400) {
    throw new Error(data.responseDetails || "Erreur API MyMemory");
  }
  return { translated: data.responseData.translatedText, detected: null };
}

// ===== COMPTEUR DE CARACTÈRES =====
sourceText.addEventListener("input", () => {
  const len = sourceText.value.length;
  charCount.textContent = `${len} / 5000`;
  charCount.style.color = len > 4500
    ? "var(--clr-error)"
    : len > 3500 ? "#f59e0b" : "var(--clr-muted)";
});

// ===== EFFACER =====
clearBtn.addEventListener("click", () => {
  sourceText.value = "";
  resultText.value = "";
  charCount.textContent = "0 / 5000";
  charCount.style.color = "";
  detectedLang.hidden = true;
  translateTime.hidden = true;
  errorMsg.hidden = true;
  sourceText.focus();
});

// ===== COPIER TEXTE SOURCE =====
copySourceBtn.addEventListener("click", () => {
  if (!sourceText.value) return;
  navigator.clipboard.writeText(sourceText.value)
    .then(() => showToast("Texte copié !", "success"));
});

// ===== COPIER RÉSULTAT =====
copyResultBtn.addEventListener("click", () => {
  if (!resultText.value) return;
  navigator.clipboard.writeText(resultText.value)
    .then(() => showToast("Traduction copiée !", "success"));
});

// ===== ÉCOUTER (TTS) =====
speakBtn.addEventListener("click", () => {
  if (!resultText.value) return;
  if (!("speechSynthesis" in window)) {
    showToast("Synthèse vocale non disponible", "error");
    return;
  }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(resultText.value);
  utter.lang = targetLang.value;
  window.speechSynthesis.speak(utter);
  showToast("Lecture en cours…", "success");
});

// ===== INVERSER LES LANGUES =====
swapBtn.addEventListener("click", () => {
  const fromVal = sourceLang.value;
  const toVal = targetLang.value;

  if (fromVal === "auto") {
    showToast("Sélectionne une langue source pour inverser", "error");
    return;
  }

  sourceLang.value = toVal;
  targetLang.value = fromVal;

  const tmpText = sourceText.value;
  sourceText.value = resultText.value;
  resultText.value = tmpText;

  sourceText.dispatchEvent(new Event("input"));
  detectedLang.hidden = true;
  errorMsg.hidden = true;
});

// ===== RACCOURCI CLAVIER (Ctrl+Entrée) =====
sourceText.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    translateBtn.click();
  }
});

// ===== TRADUCTION PRINCIPALE =====
translateBtn.addEventListener("click", async () => {
  const text = sourceText.value.trim();
  if (!text) {
    showError("✏️ Écris un texte à traduire !");
    sourceText.focus();
    return;
  }

  const fromCode = sourceLang.value;
  const toCode = targetLang.value;

  if (fromCode !== "auto" && fromCode === toCode) {
    showError("⚠️ La langue source et la langue cible sont identiques.");
    return;
  }

  setLoading(true);
  errorMsg.hidden = true;
  detectedLang.hidden = true;
  translateTime.hidden = true;

  const startTime = Date.now();

  try {
    let translated = "";
    let detected = null;

    try {
      // Essai avec Google Translate (supporte auto nativement)
      ({ translated, detected } = await translateWithGoogle(text, fromCode, toCode));
    } catch (googleErr) {
      console.warn("[PolyLingua] Google échoué, fallback MyMemory :", googleErr);
      // Si mode auto + fallback MyMemory → on utilise "fr" par défaut
      const fallbackFrom = fromCode === "auto" ? "fr" : fromCode;
      ({ translated } = await translateWithMyMemory(text, fallbackFrom, toCode));
    }

    resultText.value = translated;

    // Badge langue détectée
    if (detected && langNames[detected]) {
      detectedLang.textContent = `🔍 Langue détectée : ${langNames[detected]}`;
      detectedLang.hidden = false;
    } else if (detected) {
      detectedLang.textContent = `🔍 Langue détectée : ${detected.toUpperCase()}`;
      detectedLang.hidden = false;
    }

    // Chronomètre
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    translateTime.textContent = `⚡ ${elapsed}s`;
    translateTime.hidden = false;

  } catch (err) {
    console.error("[PolyLingua] Erreur :", err);
    showError(`❌ Erreur : ${err.message || "Connexion impossible. Vérifie ta connexion internet."}`);
  } finally {
    setLoading(false);
  }
});

// ===== HELPERS =====
function setLoading(isLoading) {
  translateBtn.disabled = isLoading;
  btnText.hidden = isLoading;
  btnIcon.hidden = isLoading;
  btnLoader.hidden = !isLoading;
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.hidden = false;
  errorMsg.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// Toast
let toastEl = null;
let toastTimer = null;

function showToast(message, type = "success") {
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.className = "toast";
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = message;
  toastEl.className = `toast ${type} show`;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2500);
}