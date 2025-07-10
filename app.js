// --- Global Variables (Local Storage and App Data) ---
let rvs = []; // Array to hold all RV objects
let settings = {}; // Object to hold user settings

// DOM Elements
const appContent = document.getElementById("appContent");
const settingsView = document.getElementById("settingsView");
const myRVsView = document.getElementById("myRVsView");
const mapView = document.getElementById("mapView");
const rvFormView = document.getElementById("rvFormView");

const settingsBtn = document.getElementById("settingsBtn");
const myRVsLink = document.getElementById("myRVsLink");
const mapLink = document.getElementById("mapLink");
const addRVBtn = document.getElementById("addRVBtn");
const loadingSpinner = document.getElementById("loadingSpinner");

// Settings View Elements
const defaultCityInput = document.getElementById("defaultCity");
const defaultStateInput = document.getElementById("defaultState");
const defaultLatitudeInput = document.getElementById("defaultLatitude");
const defaultLongitudeInput = document.getElementById("defaultLongitude");
const useCurrentLocationBtn = document.getElementById("useCurrentLocationBtn");
const exportDataBtn = document.getElementById("exportDataBtn");
const importDataBtn = document.getElementById("importDataBtn");
const googleMapsApiKeyInput = document.getElementById("googleMapsApiKey");

// RV Form View Elements
const rvNameInput = document.getElementById("rvName");
const rvAddressInput = document.getElementById("rvAddress");
const rvCityInput = document.getElementById("rvCity");
const rvStateInput = document.getElementById("rvState");
const rvEmailInput = document.getElementById("rvEmail");
const rvLatitudeInput = document.getElementById("rvLatitude");
const rvLongitudeInput = document.getElementById("rvLongitude");
const rvUseCurrentLocationBtn = document.getElementById(
  "rvUseCurrentLocationBtn"
);
const rvLastContactedDateInput = document.getElementById("rvLastContactedDate");
const rvLastContactedDayInput = document.getElementById("rvLastContactedDay");
const rvLastContactedTimeInput = document.getElementById("rvLastContactedTime");
const addVisitBtnForm = document.querySelector("#rvFormView .add-visit-btn");
const removeVisitBtnForm = document.querySelector(
  "#rvFormView .remove-visit-btn"
);
const rvNoteInput = document.getElementById("rvNote");
const rvPhoneInput = document.getElementById("rvPhone"); // Added phone input reference

const rvListContainer = document.querySelector(".rv-list");
const sortOldNewRadio = document.getElementById("sortOldNew");
const sortNewOldRadio = document.getElementById("sortNewOld");
const filterAllAreasCheckbox = document.getElementById("filterAllAreas");
const filterNoAreaCheckbox = document.getElementById("filterNoArea");
const areaFilterCheckboxesDiv = document.getElementById("areaFilterCheckboxes");
const mapAreaFilterCheckboxesDiv = document.getElementById(
  "mapAreaFilterCheckboxes"
);

// Previous/Next RV Navigation Elements
const prevRvBtn = document.getElementById("prevRvBtn");
const nextRvBtn = document.getElementById("nextRvBtn");

let currentRVId = null; // To store the ID of the RV being edited
let currentRvIndex = -1; // To store the index of the RV being edited in the filtered list
let mapInitialized = false; // Flag to prevent multiple map initializations

// --- Utility Functions ---

/**
 * Displays a custom message box instead of alert().
 * @param {string} message - The message to display.
 * @param {string} type - 'success', 'error', 'info', or 'warning'.
 */
function showMessage(message, type = "info") {
  const messageBox = document.createElement("div");
  messageBox.className = `message-box ${type}`;
  messageBox.textContent = message;

  // Ensure the message box is appended to the body and styled correctly
  messageBox.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 15px 25px;
      border-radius: 8px;
      color: white;
      font-weight: bold;
      z-index: 1000;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      opacity: 0;
      transition: opacity 0.3s ease-in-out;
      text-align: center;
      min-width: 200px;
  `;

  // Apply background color based on type (CSS classes are preferred, but inline for robustness)
  switch (type) {
    case "success":
      messageBox.style.backgroundColor = "#4CAF50";
      break;
    case "error":
      messageBox.style.backgroundColor = "#f44336";
      break;
    case "warning":
      messageBox.style.backgroundColor = "#FFC107";
      messageBox.style.color = "#333";
      break;
    case "info":
    default:
      messageBox.style.backgroundColor = "#2196F3";
      break;
  }

  document.body.appendChild(messageBox);

  // Fade in
  setTimeout(() => {
    messageBox.style.opacity = 1;
  }, 10);

  // Fade out and remove after a few seconds
  setTimeout(() => {
    messageBox.style.opacity = 0;
    messageBox.addEventListener("transitionend", () => messageBox.remove());
  }, 3000);
}

/**
 * Displays a custom confirmation dialog.
 * @param {string} message - The message to display.
 * @param {function} onConfirm - Callback function if user confirms.
 * @param {function} onCancel - Callback function if user cancels (optional).
 */
function showConfirmationDialog(message, onConfirm, onCancel = () => {}) {
  const modalOverlay = document.createElement("div");
  modalOverlay.className = "modal-overlay";
  modalOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1001;
      opacity: 0;
      transition: opacity 0.3s ease;
  `;

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";
  modalContent.style.cssText = `
      background-color: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
      text-align: center;
      max-width: 400px;
      width: 90%;
      transform: translateY(-20px);
      transition: transform 0.3s ease;
  `;

  const messageParagraph = document.createElement("p");
  messageParagraph.textContent = message;
  messageParagraph.style.cssText = `
      font-size: 1.1em;
      margin-bottom: 25px;
      color: #333;
  `;

  const buttonContainer = document.createElement("div");
  buttonContainer.style.cssText = `
      display: flex;
      justify-content: center;
      gap: 15px;
  `;

  const confirmButton = document.createElement("button");
  confirmButton.textContent = "Proceed"; // Changed text to "Proceed"
  confirmButton.className = "utility-btn primary-btn";
  confirmButton.style.cssText = `
      background-color: #4CAF50;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 1em;
      transition: background-color 0.2s;
  `;
  confirmButton.onmouseover = () =>
    (confirmButton.style.backgroundColor = "#45a049");
  confirmButton.onmouseout = () =>
    (confirmButton.style.backgroundColor = "#4CAF50");

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Go Back"; // Changed text to "Go Back"
  cancelButton.className = "utility-btn cancel-btn";
  cancelButton.style.cssText = `
      background-color: #f44336;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 1em;
      transition: background-color 0.2s;
  `;
  cancelButton.onmouseover = () =>
    (cancelButton.style.backgroundColor = "#d32f2f");
  cancelButton.onmouseout = () =>
    (cancelButton.style.backgroundColor = "#f44336");

  confirmButton.onclick = () => {
    modalOverlay.style.opacity = 0;
    modalOverlay.addEventListener("transitionend", () => modalOverlay.remove());
    onConfirm();
  };

  cancelButton.onclick = () => {
    modalOverlay.style.opacity = 0;
    modalOverlay.addEventListener("transitionend", () => modalOverlay.remove());
    onCancel();
  };

  buttonContainer.appendChild(cancelButton);
  buttonContainer.appendChild(confirmButton);
  modalContent.appendChild(messageParagraph);
  modalContent.appendChild(buttonContainer);
  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);

  // Animate in
  setTimeout(() => {
    modalOverlay.style.opacity = 1;
    modalContent.style.transform = "translateY(0)";
  }, 10);
}

/**
 * Generates a unique ID for new RVs.
 * @returns {string} - A unique ID.
 */
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Formats a date string to a more readable day format (e.g., "Mon", "Tue").
 * @param {string} dateString - The date string (e.g., "YYYY-MM-DD").
 * @returns {string} - Formatted day string.
 */
function getFormattedDay(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return ""; // Invalid date
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

/**
 * Formats a phone number string to (XXX) XXX-XXXX.
 * @param {string} phoneNumberString - The raw phone number string.
 * @returns {string} - Formatted phone number.
 */
function formatPhoneNumber(phoneNumberString) {
  const cleaned = ("" + phoneNumberString).replace(/\D/g, ""); // Remove non-digits
  let formattedValue = "";
  if (cleaned.length > 0) {
    formattedValue += "(" + cleaned.substring(0, 3);
  }
  if (cleaned.length >= 4) {
    formattedValue += ") " + cleaned.substring(3, 6);
  }
  if (cleaned.length >= 7) {
    formattedValue += "-" + cleaned.substring(6, 10);
  }
  return formattedValue;
}

/**
 * Calculates days since a given date.
 * @param {string} dateString - The date string (e.g., "YYYY-MM-DD").
 * @returns {number|string} - Number of days ago, "Today", "Yesterday", or "N/A".
 */
function getDaysSince(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day
  date.setHours(0, 0, 0, 0); // Normalize to start of day

  const diffTime = today.getTime() - date.getTime(); // Calculate difference in milliseconds
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // Convert to full days

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays > 1) {
    return `${diffDays} days ago`;
  } else {
    return "In the future"; // For dates after today
  }
}

// --- View Management ---

/**
 * Hides all view sections.
 */
function hideAllViews() {
  document.querySelectorAll(".view").forEach((view) => {
    view.style.display = "none";
  });
}

/**
 * Checks if essential settings are complete.
 * @returns {boolean} - True if settings are complete, false otherwise.
 */
function areSettingsComplete() {
  const city = defaultCityInput.value.trim();
  const state = defaultStateInput.value.trim();
  const lat = parseFloat(defaultLatitudeInput.value);
  const lon = parseFloat(defaultLongitudeInput.value);

  // Settings are complete if either City/State are present OR Lat/Long are present
  return (city && state) || (!isNaN(lat) && !isNaN(lon));
}

/**
 * Shows a specific view section and updates header/footer visual states.
 * Also enforces settings completion for certain views.
 * @param {HTMLElement} viewToShow - The view element to display.
 */
function showView(viewToShow) {
  // Get the currently active view before changing it
  const currentActiveView = document.querySelector(
    '.view[style*="display: block"]'
  );

  // If trying to navigate away from RV form and name is empty
  if (
    currentActiveView === rvFormView &&
    viewToShow !== rvFormView &&
    rvNameInput.value.trim() === ""
  ) {
    showConfirmationDialog(
      "Contact cannot be saved without a Name. Do you want to proceed without saving this contact?",
      () => {
        // User confirmed to proceed without saving this specific contact
        clearRVForm(); // Clear the form without saving
        // Now proceed to the originally intended view
        proceedToShowView(viewToShow);
      },
      () => {
        // User chose to go back, stay on the RV form
        // Do nothing, keep the current view as rvFormView
      }
    );
    return; // Stop further execution of showView until dialog is handled
  }

  // If trying to navigate away from settings and settings are incomplete
  if (viewToShow !== settingsView && !areSettingsComplete()) {
    showMessage(
      "Please complete your default City/State or Coordinates in Settings before proceeding.",
      "warning"
    );
    // Ensure settings view remains active if validation fails
    hideAllViews();
    settingsView.style.display = "block";
    document
      .querySelectorAll(".app-footer a, .app-footer button")
      .forEach((item) => {
        item.classList.remove("active");
      });
    settingsBtn.classList.add("active");
    return; // Prevent navigation
  }

  // If we reach here, it means either:
  // 1. We are navigating to settingsView (no validation needed to enter settings)
  // 2. We are navigating away from settingsView and settings are complete
  // 3. We are navigating away from rvFormView and name is not empty (or user confirmed to discard)
  // 4. We are navigating between other views (no special validation)
  proceedToShowView(viewToShow);
}

/**
 * Helper function to actually change the view after validation.
 * @param {HTMLElement} viewToShow - The view element to display.
 */
function proceedToShowView(viewToShow) {
  hideAllViews();
  viewToShow.style.display = "block";

  // Update subheading in the main header
  const appSubheading = document.getElementById("appSubheading");
  appSubheading.textContent = "Local Data"; // Default subtitle

  // Remove active class from all footer links/buttons first
  document
    .querySelectorAll(".app-footer a, .app-footer button")
    .forEach((item) => {
      item.classList.remove("active");
    });

  // Control addRVBtn visibility (now always visible in header for relevant views)
  addRVBtn.style.display = "flex"; // Default to flex
  // Control Previous/Next buttons visibility in footer
  prevRvBtn.style.display = "none";
  nextRvBtn.style.display = "none";

  if (viewToShow === settingsView) {
    appSubheading.textContent = "Settings";
    addRVBtn.style.display = "none"; // Hide add button in settings view
    settingsBtn.classList.add("active"); // Add active class to settings button
  } else if (viewToShow === myRVsView) {
    appSubheading.textContent = "Contact Info";
    // addRVBtn.style.display is already flex from above
    generateAreaFilterCheckboxes("contact"); // Regenerate filter options for contacts view
    myRVsLink.classList.add("active"); // Add active class to My RVs link
  } else if (viewToShow === mapView) {
    appSubheading.textContent = "Map";
    addRVBtn.style.display = "none"; // Hide add button in map view
    loadDataFromLocalStorage(); // Ensure settings are fresh before initializing map
    initMap(); // Initialize map when map view is shown
    generateAreaFilterCheckboxes("map"); // Regenerate filter options for map view
    mapLink.classList.add("active"); // Add active class to Map link
  } else if (viewToShow === rvFormView) {
    appSubheading.textContent = "RV Information"; // Set subheading for RV form view
    // addRVBtn.style.display is already flex from above
    updateRvFormNavButtons(); // Show/hide prev/next buttons based on current RV
    prevRvBtn.style.display = "flex"; // Always show prev/next buttons in form view
    nextRvBtn.style.display = "flex"; // Always show prev/next buttons in form view
  }
}

// --- Local Storage Functions ---

/**
 * Loads data (settings and RVs) from local storage.
 */
function loadDataFromLocalStorage() {
  try {
    const storedSettings = localStorage.getItem("myRVsSettings");
    if (storedSettings) {
      settings = JSON.parse(storedSettings);
      console.log("Settings loaded from local storage:", settings);
    } else {
      settings = {}; // Initialize empty if nothing found
      console.log("No settings found in local storage.");
    }

    const storedRVs = localStorage.getItem("myRVs");
    if (storedRVs) {
      rvs = JSON.parse(storedRVs);
      console.log("RVs loaded from local storage:", rvs);
    } else {
      rvs = []; // Initialize empty array if nothing found
      console.log("No RVs found in local storage.");
    }
  } catch (e) {
    console.error("Error loading data from local storage:", e);
    showMessage("Error loading saved data.", "error");
    settings = {};
    rvs = [];
  }
}

/**
 * Saves data (settings and RVs) to local storage.
 */
function saveDataToLocalStorage() {
  try {
    localStorage.setItem("myRVsSettings", JSON.stringify(settings));
    localStorage.setItem("myRVs", JSON.stringify(rvs));
    console.log("Data saved to local storage.");
  } catch (e) {
    console.error("Error saving data to local storage:", e);
    showMessage("Error saving data.", "error");
  }
}

// --- Settings View Functions ---

/**
 * Populates the settings form fields from the 'settings' global variable.
 */
function populateSettingsForm() {
  defaultCityInput.value = settings.defaultCity || "";
  defaultStateInput.value = settings.defaultState || "";
  defaultLatitudeInput.value = settings.defaultLatitude || "";
  defaultLongitudeInput.value = settings.defaultLongitude || "";
  googleMapsApiKeyInput.value = settings.googleMapsApiKey || "";
}

/**
 * Saves settings to local storage.
 */
async function saveSettings() {
  const defaultCity = defaultCityInput.value.trim();
  const defaultState = defaultStateInput.value.trim();
  let defaultLatitude = parseFloat(defaultLatitudeInput.value);
  let defaultLongitude = parseFloat(defaultLongitudeInput.value);
  const googleMapsApiKey = googleMapsApiKeyInput.value.trim();

  // If City/State are provided and Lat/Long are empty, try to geocode
  if (
    defaultCity &&
    defaultState &&
    (isNaN(defaultLatitude) || isNaN(defaultLongitude))
  ) {
    console.log(
      `Attempting to geocode City: ${defaultCity}, State: ${defaultState}`
    );
    const coords = await geocodeCityState(defaultCity, defaultState);
    if (coords) {
      defaultLatitude = coords.lat;
      defaultLongitude = coords.lon;
      defaultLatitudeInput.value = coords.lat.toFixed(6); // Update UI
      defaultLongitudeInput.value = coords.lon.toFixed(6); // Update UI
      console.log(
        `Geocoded coordinates: Lat ${defaultLatitude}, Lon ${defaultLongitude}`
      );
    } else {
      showMessage(
        "Could not find coordinates for the entered City and State. Please enter valid location or coordinates.",
        "warning"
      );
      // Don't return here, allow saving incomplete settings if user insists
    }
  } else if (
    !defaultCity &&
    !defaultState &&
    (isNaN(defaultLatitude) || isNaN(defaultLongitude))
  ) {
    // If nothing is entered for location, show warning
    showMessage(
      "Either City/State or Latitude/Longitude must be entered for default settings.",
      "warning"
    );
    // Don't return here, allow saving incomplete settings if user insists
  }

  settings = {
    defaultCity: defaultCity,
    defaultState: defaultState,
    defaultLatitude: isNaN(defaultLatitude) ? null : defaultLatitude,
    defaultLongitude: isNaN(defaultLongitude) ? null : defaultLongitude,
    googleMapsApiKey: googleMapsApiKey,
    lastUpdated: new Date().toISOString(),
  };

  saveDataToLocalStorage();
  showMessage("Settings saved automatically!", "success"); // Changed message
  mapInitialized = false; // Force map re-initialization on next map view
}

/**
 * Gets current geolocation and populates latitude/longitude fields.
 * @param {HTMLInputElement} latInput - The latitude input field.
 * @param {HTMLInputElement} longInput - The longitude input field.
 */
function getCurrentLocation(latInput, longInput) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        latInput.value = position.coords.latitude.toFixed(6);
        longInput.value = position.coords.longitude.toFixed(6);
        showMessage("Location retrieved successfully!", "success");
        // Also update city/state if this is the default settings form
        if (latInput === defaultLatitudeInput) {
          await updateCityStateFromCoordinates("default");
        } else if (latInput === rvLatitudeInput) {
          await updateCityStateFromCoordinates("rv");
        }
        saveSettings(); // Autosave after getting current location
      },
      (error) => {
        console.error("Error getting location:", error);
        let errorMessage = "Unable to retrieve your location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Location access denied. Please enable location services for this app.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "The request to get user location timed out.";
            break;
        }
        showMessage(errorMessage, "error");
      }
    );
  } else {
    showMessage("Geolocation is not supported by your browser.", "error");
  }
}

/**
 * Handles exporting data (e.g., to JSON file).
 */
function exportData() {
  try {
    const dataToExport = {
      settings: settings,
      rvs: rvs,
    };

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my_rvs_data_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showMessage("Data exported successfully!", "success");
  } catch (e) {
    console.error("Error exporting data:", e);
    showMessage("Failed to export data.", "error");
  }
}

/**
 * Handles importing data from a JSON file.
 */
function importData() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          const importedData = JSON.parse(content);

          if (importedData.settings) {
            settings = importedData.settings;
            populateSettingsForm(); // Update UI
          }

          if (importedData.rvs && Array.isArray(importedData.rvs)) {
            importedData.rvs.forEach((importedRv) => {
              // Ensure unique IDs for imported RVs to prevent conflicts
              if (
                !importedRv.id ||
                rvs.some((existingRv) => existingRv.id === importedRv.id)
              ) {
                importedRv.id = generateUniqueId();
              }
            });
            rvs = importedData.rvs;
            renderRVs(); // Update UI
          }
          saveDataToLocalStorage(); // Save imported data to local storage
          showMessage("Data imported successfully!", "success");
        };
        reader.readAsText(file);
      } catch (e) {
        console.error("Error importing data:", e);
        showMessage("Failed to import data. Invalid file format.", "error");
      }
    }
  };
  input.click();
}

// --- My RVs List View Functions ---

/**
 * Sorts the RVs based on the selected sort order.
 * @param {Array} rvsArray - The array of RVs to sort.
 * @param {string} sortOrder - 'oldest' or 'newest'.
 * @returns {Array} - The sorted array.
 */
function sortRVs(rvsArray, sortOrder) {
  // Filter out RVs without a lastContacted date for sorting purposes
  const rvsWithDate = rvsArray.filter(
    (rv) => rv.lastContacted && rv.lastContacted.date
  );
  const rvsWithoutDate = rvsArray.filter(
    (rv) => !rv.lastContacted || !rv.lastContacted.date
  );

  rvsWithDate.sort((a, b) => {
    const dateA = new Date(a.lastContacted.date);
    const dateB = new Date(b.lastContacted.date);
    if (sortOrder === "oldest") {
      return dateA.getTime() - dateB.getTime();
    } else {
      return dateB.getTime() - dateA.getTime();
    }
  });

  // Combine sorted RVs with those without a date (place them at the end)
  return rvsWithDate.concat(rvsWithoutDate);
}

/**
 * Filters the RVs based on selected area checkboxes and color filters.
 * @param {Array} rvsArray - The array of RVs to filter.
 * @param {Array} selectedAreaFilters - An array of selected area names (e.g., ['No Area', 'North District']).
 * @param {Array} selectedColorFilters - An array of selected color names (e.g., ['blue', 'red', 'violet']).
 * @returns {Array} - The filtered array.
 */
function filterRVs(rvsArray, selectedAreaFilters, selectedColorFilters) {
  let filteredByArea = [];
  if (selectedAreaFilters.includes("all")) {
    filteredByArea = rvsArray;
  } else if (selectedAreaFilters.length > 0) {
    filteredByArea = rvsArray.filter((rv) =>
      selectedAreaFilters.includes(rv.area || "No Area")
    );
  } else {
    // If "All Areas" is not checked and no specific areas are checked,
    // only show "No Area" if its checkbox is specifically checked.
    // Otherwise, show nothing.
    const noAreaCheckbox =
      document.getElementById("filterNoArea") ||
      document.getElementById("mapFilterNoArea") ||
      document.getElementById("formFilterNoArea");
    if (noAreaCheckbox && noAreaCheckbox.checked) {
      filteredByArea = rvsArray.filter(
        (rv) => (rv.area || "No Area") === "No Area"
      );
    } else {
      filteredByArea = [];
    }
  }

  // Apply color filtering
  // If no color filters are selected, or all are selected, show all pins.
  // Otherwise, only show pins matching selected colors.
  if (selectedColorFilters.length === 0 || selectedColorFilters.length === 3) {
    return filteredByArea;
  }

  return filteredByArea.filter((rv) => {
    let pinColor = "blue"; // Default Blue for geolocated pins
    let isGeolocated =
      !isNaN(parseFloat(rv.latitude)) && !isNaN(parseFloat(rv.longitude));

    if (!isGeolocated) {
      pinColor = "violet"; // Violet for non-geolocated
    } else {
      const today = new Date();
      const visitDate = new Date(rv.lastContacted?.date);
      today.setHours(0, 0, 0, 0);
      visitDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (today.getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (!isNaN(diffDays) && diffDays >= 14) {
        pinColor = "red"; // Red for 14+ days ago
      }
    }
    return selectedColorFilters.includes(pinColor);
  });
}

/**
 * Renders the list of RVs in the myRVsView, applying sorting and filtering.
 */
function renderRVs() {
  let rvsToDisplay = getFilteredAndSortedRVs(); // Use the new helper function

  rvListContainer.innerHTML = ""; // Clear existing list

  if (rvsToDisplay.length === 0) {
    rvListContainer.innerHTML =
      '<p class="no-rvs-message">No Return Visits match your current filters. Try adjusting them!</p>';
    return;
  }

  rvsToDisplay.forEach((rv) => {
    const rvCard = document.createElement("div");
    rvCard.className = "rv-card";
    rvCard.dataset.id = rv.id; // Store unique ID

    const displayName = rv.name || rv.address || "Unnamed RV";

    const lastVisitedDate = rv.lastContacted?.date || "N/A";
    const daysSinceLastVisited = getDaysSince(lastVisitedDate);

    rvCard.innerHTML = `
      <div class="rv-card-header">
        <h3>${displayName}</h3>
        <div class="rv-card-actions">
          <button class="delete-rv-btn icon-button" title="Delete RV">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20px" height="20px">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </div>
      <p>${rv.address || ""}</p>
      <p>${rv.city || ""}${rv.city && rv.state ? ", " : ""}${rv.state || ""}</p>
      <p class="last-visited-info">Days since last visited: ${daysSinceLastVisited}</p>
      ${
        rv.area ? `<div class="area-display">${rv.area}</div>` : ""
      } <!-- Conditionally display area -->
    `;
    rvListContainer.appendChild(rvCard);

    // Add event listener to the card itself for editing
    rvCard.addEventListener("click", (event) => {
      if (!event.target.closest(".delete-rv-btn")) {
        editRV(rv.id);
      }
    });
  });

  // Add event listeners to newly rendered delete buttons
  document.querySelectorAll(".delete-rv-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation(); // Prevent card click from firing
      const rvId = event.target.closest(".rv-card").dataset.id;
      showConfirmationDialog("Are you sure you want to delete this RV?", () =>
        deleteRV(rvId)
      );
    });
  });
}

/**
 * Dynamically generates area filter checkboxes based on unique areas in RVs.
 * @param {'contact'|'map'|'form'} viewType - Indicates which view's filter checkboxes to generate.
 */
function generateAreaFilterCheckboxes(viewType) {
  let targetDiv, filterAllId, filterNoAreaId;

  if (viewType === "contact") {
    targetDiv = areaFilterCheckboxesDiv;
    filterAllId = "filterAllAreas";
    filterNoAreaId = "filterNoArea";
  } else if (viewType === "map") {
    targetDiv = mapAreaFilterCheckboxesDiv;
    filterAllId = "mapFilterAllAreas";
    filterNoAreaId = "mapFilterNoArea";
  } else if (viewType === "form") {
    // Added for formView
    targetDiv = document.getElementById("formAreaFilterCheckboxes");
    filterAllId = "formFilterAllAreas";
    filterNoAreaId = "formFilterNoArea";
  } else {
    return;
  }

  // Get unique areas from current RVs (excluding "No Area" for dynamic generation)
  const uniqueAreas = [
    ...new Set(
      rvs.map((rv) => rv.area).filter((area) => area && area !== "No Area")
    ),
  ].sort();

  // Store current checked state of dynamic checkboxes before clearing
  const currentDynamicChecked = Array.from(
    targetDiv.querySelectorAll('input[type="checkbox"]:checked')
  )
    .filter((cb) => cb.value !== "all" && cb.value !== "No Area")
    .map((cb) => cb.value);

  // Clear all existing children
  // We will re-add "All Areas" and "No Area" to ensure they are always present and in order
  Array.from(targetDiv.children).forEach((child) => {
    child.remove();
  });

  const recreateCheckbox = (id, value, text, checkedState) => {
    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = id;
    checkbox.value = value;
    checkbox.checked = checkedState;

    let label = document.createElement("label");
    label.htmlFor = id;
    label.textContent = text;

    targetDiv.appendChild(checkbox);
    targetDiv.appendChild(label);
    return { checkbox, label };
  };

  // Recreate "All Areas" and "No Area" first to ensure their order
  // Retrieve their last checked state from the DOM if they existed, otherwise default.
  const prevAllAreasChecked =
    document.getElementById(filterAllId)?.checked || true;
  const prevNoAreaChecked =
    document.getElementById(filterNoAreaId)?.checked || false;

  recreateCheckbox(filterAllId, "all", "All Areas", prevAllAreasChecked);
  recreateCheckbox(filterNoAreaId, "No Area", "No Area", prevNoAreaChecked);

  // Append dynamic area checkboxes
  uniqueAreas.forEach((area) => {
    // Check if this specific area was previously checked
    const wasChecked = currentDynamicChecked.includes(area);
    recreateCheckbox(
      `filter-${viewType}-${area.replace(/\s/g, "-")}`,
      area,
      area,
      wasChecked
    );
  });

  // Re-attach event listeners to all checkboxes in this group
  targetDiv.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.removeEventListener("change", handleFilterChange); // Remove old listeners first
    checkbox.addEventListener("change", handleFilterChange);
  });
}

/**
 * Handles changes in sort radio buttons or filter checkboxes to re-render RVs.
 */
function handleSortFilterChange() {
  renderRVs();
}

/**
 * Specific handler for filter checkbox changes, managing 'All Areas' logic.
 */
function handleFilterChange(event) {
  const changedCheckbox = event.target;
  const filterGroup = changedCheckbox.closest(".filter-options");
  const allCheckboxesInGroup = Array.from(
    filterGroup.querySelectorAll('input[type="checkbox"]')
  );
  const filterAllCheckboxesInGroup =
    filterGroup.querySelector('input[value="all"]');
  const filterNoAreaCheckboxInGroup = filterGroup.querySelector(
    'input[value="No Area"]'
  );

  if (changedCheckbox.value === "all") {
    allCheckboxesInGroup.forEach((cb) => {
      if (cb.value !== "all") {
        cb.checked = false;
      }
    });
    if (!changedCheckbox.checked) {
      const anyOtherChecked = allCheckboxesInGroup.some(
        (cb) => cb.checked && cb.value !== "all"
      );
      if (!anyOtherChecked && filterNoAreaCheckboxInGroup) {
        filterNoAreaCheckboxInGroup.checked = true;
      }
    }
  } else {
    if (changedCheckbox.checked) {
      if (filterAllCheckboxesInGroup) {
        filterAllCheckboxesInGroup.checked = false;
      }
    } else {
      const anyOtherChecked = allCheckboxesInGroup.some(
        (cb) => cb.checked && cb.value !== "all"
      );
      if (!anyOtherChecked) {
        if (filterAllCheckboxesInGroup) {
          filterAllCheckboxesInGroup.checked = true;
        } else if (filterNoAreaCheckboxInGroup) {
          // Fallback if no "All Areas"
          filterNoAreaCheckboxInGroup.checked = true;
        }
      }
    }
  }
  renderRVs();
  if (mapView.style.display === "block") {
    // Only update map if map view is active
    updateMap();
  }
}

// --- RV Form View Functions (Add/Edit) ---

/**
 * Clears the RV form fields and populates with defaults if adding a new RV.
 */
function clearRVForm() {
  rvNameInput.value = "";
  rvAddressInput.value = "";
  rvCityInput.value = settings.defaultCity || ""; // Autofill from settings
  rvStateInput.value = settings.defaultState || ""; // Autofill from settings
  rvEmailInput.value = "";
  rvPhoneInput.value = ""; // Clear phone field
  rvLatitudeInput.value = "";
  rvLongitudeInput.value = "";
  rvLastContactedDateInput.value = "";
  rvLastContactedDayInput.value = "";
  rvLastContactedTimeInput.value = "";
  rvNoteInput.value = "";
  currentRVId = null;
  currentRvIndex = -1; // Reset index for new RV
  if (removeVisitBtnForm) removeVisitBtnForm.style.display = "none"; // Hide for new entry until a date is chosen

  // Autofill current date/time if adding a new RV
  const now = new Date();
  const dateString = now.toISOString().split("T")[0]; //YYYY-MM-DD
  const timeString = now.toTimeString().split(" ")[0].substring(0, 5); // HH:MM

  rvLastContactedDateInput.value = dateString;
  rvLastContactedDayInput.value = getFormattedDay(dateString);
  rvLastContactedTimeInput.value = timeString;
  if (removeVisitBtnForm) removeVisitBtnForm.style.display = "inline-flex"; // Show remove visit button for new entries

  // Disable Previous/Next buttons for new entry
  prevRvBtn.disabled = true;
  nextRvBtn.disabled = true;
}

/**
 * Populates the RV form fields for editing an existing RV.
 * @param {string} rvId - The ID of the RV to edit.
 */
function editRV(rvId) {
  const rvsToDisplay = getFilteredAndSortedRVs(); // Get currently filtered/sorted list
  const rvToEditIndex = rvsToDisplay.findIndex((rv) => rv.id === rvId);

  if (rvToEditIndex !== -1) {
    currentRvIndex = rvToEditIndex;
    const rvToEdit = rvsToDisplay[currentRvIndex];
    currentRVId = rvToEdit.id;

    rvNameInput.value = rvToEdit.name || "";
    rvAddressInput.value = rvToEdit.address || "";
    rvCityInput.value = rvToEdit.city || "";
    rvStateInput.value = rvToEdit.state || "";
    rvEmailInput.value = rvToEdit.email || "";
    rvPhoneInput.value = rvToEdit.phone || ""; // Populate phone field
    rvLatitudeInput.value = rvToEdit.latitude || "";
    rvLongitudeInput.value = rvToEdit.longitude || "";
    rvLastContactedDateInput.value = rvToEdit.lastContacted?.date || "";
    rvLastContactedDayInput.value = getFormattedDay(
      rvToEdit.lastContacted?.date
    );
    rvLastContactedTimeInput.value = rvToEdit.lastContacted?.time || "";
    rvNoteInput.value = rvToEdit.note || "";

    if (removeVisitBtnForm)
      removeVisitBtnForm.style.display = rvToEdit.lastContacted?.date
        ? "inline-flex"
        : "none";

    showView(rvFormView);
    updateRvFormNavButtons(); // Update button states after loading RV
  } else {
    showMessage("RV not found.", "error");
    console.error("No such RV with ID:", rvId);
  }
}

/**
 * Saves a new or updates an existing Return Visit to local storage.
 */
async function saveRV() {
  const name = rvNameInput.value.trim();
  const address = rvAddressInput.value.trim();
  const city = rvCityInput.value.trim();
  const state = rvStateInput.value.trim();
  const email = rvEmailInput.value.trim();
  const phone = rvPhoneInput.value.trim(); // Get phone number
  const latitude = parseFloat(rvLatitudeInput.value);
  const longitude = parseFloat(rvLongitudeInput.value);
  const lastContactedDate = rvLastContactedDateInput.value;
  const lastContactedTime = rvLastContactedTimeInput.value;
  const note = rvNoteInput.value.trim();

  // Validation check for name
  if (!name) {
    // Await the user's decision from the confirmation dialog
    const proceedAnyway = await new Promise((resolve) => {
      showConfirmationDialog(
        "A name has not been entered for this contact. It cannot be easily identified without one. Do you want to save it anyway?",
        () => resolve(true), // User chose to proceed
        () => resolve(false) // User chose to cancel
      );
    });

    if (!proceedAnyway) {
      // User chose not to save, so prevent the save operation
      showMessage("Contact not saved. Please enter a name.", "info");
      return;
    }
  }

  // If a name is present, or user proceeded without one, save the RV
  proceedSaveRV(
    name,
    address,
    city,
    state,
    email,
    phone,
    latitude,
    longitude,
    lastContactedDate,
    lastContactedTime,
    note
  );
}

/**
 * Helper function to actually save the RV data after validation.
 */
function proceedSaveRV(
  name,
  address,
  city,
  state,
  email,
  phone,
  latitude,
  longitude,
  lastContactedDate,
  lastContactedTime,
  note
) {
  const rvData = {
    id: currentRVId || generateUniqueId(),
    name: name,
    address: address,
    city: city,
    state: state,
    area: "No Area", // Always "No Area"
    email: email,
    phone: phone, // Save phone number
    latitude: isNaN(latitude) ? null : latitude,
    longitude: isNaN(longitude) ? null : longitude,
    lastContacted: lastContactedDate
      ? {
          date: lastContactedDate,
          time: lastContactedTime,
          timestamp: new Date(
            `${lastContactedDate}T${lastContactedTime || "00:00"}`
          ).toISOString(),
        }
      : null,
    note: note,
    createdAt: currentRVId
      ? rvs.find((rv) => rv.id === currentRVId)?.createdAt
      : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (currentRVId) {
    const index = rvs.findIndex((rv) => rv.id === currentRVId);
    if (index !== -1) {
      rvs[index] = rvData;
      showMessage("RV Information updated automatically!", "success");
    }
  } else {
    rvs.push(rvData);
    showMessage("RV Information added automatically!", "success");
    currentRVId = rvData.id; // Set currentRVId for newly added RV
    currentRvIndex = rvs.length - 1; // Set index for newly added RV
  }

  saveDataToLocalStorage();
  renderRVs(); // Re-render the list
  updateMap(); // Update the map
  updateRvFormNavButtons(); // Update button states after saving
}

/**
 * Deletes a Return Visit from local storage.
 * @param {string} rvId - The ID of the RV to delete.
 */
function deleteRV(rvId) {
  const initialLength = rvs.length;
  rvs = rvs.filter((rv) => rv.id !== rvId);
  if (rvs.length < initialLength) {
    saveDataToLocalStorage();
    renderRVs(); // Re-render the list
    updateMap(); // Update the map
    showMessage("Return Visit deleted successfully!", "success");
  } else {
    showMessage("RV not found for deletion.", "error");
  }
}

/**
 * Adds a new visit entry (currently just updates lastContacted fields).
 */
function addVisit() {
  const now = new Date();
  const dateString = now.toISOString().split("T")[0]; //YYYY-MM-DD
  const timeString = now.toTimeString().split(" ")[0].substring(0, 5); // HH:MM

  rvLastContactedDateInput.value = dateString;
  rvLastContactedDayInput.value = getFormattedDay(dateString);
  rvLastContactedTimeInput.value = timeString;
  if (removeVisitBtnForm) removeVisitBtnForm.style.display = "inline-flex";
  showMessage("Current date/time added to 'Visited' fields.", "info");
  saveRV(); // Autosave after adding visit
}

/**
 * Removes the last visit entry (currently just clears lastContacted fields).
 */
function removeVisit() {
  rvLastContactedDateInput.value = "";
  rvLastContactedDayInput.value = "";
  rvLastContactedTimeInput.value = "";
  if (removeVisitBtnForm) removeVisitBtnForm.style.display = "none";
  showMessage("Visited date/time cleared.", "info");
  saveRV(); // Autosave after removing visit
}

/**
 * Geocoding Functions
 */

/**
 * Fetches coordinates for a given city and state using Nominatim (OpenStreetMap).
 * @param {string} city - The city name.
 * @param {string} state - The state abbreviation.
 * @returns {Promise<{lat: number, lon: number}|null>} - Latitude and longitude or null if not found.
 */
async function geocodeCityState(city, state) {
  if (!city || !state) {
    console.log("Geocoding: City or State is empty.");
    return null;
  }
  const query = encodeURIComponent(`${city}, ${state}, USA`);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
  console.log("Geocoding URL:", url);
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log("Geocoding response data:", data);
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }
  } catch (error) {
    console.error("Error geocoding city/state:", error);
  }
  return null;
}

/**
 * Fetches city and state for given coordinates using Nominatim (OpenStreetMap).
 * @param {number} lat - Latitude.
 * @param {number} lon - Longitude.
 * @returns {Promise<{city: string, state: string}|null>} - City and state or null if not found.
 */
async function reverseGeocodeCoordinates(lat, lon) {
  if (isNaN(lat) || isNaN(lon)) {
    console.log("Reverse Geocoding: Latitude or Longitude is not a number.");
    return null;
  }
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
  console.log("Reverse Geocoding URL:", url);
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log("Reverse Geocoding response data:", data);
    if (data && data.address) {
      const address = data.address;
      const city =
        address.city ||
        address.town ||
        address.city_district ||
        address.village ||
        address.hamlet ||
        "";
      const state = address.state_code || address.state || "";
      return { city: city, state: state };
    }
  } catch (error) {
    console.error("Error reverse geocoding coordinates:", error);
  }
  return null;
}

/**
 * Updates city/state fields based on latitude/longitude input.
 * @param {'default'|'rv'} type - Indicates which form to update.
 */
async function updateCityStateFromCoordinates(type) {
  let latInput, longInput, cityInput, stateInput;
  if (type === "default") {
    latInput = defaultLatitudeInput;
    longInput = defaultLongitudeInput;
    cityInput = defaultCityInput;
    stateInput = defaultStateInput;
  } else {
    latInput = rvLatitudeInput;
    longInput = rvLongitudeInput;
    cityInput = rvCityInput;
    stateInput = rvStateInput;
  }

  const lat = parseFloat(latInput.value);
  const lon = parseFloat(longInput.value);

  if (!isNaN(lat) && !isNaN(lon)) {
    const result = await reverseGeocodeCoordinates(lat, lon);
    if (result) {
      cityInput.value = result.city;
      stateInput.value = result.state;
    } else {
      // If reverse geocoding fails, clear city/state
      cityInput.value = "";
      stateInput.value = "";
      showMessage(
        "Could not find city/state for these coordinates.",
        "warning"
      );
    }
  }
}

/**
 * Updates latitude/longitude fields based on city/state input.
 * @param {'default'|'rv'} type - Indicates which form to update.
 */
async function updateCoordinatesFromCityState(type) {
  let latInput, longInput, cityInput, stateInput;
  if (type === "default") {
    latInput = defaultLatitudeInput;
    longInput = defaultLongitudeInput;
    cityInput = defaultCityInput;
    stateInput = defaultStateInput;
  } else {
    latInput = rvLatitudeInput;
    longInput = rvLongitudeInput;
    cityInput = rvCityInput;
    stateInput = rvStateInput;
  }

  const city = cityInput.value.trim();
  const state = stateInput.value.trim();

  if (city && state) {
    const result = await geocodeCityState(city, state);
    if (result) {
      latInput.value = result.lat.toFixed(6);
      longInput.value = result.lon.toFixed(6);
    } else {
      // If geocoding fails, clear coordinates
      latInput.value = "";
      longInput.value = "";
      showMessage("Could not find coordinates for this city/state.", "warning");
    }
  }
}

// --- Map View Functions ---

let map; // Google Maps map object
let markers = []; // Array to hold map markers
let leafletMap; // Leaflet map object

/**
 * Loads a JavaScript file dynamically.
 * @param {string} url - The URL of the script to load.
 * @returns {Promise<void>} A promise that resolves when the script is loaded.
 */
function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
    document.head.appendChild(script);
  });
}

/**
 * Loads a CSS file dynamically.
 * @param {string} url - The URL of the stylesheet to load.
 * @returns {Promise<void>} A promise that resolves when the stylesheet is loaded.
 */
function loadCss(url) {
  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load stylesheet: ${url}`));
    document.head.appendChild(link);
  });
}

/**
 * Initializes the map based on user settings (Google Maps or Leaflet/OSM).
 */
async function initMap() {
  const googleMapsApiKey =
    settings.googleMapsApiKey && settings.googleMapsApiKey.trim() !== "";

  const mapContainer = document.getElementById("mapContainer");
  mapContainer.style.height = "400px";

  if (googleMapsApiKey) {
    if (leafletMap) {
      // Destroy Leaflet map if it exists and we're switching to Google
      leafletMap.remove();
      leafletMap = null;
      mapInitialized = false;
    }
    if (!window.google || !window.google.maps || !mapInitialized) {
      try {
        const oldGoogleMapScript = document.querySelector(
          `script[src^="https://maps.googleapis.com/maps/api/js"]`
        );
        if (oldGoogleMapScript) {
          oldGoogleMapScript.remove();
        }
        await loadScript(
          `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&callback=mapReady`
        );
      } catch (error) {
        console.error("Error loading Google Maps script:", error);
        showMessage(
          "Failed to load Google Maps. Check your API key or network.",
          "error"
        );
        initLeafletMap(); // Fallback to Leaflet if Google Maps fails to load
        return;
      }
    } else {
      if (map) {
        // Ensure map exists before calling setCenter/setZoom
        // Update map center and zoom if already initialized
        const defaultLat = parseFloat(settings.defaultLatitude);
        const defaultLng = parseFloat(settings.defaultLongitude);
        const center =
          !isNaN(defaultLat) && !isNaN(defaultLng)
            ? { lat: defaultLat, lng: defaultLng }
            : { lat: 0, lng: 0 };
        const zoom = !isNaN(defaultLat) && !isNaN(defaultLng) ? 10 : 1;
        map.setCenter(center);
        map.setZoom(zoom);
        console.log("Google Map re-centered.");
      }
      window.mapReady();
    }
  } else {
    if (map) {
      // Destroy Google map if it exists and we're switching to Leaflet
      map = null; // Simply nullify the map object
      mapInitialized = false;
      mapContainer.innerHTML = ""; // Clear map container
    }
    initLeafletMap();
  }
}

/**
 * Callback function for Google Maps API script load.
 * This function is called by the Google Maps script once it's loaded.
 */
window.mapReady = function () {
  if (mapInitialized && map) {
    updateMap();
    return;
  }

  // Use default settings latitude/longitude, no hardcoded fallbacks
  const defaultLat = parseFloat(settings.defaultLatitude);
  const defaultLng = parseFloat(settings.defaultLongitude);

  console.log("Map centering on:", defaultLat, defaultLng); // Added console log

  // Only set center if valid coordinates exist in settings
  const center =
    !isNaN(defaultLat) && !isNaN(defaultLng)
      ? { lat: defaultLat, lng: defaultLng }
      : { lat: 0, lng: 0 }; // Default to 0,0 if no valid settings coords
  const zoom = !isNaN(defaultLat) && !isNaN(defaultLng) ? 10 : 1; // Zoom out if no specific location

  map = new google.maps.Map(document.getElementById("mapContainer"), {
    center: center,
    zoom: zoom,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    zoomControl: true,
    styles: [
      { featureType: "poi", stylers: [{ visibility: "off" }] },
      { featureType: "transit", stylers: [{ visibility: "off" }] },
    ],
  });
  console.log("Google Map initialized.");
  mapInitialized = true;
  updateMap();
};

/**
 * Initializes Leaflet map with OpenStreetMap tiles.
 */
async function initLeafletMap() {
  if (mapInitialized && leafletMap) {
    updateMap();
    return;
  }

  if (typeof L === "undefined") {
    try {
      const oldLeafletCss = document.querySelector(
        `link[href^="https://unpkg.com/leaflet@"]`
      );
      if (oldLeafletCss) {
        oldLeafletCss.remove();
      }
      await loadCss("https://unpkg.com/leaflet@1.7.1/dist/leaflet.css");
      await loadScript("https://unpkg.com/leaflet@1.7.1/dist/leaflet.js");
    } catch (error) {
      console.error("Error loading Leaflet scripts/styles:", error);
      showMessage(
        "Failed to load OpenStreetMap. Please check your network.",
        "error"
      );
      return;
    }
  }

  // Use default settings latitude/longitude, no hardcoded fallbacks
  const defaultLat = parseFloat(settings.defaultLatitude);
  const defaultLng = parseFloat(settings.defaultLongitude);

  console.log("Map centering on:", defaultLat, defaultLng); // Added console log

  const center =
    !isNaN(defaultLat) && !isNaN(defaultLng)
      ? [defaultLat, defaultLng]
      : [0, 0]; // Default to 0,0 if no valid settings coords
  const zoom = !isNaN(defaultLat) && !isNaN(defaultLng) ? 10 : 1; // Zoom out if no specific location

  leafletMap = L.map("mapContainer").setView(center, zoom);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(leafletMap);

  console.log("Leaflet/OpenStreetMap initialized.");
  mapInitialized = true;
  updateMap();
}

/**
 * Updates the map with markers for each RV, handling both Google Maps and Leaflet.
 */
function updateMap() {
  const mapProvider =
    settings.googleMapsApiKey && settings.googleMapsApiKey.trim() !== ""
      ? "google"
      : "leaflet";
  const activeMap = mapProvider === "google" ? map : leafletMap;

  if (!activeMap) {
    console.log("No active map initialized to update markers.");
    return;
  }

  // Clear existing markers
  if (mapProvider === "google") {
    markers.forEach((marker) => marker.setMap(null));
    markers = [];
  } else {
    // Leaflet
    markers.forEach((marker) => activeMap.removeLayer(marker)); // Use activeMap here
    markers = [];
  }

  const bounds =
    mapProvider === "google"
      ? new google.maps.LatLngBounds()
      : L.latLngBounds();
  let pinsAdded = 0;

  const usedCoords = {};

  rvs.forEach((rv) => {
    let lat = parseFloat(rv.latitude);
    let lon = parseFloat(rv.longitude);
    let isGeolocated = !isNaN(lat) && !isNaN(lon);

    let pinColor = "blue"; // Default Blue for geolocated pins
    let markerLat = lat;
    let markerLon = lon;
    let markerTitle = rv.name || rv.address || "Unnamed RV";

    if (!isGeolocated) {
      // If not geolocated, use default settings coordinates and violet color
      // Only use default if they are actually set in settings, otherwise skip marker
      const defaultLat = parseFloat(settings.defaultLatitude);
      const defaultLng = parseFloat(settings.defaultLongitude);
      if (!isNaN(defaultLat) && !isNaN(defaultLng)) {
        markerLat = defaultLat;
        markerLon = defaultLng;
        pinColor = "violet"; // Violet for non-geolocated
        markerTitle += " (Location Unknown)";
      } else {
        // Skip adding marker if no specific or default coordinates are available
        return;
      }
    } else {
      // Check for red pin condition (14+ days ago)
      const today = new Date();
      const visitDate = new Date(rv.lastContacted?.date);
      today.setHours(0, 0, 0, 0);
      visitDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (today.getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (!isNaN(diffDays) && diffDays >= 14) {
        pinColor = "red"; // Red for 14+ days ago
      }
    }

    // Apply color filter logic
    const selectedColorFilters = Array.from(
      document.querySelectorAll(
        `#mapShowColorFilterCheckboxes input[type="checkbox"]:checked`
      )
    ).map((cb) => cb.value);

    // If no color filters are selected, or all are selected, show all pins.
    // Otherwise, only show pins matching selected colors.
    if (
      selectedColorFilters.length > 0 &&
      selectedColorFilters.length < 3 &&
      !selectedColorFilters.includes(pinColor)
    ) {
      return; // Skip this RV if its color doesn't match selected filters
    }

    const coordKey = `${markerLat},${markerLon}`;
    if (usedCoords[coordKey]) {
      const offset = 0.0001 * usedCoords[coordKey];
      markerLat += offset;
      markerLon += offset;
    }
    usedCoords[coordKey] = (usedCoords[coordKey] || 0) + 1;

    if (mapProvider === "google") {
      const svgIcon = {
        path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
        fillColor: pinColor,
        fillOpacity: 1,
        strokeWeight: 0,
        scale: 1.5,
        anchor: new google.maps.Point(12, 24),
      };

      const marker = new google.maps.Marker({
        position: { lat: markerLat, lng: markerLon },
        map: activeMap, // Use activeMap here
        title: markerTitle,
        icon: svgIcon,
      });

      marker.rvId = rv.id;

      const infoWindowContent = `
        <div style="padding: 10px; font-family: Arial, sans-serif;">
          <h4 style="margin-top: 0; margin-bottom: 5px; color: #333;">${
            rv.name || "Unnamed RV"
          }</h4>
          <p style="margin-bottom: 3px;">${rv.address || ""}${
        rv.address && (rv.city || rv.state) ? ", " : ""
      }${rv.city || ""}${rv.city && rv.state ? ", " : ""}${rv.state || ""}</p>
        </div>
      `;
      const infoWindow = new google.maps.InfoWindow({
        content: infoWindowContent,
      });

      marker.addListener("mouseover", () => infoWindow.open(activeMap, marker)); // Use activeMap here
      marker.addListener("mouseout", () => infoWindow.close());
      marker.addListener("click", () => editRV(marker.rvId));

      markers.push(marker);
      if (isGeolocated)
        bounds.extend(new google.maps.LatLng(markerLat, markerLon));
      pinsAdded++;
    } else {
      // Leaflet
      const svgIconUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${encodeURIComponent(
        pinColor
      )}" width="24px" height="24px"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
      const customIcon = L.icon({
        iconUrl: svgIconUrl,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24],
      });

      const marker = L.marker([markerLat, markerLon], {
        icon: customIcon,
      }).addTo(activeMap); // Use activeMap here

      marker.rvId = rv.id;

      const popupContent = `
        <div style="padding: 5px; font-family: Arial, sans-serif;">
          <h4 style="margin-top: 0; margin-bottom: 5px; color: #333;">${
            rv.name || "Unnamed RV"
          }</h4>
          <p style="margin-bottom: 3px;">${rv.address || ""}${
        rv.address && (rv.city || rv.state) ? ", " : ""
      }${rv.city || ""}${rv.city && rv.state ? ", " : ""}${rv.state || ""}</p>
        </div>
      `;
      marker.bindPopup(popupContent);
      marker.on("click", () => editRV(marker.rvId));

      markers.push(marker);
      if (isGeolocated) bounds.extend(L.latLng(markerLat, markerLon));
      pinsAdded++;
    }
  });

  if (pinsAdded > 0) {
    if (mapProvider === "google") {
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds);
      }
    } else {
      // Leaflet
      if (bounds.isValid()) {
        leafletMap.fitBounds(bounds);
      }
    }
  }
}

/**
 * Gets the currently filtered and sorted list of RVs.
 * This function will be crucial for Previous/Next navigation.
 * @returns {Array} - The filtered and sorted RVs.
 */
function getFilteredAndSortedRVs() {
  let rvsToDisplay = [...rvs];

  // Determine which filter group is active (myRVsView or rvFormView)
  let areaFilterCheckboxesId = "";
  let colorFilterCheckboxesId = "";
  let sortOrderRadioName = "";

  if (myRVsView.style.display === "block") {
    areaFilterCheckboxesId = "areaFilterCheckboxes";
    colorFilterCheckboxesId = "showColorFilterCheckboxes";
    sortOrderRadioName = "sortOrder";
  } else if (rvFormView.style.display === "block") {
    areaFilterCheckboxesId = "formAreaFilterCheckboxes";
    colorFilterCheckboxesId = "formShowColorFilterCheckboxes";
    sortOrderRadioName = "formSortOrder";
  } else if (mapView.style.display === "block") {
    areaFilterCheckboxesId = "mapAreaFilterCheckboxes";
    colorFilterCheckboxesId = "mapShowColorFilterCheckboxes";
    sortOrderRadioName = "sortOrder"; // Map view uses the main list's sort order
  } else {
    // Default to main filters if no specific view is active or recognized
    areaFilterCheckboxesId = "areaFilterCheckboxes";
    colorFilterCheckboxesId = "showColorFilterCheckboxes";
    sortOrderRadioName = "sortOrder";
  }

  // Get selected area filters
  const selectedAreaFilters = Array.from(
    document.querySelectorAll(
      `#${areaFilterCheckboxesId} input[type="checkbox"]:checked`
    )
  ).map((cb) => cb.value);

  // Get selected color filters
  const selectedColorFilters = Array.from(
    document.querySelectorAll(
      `#${colorFilterCheckboxesId} input[type="checkbox"]:checked`
    )
  ).map((cb) => cb.value);

  // Apply filtering
  rvsToDisplay = filterRVs(
    rvsToDisplay,
    selectedAreaFilters,
    selectedColorFilters
  );

  // Apply sorting
  const selectedSortOrder =
    document.querySelector(`input[name="${sortOrderRadioName}"]:checked`)
      ?.value || "oldest"; // Default to 'oldest' if no radio is checked
  rvsToDisplay = sortRVs(rvsToDisplay, selectedSortOrder);

  return rvsToDisplay;
}

/**
 * Updates the state of the Previous/Next buttons in the RV form.
 */
function updateRvFormNavButtons() {
  const rvsToNavigate = getFilteredAndSortedRVs();
  // Only enable/disable if there are RVs to navigate
  if (rvsToNavigate.length > 0) {
    prevRvBtn.disabled = currentRvIndex <= 0;
    nextRvBtn.disabled = currentRvIndex >= rvsToNavigate.length - 1;
  } else {
    // If no RVs, disable both buttons
    prevRvBtn.disabled = true;
    nextRvBtn.disabled = true;
  }
}

/**
 * Navigates to the previous RV in the filtered/sorted list.
 */
function showPreviousRv() {
  const rvsToNavigate = getFilteredAndSortedRVs();
  if (currentRvIndex > 0) {
    currentRvIndex--;
    editRV(rvsToNavigate[currentRvIndex].id);
  }
}

/**
 * Navigates to the next RV in the filtered/sorted list.
 */
function showNextRv() {
  const rvsToNavigate = getFilteredAndSortedRVs();
  if (currentRvIndex < rvsToNavigate.length - 1) {
    currentRvIndex++;
    editRV(rvsToNavigate[currentRvIndex].id);
  }
}

// --- Event Listeners ---

document.addEventListener("DOMContentLoaded", async () => {
  loadingSpinner.style.display = "flex"; // Show loading spinner

  // Initialize app data from local storage
  loadDataFromLocalStorage();
  populateSettingsForm();

  // Initial view decision based on settings completion
  if (areSettingsComplete()) {
    showView(myRVsView);
    renderRVs(); // Render RVs once loaded
  } else {
    showView(settingsView);
    showMessage(
      "Welcome! Please set your default City/State or Coordinates in Settings.",
      "info"
    );
  }
  loadingSpinner.style.display = "none"; // Hide loading spinner after data initialization

  // Navigation Buttons
  settingsBtn.addEventListener("click", () => {
    showView(settingsView);
  });
  myRVsLink.addEventListener("click", () => {
    showView(myRVsView);
  });
  mapLink.addEventListener("click", () => {
    showView(mapView);
  });

  // Settings Autosave: Add blur listeners to all relevant inputs for autosave
  document
    .querySelectorAll(
      '#settingsView input[type="text"], #settingsView input[type="number"]'
    )
    .forEach((input) => {
      input.addEventListener("blur", saveSettings);
    });

  // Add event listeners for input changes to trigger geocoding/reverse geocoding
  defaultCityInput.addEventListener("change", () =>
    updateCoordinatesFromCityState("default")
  );
  defaultStateInput.addEventListener("change", () =>
    updateCoordinatesFromCityState("default")
  );
  defaultLatitudeInput.addEventListener("change", () =>
    updateCityStateFromCoordinates("default")
  );
  defaultLongitudeInput.addEventListener("change", () =>
    updateCoordinatesFromCityState("default")
  );

  rvCityInput.addEventListener("change", () =>
    updateCoordinatesFromCityState("rv")
  );
  rvStateInput.addEventListener("change", () =>
    updateCoordinatesFromCityState("rv")
  );
  rvLatitudeInput.addEventListener("change", () =>
    updateCityStateFromCoordinates("rv")
  );
  rvLongitudeInput.addEventListener("change", () =>
    updateCoordinatesFromCityState("rv")
  );

  // My RVs View Buttons
  addRVBtn.addEventListener("click", () => {
    clearRVForm(); // Now also populates with defaults
    showView(rvFormView);
  });

  // RV Form Autosave: Add blur listeners to all relevant inputs for autosave
  document
    .querySelectorAll("#rvFormView input, #rvFormView textarea")
    .forEach((input) => {
      input.addEventListener("blur", saveRV);
    });

  // Phone number auto-formatting
  rvPhoneInput.addEventListener("input", (e) => {
    e.target.value = formatPhoneNumber(e.target.value);
  });

  addVisitBtnForm.addEventListener("click", addVisit);
  removeVisitBtnForm.addEventListener("click", removeVisit);

  // Previous/Next RV navigation buttons
  prevRvBtn.addEventListener("click", showPreviousRv);
  nextRvBtn.addEventListener("click", showNextRv);

  // Sort and Filter Event Listeners (for all relevant views)
  document
    .querySelectorAll('.sort-options input[type="radio"]')
    .forEach((radio) => {
      radio.addEventListener("change", handleSortFilterChange);
    });

  document
    .querySelectorAll('.filter-options input[type="checkbox"]')
    .forEach((checkbox) => {
      checkbox.addEventListener("change", handleFilterChange);
    });

  // Initial generation of Area filters for contact view
  generateAreaFilterCheckboxes("contact");
});
