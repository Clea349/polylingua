const translateBtn = document.getElementById("translateBtn");
const sourceText = document.getElementById("sourceText");
const resultText = document.getElementById("resultText");
const sourceLang = document.getElementById("sourceLang");
const targetLang = document.getElementById("targetLang");

// 🔹 Remplace par ton URL Vercel (api/translate)
const backendURL = "https://polylingua-backend.vercel.app/api/translate";

// Charger toutes les langues depuis le backend
async function loadLanguages() {
  try {
    const res = await fetch(backendURL, { method: "GET" });
    const data = await res.json();
    data.forEach(lang => {
      const option1 = document.createElement("option");
      option1.value = lang.code;
      option1.textContent = lang.name;
      sourceLang.appendChild(option1);

      const option2 = document.createElement("option");
      option2.value = lang.code;
      option2.textContent = lang.name;
      targetLang.appendChild(option2);
    });

    sourceLang.value = "auto";
    targetLang.value = "en";
  } catch (err) {
    alert("Erreur chargement langues : " + err);
  }
}

loadLanguages();

// Traduire le texte
translateBtn.addEventListener("click", async () => {
  const text = sourceText.value.trim();
  if (!text) return alert("Écris un texte à traduire !");

  const from = sourceLang.value;
  const to = targetLang.value;

  try {
    const res = await fetch(backendURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, from, to })
    });
    const data = await res.json();
    resultText.value = data.translatedText;
  } catch (err) {
    alert("Erreur de traduction : " + err);
  }
});