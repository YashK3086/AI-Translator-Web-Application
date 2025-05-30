// script.js
// This script handles the core logic of the AI Translator web application,
// including text translation via the MyMemory API and speech-to-text functionality.

// --- DOM Element References ---
const inputTextElem = document.getElementById("inputText");
const fromLangSelect = document.getElementById("fromLang");
const toLangSelect = document.getElementById("toLang");
const translateBtn = document.getElementById("translateBtn");
const translatedTextElem = document.getElementById("translatedText");
const speakBtn = document.getElementById("speakBtn");
const messageBox = document.getElementById("messageBox");
const messageText = document.getElementById("messageText");
const closeMessageBtn = document.getElementById("closeMessage");

// --- Custom Message Box Functions ---
// Function to display a custom message to the user instead of alert().
function showMessage(message, isError = false) {
  messageText.textContent = message;
  messageBox.style.backgroundColor = isError ? "#ff5555" : "#50fa7b"; // Red for error, green for success/info
  messageBox.style.borderColor = isError ? "#cc0000" : "#33cc5a";
  messageBox.classList.remove("hidden"); // Show the message box
}

// Function to hide the custom message box.
function hideMessage() {
  messageBox.classList.add("hidden"); // Hide the message box
}

// --- Language Dropdown Population ---
// Populates the 'From' and 'To' language dropdowns using the 'languages' object
// imported from language.js.
function populateLanguageDropdowns() {
  // Ensure the languages object is available globally from language.js
  if (typeof languages === "undefined") {
    console.error(
      "Error: 'languages' object not found. Make sure language.js is loaded correctly."
    );
    showMessage("Language data not loaded. Please check console.", true);
    return;
  }

  for (const code in languages) {
    if (languages.hasOwnProperty(code)) {
      const optionFrom = document.createElement("option");
      optionFrom.value = code;
      optionFrom.textContent = languages[code];
      fromLangSelect.appendChild(optionFrom);

      const optionTo = document.createElement("option");
      optionTo.value = code;
      optionTo.textContent = languages[code];
      toLangSelect.appendChild(optionTo);
    }
  }

  // Set default languages (e.g., English to Spanish)
  fromLangSelect.value = "en";
  toLangSelect.value = "es";
}

// --- Translation Function ---
// Asynchronously translates text using the MyMemory API.
async function translateText() {
  const text = inputTextElem.value.trim();
  const fromLang = fromLangSelect.value;
  const toLang = toLangSelect.value;

  // Validate input text
  if (!text) {
    showMessage("Please enter some text to translate.", true);
    return;
  }

  // MyMemory API URL construction.
  // The API endpoint is: https://api.mymemory.translated.net/get?q={text}&langpair={fromLang}|{toLang}
  // encodeURIComponent is used to properly format the text for the URL.
  const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    text
  )}&langpair=${fromLang}|${toLang}`;

  try {
    // Fetch translation from the API
    const response = await fetch(apiUrl);
    // Check if the response was successful (status code 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // Check for successful translation and display the result
    if (data && data.responseData && data.responseData.translatedText) {
      translatedTextElem.textContent = data.responseData.translatedText;
      showMessage("Translation successful!", false); // Green message for success
    } else if (data && data.responseStatus === 200 && data.responseDetails) {
      // Handle cases where API returns 200 but no translation, possibly with details
      translatedTextElem.textContent =
        "Translation failed: " + data.responseDetails;
      showMessage("Translation failed: " + data.responseDetails, true);
    } else {
      // Generic error if structure is unexpected
      translatedTextElem.textContent =
        "Translation failed: Unexpected API response.";
      showMessage("Translation failed: Unexpected API response.", true);
    }
  } catch (error) {
    // Catch and display any network or parsing errors
    console.error("Translation error:", error);
    translatedTextElem.textContent =
      "Error translating text. Please try again.";
    showMessage(
      `Error: ${error.message}. Please check your internet connection or try again later.`,
      true
    );
  }
}

// --- Speech-to-Text Functionality ---
// Initializes and handles the Web Speech API for speech recognition.
function initializeSpeechRecognition() {
  // Check if Web Speech API is supported by the browser
  if (!("webkitSpeechRecognition" in window)) {
    speakBtn.disabled = true;
    speakBtn.textContent = "Speech not supported";
    showMessage(
      "Your browser does not support Web Speech API for input.",
      true
    );
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.continuous = false; // Set to false for single utterance recognition
  recognition.interimResults = false; // Only return final results

  // Event handler for when speech recognition results are available
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    inputTextElem.value = transcript; // Set the recognized text to the input field
    showMessage("Speech recognized! Now you can translate.", false);
  };

  // Event handler for errors during speech recognition
  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    let errorMessage = "Speech recognition error.";
    if (event.error === "not-allowed") {
      errorMessage =
        "Microphone access denied. Please allow microphone access in your browser settings.";
    } else if (event.error === "no-speech") {
      errorMessage =
        "No speech detected. Please try speaking louder or clearer.";
    } else if (event.error === "network") {
      errorMessage = "Network error during speech recognition.";
    }
    showMessage(errorMessage, true);
  };

  // Event handler for when speech recognition ends
  recognition.onend = () => {
    speakBtn.classList.remove("speaking"); // Remove speaking indicator
    speakBtn.innerHTML = '<i class="fas fa-microphone"></i> Speak'; // Reset button text
  };

  // Event listener for the Speak button
  speakBtn.addEventListener("click", () => {
    // Set the recognition language based on the 'From' language selected
    // Note: The Web Speech API might not support all languages in `language.js`.
    // You might need to map them to browser-supported locales.
    const selectedFromLang = fromLangSelect.value;
    // Example mapping for common languages, you might need to expand this
    const langMap = {
      en: "en-US",
      es: "es-ES",
      fr: "fr-FR",
      de: "de-DE",
      it: "it-IT",
      hi: "hi-IN",
      zh: "zh-CN",
      ja: "ja-JP",
      ko: "ko-KR",
      ar: "ar-SA",
      // Add more mappings as needed for browser compatibility
    };
    recognition.lang = langMap[selectedFromLang] || selectedFromLang; // Use mapped locale or direct code

    try {
      recognition.start(); // Start listening
      speakBtn.classList.add("speaking"); // Add speaking indicator
      speakBtn.innerHTML =
        '<i class="fas fa-microphone-alt-slash"></i> Listening...'; // Change button text
      showMessage("Listening for your speech...", false);
    } catch (e) {
      // Catch error if recognition is already in progress
      if (e.name === "InvalidStateError") {
        showMessage("Speech recognition is already active.", false);
      } else {
        console.error("Error starting speech recognition:", e);
        showMessage("Could not start speech recognition. " + e.message, true);
      }
    }
  });
}

// --- Event Listeners ---
// Event listener for the Translate button click.
translateBtn.addEventListener("click", translateText);

// Event listener for the custom message box close button.
closeMessageBtn.addEventListener("click", hideMessage);

// --- Initial Setup on Page Load ---
// This ensures that the language dropdowns are populated and speech recognition
// is initialized as soon as the page content is loaded.
document.addEventListener("DOMContentLoaded", () => {
  populateLanguageDropdowns();
  initializeSpeechRecognition();
});
