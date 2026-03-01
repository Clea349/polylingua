const translateBtn = document.getElementById("translateBtn");
const sourceText = document.getElementById("sourceText");
const resultText = document.getElementById("resultText");
const sourceLang = document.getElementById("sourceLang");
const targetLang = document.getElementById("targetLang");

// Fonction traduction via API MyMemory (Version Simple)
translateBtn.addEventListener("click", async () => {
  const text = sourceText.value.trim();
  if (!text) return alert("Écris un texte à traduire !");

  const from = sourceLang.value;
  const to = targetLang.value;

  try {
    // Utilisation de l'API MyMemory (Gratuite, pas de clé requise, pas de CORS)
    const langPair = `${from}|${to}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.responseData) {
      resultText.value = data.responseData.translatedText;
    } else {
      alert("Erreur de traduction via l'API MyMemory.");
    }
  } catch (err) {
    console.error(err);
    alert("Erreur réseau ou API : " + err);
  }
});