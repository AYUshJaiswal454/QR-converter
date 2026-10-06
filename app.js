/**
 * Link2QR — app.js
 * Client-side QR code generation from a user-supplied URL.
 *
 * Responsibilities:
 *  - URL validation
 *  - QR generation (via qrcode.js)
 *  - PNG download
 *  - Clipboard copy
 *  - Web Share API
 *  - "Generate Another" / state reset
 *  - Accessible error / success feedback
 */

'use strict';

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════ */

/** QR canvas render size in pixels (internal, before CSS scaling) */
const QR_SIZE = 440;

/** Allowed URL schemes */
const ALLOWED_SCHEMES = ['http:', 'https:'];

/** Filename for downloaded PNG */
const DOWNLOAD_FILENAME = 'link2qr.png';

/* ═══════════════════════════════════════════════════════════
   DOM REFERENCES
   ═══════════════════════════════════════════════════════════ */

const urlInput        = document.getElementById('url-input');
const urlError        = document.getElementById('url-error');
const inputWrapper    = document.getElementById('input-wrapper');
const clearBtn        = document.getElementById('clear-btn');
const generateBtn     = document.getElementById('generate-btn');
const btnText         = generateBtn.querySelector('.btn-text');
const btnLoader       = generateBtn.querySelector('.btn-loader');
const btnIcon         = generateBtn.querySelector('.btn-icon');

const generatorCard   = document.getElementById('generator-card');
const resultCard      = document.getElementById('result-card');
const qrContainer     = document.getElementById('qr-canvas-container');
const resultUrl       = document.getElementById('result-url');
const downloadBtn     = document.getElementById('download-btn');
const copyBtn         = document.getElementById('copy-btn');
const copyText        = copyBtn.querySelector('.copy-text');
const copyIcon        = copyBtn.querySelector('.copy-icon');
const checkIcon       = copyBtn.querySelector('.check-icon');
const shareBtn        = document.getElementById('share-btn');
const anotherBtn      = document.getElementById('another-btn');

/* ═══════════════════════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════════════════════ */

let currentUrl        = '';   // the validated URL currently shown in the result
let qrInstance        = null; // reference to the QRCode instance
let copyTimer         = null; // for resetting the copy button
let isGenerating      = false;

/* ═══════════════════════════════════════════════════════════
   URL VALIDATION
   ═══════════════════════════════════════════════════════════ */

/**
 * Validates a URL string.
 * Returns { valid: true, url: URL } or { valid: false, message: string }.
 *
 * Uses the URL constructor (proper parsing, not regex) and enforces
 * only http: and https: protocols to prevent XSS/injection via
 * javascript:, data:, file:, vbscript:, etc.
 */
function validateUrl(raw) {
  const trimmed = raw.trim();

  if (!trimmed) {
    return { valid: false, message: 'Please enter a link.' };
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      valid: false,
      message: 'Please enter a valid URL starting with http:// or https://',
    };
  }

  if (!ALLOWED_SCHEMES.includes(parsed.protocol)) {
    return {
      valid: false,
      message: 'Only HTTP and HTTPS links are supported.',
    };
  }

  // Hostname must exist and not be blank
  if (!parsed.hostname) {
    return {
      valid: false,
      message: 'Please enter a valid URL starting with http:// or https://',
    };
  }

  return { valid: true, url: parsed };
}

/* ═══════════════════════════════════════════════════════════
   QR GENERATION
   ═══════════════════════════════════════════════════════════ */

/**
 * Generates a QR code inside the container element.
 * Returns the QRCode instance or throws on failure.
 *
 * Uses qrcode.js (davidshimjs) with:
 *  - Error correction level H (highest resilience)
 *  - Large internal render size for crisp downloads
 *  - Black on white for maximum scanning contrast
 */
function generateQR(text, container) {
  // Wipe previous QR to avoid double-rendering
  container.innerHTML = '';

  // qrcode.js renders a <canvas> (or <img> fallback)
  const qr = new QRCode(container, {
    text:            text,
    width:           QR_SIZE,
    height:          QR_SIZE,
    colorDark:       '#000000',
    colorLight:      '#ffffff',
    correctLevel:    QRCode.CorrectLevel.H,
  });

  return qr;
}

/* ═══════════════════════════════════════════════════════════
   PNG DOWNLOAD
   ═══════════════════════════════════════════════════════════ */

/**
 * Extracts the data URL from the rendered QR canvas or img element,
 * then triggers a browser download.
 *
 * The QR itself (not a screenshot) is downloaded, at full QR_SIZE resolution.
 */
function downloadQR() {
  // qrcode.js renders a canvas; fall back to <img> for IE-compat environments
  const canvas = qrContainer.querySelector('canvas');
  const img    = qrContainer.querySelector('img');

  let dataUrl;

  if (canvas) {
    dataUrl = canvas.toDataURL('image/png');
  } else if (img) {
    // Re-draw img src onto a canvas to get a PNG data URL
    const offscreen = document.createElement('canvas');
    offscreen.width  = QR_SIZE;
    offscreen.height = QR_SIZE;
    const ctx = offscreen.getContext('2d');
    ctx.drawImage(img, 0, 0, QR_SIZE, QR_SIZE);
    dataUrl = offscreen.toDataURL('image/png');
  } else {
    showGeneralError('We couldn\'t find the QR image. Please generate again.');
    return;
  }

  const link = document.createElement('a');
  link.download = DOWNLOAD_FILENAME;
  link.href = dataUrl;
  link.click();
}

/* ═══════════════════════════════════════════════════════════
   CLIPBOARD COPY
   ═══════════════════════════════════════════════════════════ */

/**
 * Copies the current URL to the clipboard.
 * Shows a temporary success state, then resets after 2 s.
 * If the Clipboard API is unavailable, falls back to execCommand.
 */
async function copyLink() {
  const url = currentUrl;
  if (!url) return;

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url);
    } else {
      // Fallback for older browsers / non-secure contexts
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.setAttribute('readonly', '');
      textarea.style.cssText = 'position:absolute;left:-9999px;';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (!ok) throw new Error('execCommand failed');
    }
    showCopySuccess();
  } catch {
    // Graceful degradation — never silently fail
    alert(`Copy this link manually:\n\n${url}`);
  }
}

function showCopySuccess() {
  copyBtn.classList.add('copied');
  copyIcon.hidden = true;
  checkIcon.hidden = false;
  copyText.textContent = 'Copied!';
  copyBtn.setAttribute('aria-label', 'Link copied to clipboard');

  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => {
    copyBtn.classList.remove('copied');
    copyIcon.hidden = false;
    checkIcon.hidden = true;
    copyText.textContent = 'Copy Link';
    copyBtn.setAttribute('aria-label', 'Copy URL to clipboard');
  }, 2000);
}

/* ═══════════════════════════════════════════════════════════
   WEB SHARE
   ═══════════════════════════════════════════════════════════ */

/**
 * Uses the Web Share API if supported; otherwise the button is hidden.
 */
async function shareLink() {
  if (!navigator.share) return;

  try {
    await navigator.share({
      title: 'Link2QR',
      url:   currentUrl,
    });
  } catch (err) {
    // User cancelled or share failed — no UI error needed
    if (err.name !== 'AbortError') {
      console.warn('Share failed:', err);
    }
  }
}

/* ═══════════════════════════════════════════════════════════
   ERROR / SUCCESS UI HELPERS
   ═══════════════════════════════════════════════════════════ */

function showInputError(message) {
  urlError.textContent = message;
  urlError.hidden = false;
  inputWrapper.classList.add('has-error');
  urlInput.setAttribute('aria-invalid', 'true');
}

function clearInputError() {
  urlError.hidden = true;
  urlError.textContent = '';
  inputWrapper.classList.remove('has-error');
  urlInput.setAttribute('aria-invalid', 'false');
}

function showGeneralError(message) {
  // Re-use the input error area for general generation errors
  showInputError(message);
}

/* ═══════════════════════════════════════════════════════════
   LOADING STATE
   ═══════════════════════════════════════════════════════════ */

function setLoading(loading) {
  isGenerating = loading;
  generateBtn.disabled = loading;

  if (loading) {
    btnText.hidden = true;
    btnIcon.hidden = true;
    btnLoader.hidden = false;
    generateBtn.setAttribute('aria-label', 'Generating QR code…');
  } else {
    btnText.hidden = false;
    btnIcon.hidden = false;
    btnLoader.hidden = true;
    generateBtn.setAttribute('aria-label', 'Generate QR');
  }
}

/* ═══════════════════════════════════════════════════════════
   SHOW / HIDE CARDS
   ═══════════════════════════════════════════════════════════ */

function showResult(validUrl) {
  currentUrl = validUrl;

  // Populate the displayed URL (text only — never innerHTML)
  resultUrl.textContent = validUrl;
  resultUrl.setAttribute('title', validUrl);

  // Show/hide share button based on API availability
  shareBtn.hidden = !navigator.share;

  // Show result, hide generator
  generatorCard.hidden = true;
  resultCard.hidden = false;

  // Scroll result into comfortable view
  resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function resetToGenerator() {
  // Reset result state
  qrContainer.innerHTML = '';
  resultUrl.textContent = '';
  resultCard.hidden = true;

  // Reset copy button if it was in success state
  clearTimeout(copyTimer);
  copyBtn.classList.remove('copied');
  copyIcon.hidden = false;
  checkIcon.hidden = true;
  copyText.textContent = 'Copy Link';
  copyBtn.setAttribute('aria-label', 'Copy URL to clipboard');

  currentUrl = '';
  qrInstance = null;

  // Show generator card again
  generatorCard.hidden = false;

  // Focus input
  urlInput.focus();

  // Scroll to top of page
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ═══════════════════════════════════════════════════════════
   CORE GENERATE FLOW
   ═══════════════════════════════════════════════════════════ */

function handleGenerate() {
  if (isGenerating) return;

  const raw = urlInput.value;
  const result = validateUrl(raw);

  if (!result.valid) {
    showInputError(result.message);
    urlInput.focus();
    return;
  }

  clearInputError();

  // The exact validated URL string (preserves query params, fragments, etc.)
  const exactUrl = result.url.href;

  setLoading(true);

  // Use requestAnimationFrame to allow the loading UI to paint before
  // the synchronous QR generation blocks the thread.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      try {
        qrInstance = generateQR(exactUrl, qrContainer);
        setLoading(false);
        showResult(exactUrl);
      } catch (err) {
        setLoading(false);
        showGeneralError("We couldn't generate the QR code. Please try again.");
        console.error('QR generation error:', err);
      }
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   EVENT LISTENERS
   ═══════════════════════════════════════════════════════════ */

// Generate on button click
generateBtn.addEventListener('click', handleGenerate);

// Generate on Enter key
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    handleGenerate();
  }
});

// Show/hide clear button as user types; clear error on input
urlInput.addEventListener('input', () => {
  const hasValue = urlInput.value.length > 0;
  clearBtn.hidden = !hasValue;

  // Clear error state as soon as user starts correcting
  if (inputWrapper.classList.contains('has-error')) {
    clearInputError();
  }
});

// Clear button resets the input
clearBtn.addEventListener('click', () => {
  urlInput.value = '';
  clearBtn.hidden = true;
  clearInputError();
  urlInput.focus();
});

// Download QR as PNG
downloadBtn.addEventListener('click', downloadQR);

// Copy link to clipboard
copyBtn.addEventListener('click', copyLink);

// Share link (Web Share API)
shareBtn.addEventListener('click', shareLink);

// Generate Another — reset to generator view
anotherBtn.addEventListener('click', resetToGenerator);

/* ═══════════════════════════════════════════════════════════
   INITIALISATION
   ═══════════════════════════════════════════════════════════ */

(function init() {
  // Ensure the result card is hidden on load (in case of browser cache)
  resultCard.hidden = true;
  generatorCard.hidden = false;
  clearBtn.hidden = true;

  // Focus the URL input on load for immediate keyboard access
  // Defer slightly so page layout is settled
  setTimeout(() => urlInput.focus(), 100);
})();
