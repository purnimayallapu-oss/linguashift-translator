// ===== Element References =====
const sourceLang = document.getElementById("sourceLang");
const targetLang = document.getElementById("targetLang");
const sourceText = document.getElementById("sourceText");
const outputText = document.getElementById("outputText");
const translateBtn = document.getElementById("translateBtn");
const swapBtn = document.getElementById("swapBtn");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");
const ttsBtn = document.getElementById("ttsBtn");
const charCount = document.getElementById("charCount");
const detectedLang = document.getElementById("detectedLang");
const errorBar = document.getElementById("errorBar");

// ===== Language Name Map =====
const LANG_NAMES = {
  auto: "Auto Detect",
  en: "English",
  te: "Telugu",
  hi: "Hindi",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  ar: "Arabic",
  tr: "Turkish",
  nl: "Dutch",
  pl: "Polish",
  sv: "Swedish",
  da: "Danish",
  fi: "Finnish",
  no: "Norwegian",
  uk: "Ukrainian",
  vi: "Vietnamese",
  th: "Thai",
  id: "Indonesian",
  ms: "Malay"
};

// ===== Character Counter =====
sourceText.addEventListener("input", () => {
  const len = sourceText.value.length;
  charCount.textContent = `${len} / 500`;
  charCount.classList.toggle("warn", len >= 450);
  clearError();
});

// ===== Error Handling =====
function showError(msg) {
  errorBar.textContent = msg;
  errorBar.classList.add("visible");
}

function clearError() {
  errorBar.classList.remove("visible");
  errorBar.textContent = "";
}

// ===== Loading State =====
function setLoading(loading) {
  translateBtn.disabled = loading;
  translateBtn.classList.toggle("loading", loading);
}

// ===== Translate =====
async function translate() {
  const text = sourceText.value.trim();

  if (!text) {
    showError("Please enter some text to translate.");
    return;
  }

  const src = sourceLang.value;
  const tgt = targetLang.value;

  if (src !== "auto" && src === tgt) {
    showError("Source and target languages are the same.");
    return;
  }

  clearError();
  setLoading(true);
  outputText.value = "";
  detectedLang.textContent = "";

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${src === "auto" ? "auto" : src}&tl=${tgt}&dt=t&q=${encodeURIComponent(text)}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();

    let translatedText = "";
    if (Array.isArray(data[0])) {
      translatedText = data[0].map(item => item[0]).join("");
    }

    outputText.value = translatedText || "Translation not available.";

    if (src === "auto" && data[2]) {
      const detectedCode = data[2];
      detectedLang.textContent = `Detected: ${LANG_NAMES[detectedCode] || detectedCode.toUpperCase()}`;
    }

  } catch (error) {
    console.error("Translation Error:", error);
    showError("Translation failed. Try running with Live Server or another browser.");
  } finally {
    setLoading(false);
  }
}

// ===== Swap Languages =====
swapBtn.addEventListener("click", () => {
  const srcVal = sourceLang.value;
  const tgtVal = targetLang.value;

  if (srcVal === "auto") {
    sourceLang.value = tgtVal;
    targetLang.value = "en";
  } else {
    sourceLang.value = tgtVal;
    targetLang.value = srcVal;
  }

  const tempSource = sourceText.value;
  const tempOutput = outputText.value;

  sourceText.value = tempOutput;
  outputText.value = tempSource;

  charCount.textContent = `${sourceText.value.length} / 500`;
  charCount.classList.toggle("warn", sourceText.value.length >= 450);

  detectedLang.textContent = "";
  clearError();
});

// ===== Clear =====
clearBtn.addEventListener("click", () => {
  sourceText.value = "";
  outputText.value = "";
  charCount.textContent = "0 / 500";
  charCount.classList.remove("warn");
  detectedLang.textContent = "";
  clearError();
  sourceText.focus();
});

// ===== Copy =====
copyBtn.addEventListener("click", async () => {
  const text = outputText.value;
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    const originalHTML = copyBtn.innerHTML;
    copyBtn.innerHTML = "Copied!";
    copyBtn.classList.add("success");

    setTimeout(() => {
      copyBtn.innerHTML = originalHTML;
      copyBtn.classList.remove("success");
    }, 2000);
  } catch (err) {
    showError("Copy failed.");
  }
});

// ===== Text To Speech =====
ttsBtn.addEventListener("click", () => {
  const text = outputText.value;

  if (!text) {
    showError("Nothing to speak. Translate something first.");
    return;
  }

  if (!("speechSynthesis" in window)) {
    showError("Text-to-speech is not supported in this browser.");
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  const langMap = {
    en: "en-US",
    te: "te-IN",
    hi: "hi-IN",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
    it: "it-IT",
    pt: "pt-PT",
    ru: "ru-RU",
    zh: "zh-CN",
    ja: "ja-JP",
    ko: "ko-KR",
    ar: "ar-SA",
    tr: "tr-TR",
    nl: "nl-NL",
    pl: "pl-PL",
    sv: "sv-SE",
    da: "da-DK",
    fi: "fi-FI",
    no: "no-NO",
    uk: "uk-UA",
    vi: "vi-VN",
    th: "th-TH",
    id: "id-ID",
    ms: "ms-MY"
  };

  utterance.lang = langMap[targetLang.value] || "en-US";
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  const originalHTML = ttsBtn.innerHTML;
  ttsBtn.innerHTML = "Speaking...";
  ttsBtn.classList.add("success");

  utterance.onend = () => {
    ttsBtn.innerHTML = originalHTML;
    ttsBtn.classList.remove("success");
  };

  utterance.onerror = () => {
    ttsBtn.innerHTML = originalHTML;
    ttsBtn.classList.remove("success");
    showError("Speech failed for this language.");
  };

  speechSynthesis.speak(utterance);
});

// ===== Button Events =====
translateBtn.addEventListener("click", translate);

// ===== Ctrl + Enter =====
sourceText.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    translate();
  }
});