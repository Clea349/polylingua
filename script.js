const translateBtn = document.getElementById("translateBtn");
const sourceText = document.getElementById("sourceText");
const resultText = document.getElementById("resultText");
const sourceLang = document.getElementById("sourceLang");
const targetLang = document.getElementById("targetLang");

// Fonction traduction via API LibreTranslate
translateBtn.addEventListener("click", async () => {
  const text = sourceText.value.trim();
  if (!text) return alert("Écris un texte à traduire !");

  const from = sourceLang.value;
  const to = targetLang.value;

  try {
    const res = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      body: JSON.stringify({
        q: text,
        source: from,
        target: to,
        format: "text"
      }),
      headers: { "Content-Type": "application/json" }
    });

    const data = await res.json();
    resultText.value = data.translatedText;
  } catch (err) {
    alert("Erreur de traduction : " + err);
  }
});