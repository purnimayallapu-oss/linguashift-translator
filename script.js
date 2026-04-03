// ===== Element References =====
const sourceLang = document.getElementById('sourceLang');
const targetLang = document.getElementById('targetLang');
const sourceText = document.getElementById('sourceText');
const outputText = document.getElementById('outputText');
const translateBtn = document.getElementById('translateBtn');
const swapBtn = document.getElementById('swapBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const charCount = document.getElementById('charCount');
const detectedLang = document.getElementById('detectedLang');
const errorBar = document.getElementById('errorBar');

// ===== Language name map =====
const LANG_NAMES = {
  auto: 'Auto Detect',
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
  hi: 'Hindi',
  te: 'Telugu',
  tr: 'Turkish',
  nl: 'Dutch',
  pl: 'Polish',
  sv: 'Swedish',
  da: 'Danish',
  fi: 'Finnish',
  no: 'Norwegian',
  uk: 'Ukrainian',
  vi: 'Vietnamese',
  th: 'Thai',
  id: 'Indonesian',
  ms: 'Malay'
};

// ===== Character Counter =====
sourceText.addEventListener('input', () => {
  const len = sourceText.value.length;
  charCount.textContent = `${len} / 500`;
  charCount.classList.toggle('warn', len >= 450);
  clearError();
});

// ===== Show Error =====
function showError(message) {
  errorBar.textContent = message;
  errorBar.classList.add('visible');
}

// ===== Clear Error =====
function clearError() {
  errorBar.textContent = '';
  errorBar.classList.remove('visible');
}

// ===== Loading State =====
function setLoading(isLoading) {
  translateBtn.disabled = isLoading;
  translateBtn.classList.toggle('loading', isLoading);
}

// ===== Translate Function =====
async function translate() {
  const text = sourceText.value.trim();
  const src = sourceLang.value;
  const tgt = targetLang.value;

  if (!text) {
    showError('Please enter some text to translate.');
    return;
  }

  if (src !== 'auto' && src === tgt) {
    showError('Source and target languages cannot be the same.');
    return;
  }

  clearError();
  setLoading(true);
  outputText.value = '';
  detectedLang.textContent = '';

  const langpair = `${src === 'auto' ? 'autodetect' : src}|${tgt}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langpair)}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Unable to connect to translation service.');
    }

    const data = await response.json();

    if (data.responseStatus !== 200) {
      throw new Error(data.responseDetails || 'Translation failed. Please try again.');
    }

    const translatedText = data.responseData.translatedText;

    if (!translatedText) {
      throw new Error('No translation received.');
    }

    outputText.value = translatedText;

    // Detect language if auto selected
    if (src === 'auto') {
      if (data.responseData.detectedLanguage) {
        const detectedCode = data.responseData.detectedLanguage.toLowerCase();
        detectedLang.textContent = `Detected: ${LANG_NAMES[detectedCode] || detectedCode.toUpperCase()}`;
      } else if (data.matches && data.matches.length > 0 && data.matches[0].segment) {
        detectedLang.textContent = `Detected: Auto`;
      }
    }

  } catch (error) {
    if (error.message.includes('Failed to fetch')) {
      showError('Failed to fetch translation. Please check your internet or try again later.');
    } else {
      showError(error.message);
    }
  } finally {
    setLoading(false);
  }
}

// ===== Translate Button =====
translateBtn.addEventListener('click', translate);

// ===== Keyboard Shortcut (Ctrl + Enter) =====
sourceText.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    translate();
  }
});

// ===== Swap Languages =====
swapBtn.addEventListener('click', () => {
  const srcVal = sourceLang.value;
  const tgtVal = targetLang.value;

  if (srcVal === 'auto') {
    sourceLang.value = tgtVal;
    targetLang.value = 'en';
  } else {
    sourceLang.value = tgtVal;
    targetLang.value = srcVal;
  }

  // Swap text content too
  const sourceValue = sourceText.value;
  const outputValue = outputText.value;

  sourceText.value = outputValue;
  outputText.value = sourceValue;

  // Update counter
  const len = sourceText.value.length;
  charCount.textContent = `${len} / 500`;
  charCount.classList.toggle('warn', len >= 450);

  detectedLang.textContent = '';
  clearError();
});

// ===== Clear Button =====
clearBtn.addEventListener('click', () => {
  sourceText.value = '';
  outputText.value = '';
  detectedLang.textContent = '';
  charCount.textContent = '0 / 500';
  charCount.classList.remove('warn');
  clearError();
  sourceText.focus();
});

// ===== Copy Button =====
copyBtn.addEventListener('click', async () => {
  const text = outputText.value.trim();

  if (!text) {
    showError('Nothing to copy. Translate something first.');
    return;
  }

  try {
    await navigator.clipboard.writeText(text);

    const originalHTML = copyBtn.innerHTML;
    copyBtn.classList.add('success');
    copyBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      Copied!
    `;

    setTimeout(() => {
      copyBtn.innerHTML = originalHTML;
      copyBtn.classList.remove('success');
    }, 2000);

  } catch (error) {
    showError('Copy failed. Please copy manually.');
  }
});