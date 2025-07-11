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
const rvPhoneInput = document.getElementById("rvPhone"); // Added phone input reference
const rvAreaInput = document.getElementById("rvArea"); // New Area input

const rvListContainer = document.querySelector(".rv-list");
const sortOldNewRadio = document.getElementById("sortOldNew");
const sortNewOldRadio = document.getElementById("sortNewOld");
const filterAllAreasCheckbox = document.getElementById("filterAllAreas");
const filterNoAreaCheckbox = document.getElementById("filterNoArea");
const areaFilterCheckboxesDiv = document.getElementById("areaFilterCheckboxes");
const mapAreaFilterCheckboxesDiv = document.getElementById(
  "mapAreaFilterCheckboxes"
);
// New: RV Form specific filter/sort elements (for their own controls)
const formAreaFilterCheckboxesDiv = document.getElementById(
  "formAreaFilterCheckboxes"
);
const formShowColorFilterCheckboxesDiv = document.getElementById(
  "formShowColorFilterCheckboxes"
); // This will be removed
const formSortOldNewRadio = document.getElementById("formSortOldNew");
const formSortNewOldRadio = document.getElementById("formSortNewOld");

// New: Visits container for dynamic visit entries
const rvVisitsContainer = document.getElementById("rvVisitsContainer");
const addVisitBtnHeader = document.querySelector(
  ".visits-header .add-visit-btn"
); // The plus button for adding visits

// Previous/Next RV Navigation Elements (moved to be children of rvName label)
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
      top: 100px; /* Adjusted to be lower */
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
  }, 8000); /* messages will stay for 8 seconds */
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
    viewToShow !== rvFormView && // Only if navigating to a *different* view
    rvNameInput.value.trim() === ""
  ) {
    showConfirmationDialog(
      "No name has been entered, if you proceed this contact will not be created.",
      () => {
        // User confirmed to proceed without saving this specific contact
        clearRVForm(false); // Clear the form without saving, pass false to not autofill current date/time
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
    // addRVBtn.style.display is already flex from above (now visible in all views)
    settingsBtn.classList.add("active"); // Add active class to settings button
  } else if (viewToShow === myRVsView) {
    appSubheading.textContent = "Contact Info";
    // addRVBtn.style.display is already flex from above
    generateAreaFilterCheckboxes("contact"); // Regenerate filter options for contacts view
    myRVsLink.classList.add("active"); // Add active class to My RVs link
    renderRVs(); // Re-render RVs when returning to this view
  } else if (viewToShow === mapView) {
    appSubheading.textContent = "Map";
    // addRVBtn.style.display is already flex from above (now visible in all views)
    loadDataFromLocalStorage(); // Ensure settings are fresh before initializing map
    initMap(); // Initialize map when map view is shown
    generateAreaFilterCheckboxes("map"); // Regenerate filter options for map view
    mapLink.classList.add("active"); // Add active class to Map link
  } else if (viewToShow === rvFormView) {
    appSubheading.textContent = "RV Information"; // Set subheading for RV form view
    getFilteredAndSortedRVs(); // Show header nav buttons and run layout logic
    prevRvBtn.style.display = "flex";
    nextRvBtn.style.display = "flex";
    generateAreaFilterCheckboxes("form"); // Regenerate filter options for RV form view
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
      // Ensure each RV has a 'visits' array for backward compatibility if needed
      rvs.forEach((rv) => {
        if (!rv.visits) {
          // If old data format, convert lastContacted to a single-entry visits array
          if (rv.lastContacted && rv.lastContacted.date) {
            rv.visits = [
              {
                date: rv.lastContacted.date,
                time: rv.lastContacted.time || "00:00",
                note: rv.note || "", // Use existing note if available
                timestamp:
                  rv.lastContacted.timestamp ||
                  new Date(
                    `${rv.lastContacted.date}T${
                      rv.lastContacted.time || "00:00"
                    }`
                  ).toISOString(),
              },
            ];
          } else {
            rv.visits = [];
          }
        }
        // Ensure 'area' field exists, default to "No Area"
        if (
          typeof rv.area === "undefined" ||
          rv.area === null ||
          rv.area.trim() === ""
        ) {
          rv.area = "No Area";
        }
        // Remove old 'lastContacted' and 'note' properties if 'visits' is present
        delete rv.lastContacted;
        delete rv.note;
      });
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
    const coords = await geocodeCityState(
      `${defaultCity}, ${defaultState}, USA`
    );
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
        // Update city/state based on new coordinates and then trigger save for the relevant form
        if (latInput === defaultLatitudeInput) {
          await updateCityStateFromCoordinates("default");
          saveSettings(); // Save settings if it's the default form's button
        } else if (latInput === rvLatitudeInput) {
          await updateCityStateFromCoordinates("rv");
          saveRV(); // Save the RV if it's the RV form's button
        }
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
              // Ensure 'visits' array is correctly formatted for imported RVs
              if (!importedRv.visits) {
                if (importedRv.lastContacted && importedRv.lastContacted.date) {
                  importedRv.visits = [
                    {
                      date: importedRv.lastContacted.date,
                      time: importedRv.lastContacted.time || "00:00",
                      note: importedRv.note || "",
                      timestamp:
                        importedRv.lastContacted.timestamp ||
                        new Date(
                          `${importedRv.lastContacted.date}T${
                            importedRv.lastContacted.time || "00:00"
                          }`
                        ).toISOString(),
                    },
                  ];
                } else {
                  importedRv.visits = [];
                }
              }
              // Ensure 'area' field exists and is not empty for imported RVs
              if (
                typeof importedRv.area === "undefined" ||
                importedRv.area === null ||
                importedRv.area.trim() === ""
              ) {
                importedRv.area = "No Area";
              }
              // Clean up old properties if they exist
              delete importedRv.lastContacted;
              delete importedRv.note;
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
 * Sorts the RVs based on the selected sort order, using the most recent visit.
 * @param {Array} rvsArray - The array of RVs to sort.
 * @param {string} sortOrder - 'oldest' or 'newest'.
 * @returns {Array} - The sorted array.
 */
function sortRVs(rvsArray, sortOrder) {
  // Filter out RVs without any visits for sorting purposes
  const rvsWithVisits = rvsArray.filter(
    (rv) => rv.visits && rv.visits.length > 0
  );
  const rvsWithoutVisits = rvsArray.filter(
    (rv) => !rv.visits || rv.visits.length === 0
  );

  rvsWithVisits.sort((a, b) => {
    // Get the timestamp of the most recent visit for each RV
    const dateA = new Date(a.visits[0].timestamp);
    const dateB = new Date(b.visits[0].timestamp);
    if (sortOrder === "oldest") {
      return dateA.getTime() - dateB.getTime();
    } else {
      return dateB.getTime() - dateA.getTime();
    }
  });

  // Combine sorted RVs with those without visits (place them at the end)
  return rvsWithVisits.concat(rvsWithoutVisits);
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

    const mostRecentVisit =
      rv.visits && rv.visits.length > 0 ? rv.visits[0] : null;

    if (!isGeolocated) {
      pinColor = "violet"; // Violet for non-geolocated
    } else if (mostRecentVisit) {
      const today = new Date();
      const visitDate = new Date(mostRecentVisit.date);
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

    const mostRecentVisit =
      rv.visits && rv.visits.length > 0 ? rv.visits[0] : null;
    const lastVisitedDate = mostRecentVisit?.date || "N/A";
    const daysSinceLastVisited = getDaysSince(lastVisitedDate);
    const isRedPin =
      !isNaN(parseInt(daysSinceLastVisited)) &&
      parseInt(daysSinceLastVisited) >= 14;

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
      <p class="last-visited-info ${
        isRedPin ? "red-text" : ""
      }">Days since last visited: ${daysSinceLastVisited}</p>
      ${
        rv.area && rv.area !== "No Area"
          ? `<div class="area-display">${rv.area}</div>`
          : ""
      } <!-- Conditionally display area, hide if "No Area" -->
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
    targetDiv = formAreaFilterCheckboxesDiv;
    filterAllId = "formFilterAllAreas";
    filterNoAreaId = "formFilterNoArea";
  } else {
    return;
  }

  // Get unique areas from current RVs (excluding "No Area" for dynamic generation)
  let uniqueAreas = [
    ...new Set(
      rvs.map((rv) => rv.area).filter((area) => area && area !== "No Area")
    ),
  ].sort(); // Sort alphabetically

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

  // Retrieve their last checked state from the DOM if they existed, otherwise default.
  const prevAllAreasChecked =
    document.getElementById(filterAllId)?.checked || true;
  const prevNoAreaChecked =
    document.getElementById(filterNoAreaId)?.checked || false;

  // Recreate "All Areas" and "No Area" first to ensure their order
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
 * Renders the visit entries in the RV form.
 * @param {Array} visits - The array of visit objects for the current RV.
 */
function renderVisitsInForm(visits) {
  rvVisitsContainer.innerHTML = ""; // Clear existing visits

  if (!visits || visits.length === 0) {
    // No visits to display
    return;
  }

  visits.forEach((visit, index) => {
    const visitEntryDiv = document.createElement("div");
    visitEntryDiv.className = "visit-entry";
    visitEntryDiv.dataset.index = index; // Store index for easy reference

    const formattedDay = getFormattedDay(visit.date);

    visitEntryDiv.innerHTML = `
      <div class="visit-entry-header">
        <input type="date" value="${
          visit.date || ""
        }" class="visit-date-input" />
        <input type="text" value="${formattedDay}" class="visit-day-input" readonly />
        <input type="time" value="${
          visit.time || ""
        }" class="visit-time-input" />
        <button class="remove-visit-btn icon-button" title="Remove Visit">
          -
        </button>
      </div>
      <textarea class="visit-note-input" rows="3" placeholder="Details of the visit, topic, etc.">${
        visit.note || ""
      }</textarea>
    `;
    rvVisitsContainer.appendChild(visitEntryDiv);

    // Add event listeners to the newly created inputs and buttons
    const dateInput = visitEntryDiv.querySelector(".visit-date-input");
    const dayInput = visitEntryDiv.querySelector(".visit-day-input");
    const timeInput = visitEntryDiv.querySelector(".visit-time-input");
    const noteInput = visitEntryDiv.querySelector(".visit-note-input");
    const removeBtn = visitEntryDiv.querySelector(".remove-visit-btn");

    dateInput.addEventListener("change", (e) => {
      dayInput.value = getFormattedDay(e.target.value);
      saveRV(); // Autosave on change
    });
    timeInput.addEventListener("change", saveRV);
    noteInput.addEventListener("blur", saveRV); // Use blur for note autosave
    removeBtn.addEventListener("click", () => removeVisit(index)); // Pass the index to remove
  });
}

/**
 * Clears the RV form fields.
 * @param {boolean} autofillDefaults - Whether to autofill default values (city, state, area, initial visit).
 */
function clearRVForm(autofillDefaults = false) {
  // Changed default to false
  rvNameInput.value = "";
  rvAddressInput.value = "";
  rvCityInput.value = "";
  rvStateInput.value = "";
  rvEmailInput.value = "";
  rvPhoneInput.value = "";
  rvAreaInput.value = "";
  rvLatitudeInput.value = "";
  rvLongitudeInput.value = "";
  currentRVId = null;
  currentRvIndex = -1; // Reset index for new RV

  rvVisitsContainer.innerHTML = ""; // Clear all existing visit entries

  if (autofillDefaults) {
    rvCityInput.value = settings.defaultCity || "";
    rvStateInput.value = settings.defaultState || "";
    rvAreaInput.value = "No Area";
    addVisit(true); // Add a new, empty visit entry with current date/time
  }

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
    rvAreaInput.value = rvToEdit.area || "No Area"; // Populate Area field
    rvLatitudeInput.value = rvToEdit.latitude || "";
    rvLongitudeInput.value = rvToEdit.longitude || "";

    // Render all visits for this RV
    renderVisitsInForm(rvToEdit.visits);

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
  let city = rvCityInput.value.trim(); // Use let for potential geocoded update
  let state = rvStateInput.value.trim(); // Use let for potential geocoded update
  let latitude = parseFloat(rvLatitudeInput.value); // Use let for potential geocoded update
  let longitude = parseFloat(rvLongitudeInput.value); // Use let for potential geocoded update
  const email = rvEmailInput.value.trim();
  const phone = rvPhoneInput.value.trim();
  const area = rvAreaInput.value.trim() || "No Area"; // Get Area

  // Collect all visit data from the dynamic fields
  const visits = [];
  document.querySelectorAll(".visit-entry").forEach((entryDiv) => {
    const date = entryDiv.querySelector(".visit-date-input").value;
    const time = entryDiv.querySelector(".visit-time-input").value;
    const note = entryDiv.querySelector(".visit-note-input").value;
    if (date) {
      // Only save visits that have a date
      visits.push({
        date: date,
        time: time,
        note: note,
        timestamp: new Date(`${date}T${time || "00:00"}`).toISOString(),
      });
    }
  });

  // Construct the new RV data object based on current form values
  const newRvData = {
    id: currentRVId || generateUniqueId(),
    name: name,
    address: address,
    city: city,
    state: state,
    area: area,
    email: email,
    phone: phone,
    latitude: isNaN(latitude) ? null : latitude,
    longitude: isNaN(longitude) ? null : longitude,
    visits: visits,
    createdAt: currentRVId
      ? rvs.find((rv) => rv.id === currentRVId)?.createdAt
      : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let oldRvData = null;
  if (currentRVId) {
    oldRvData = rvs.find((rv) => rv.id === currentRVId);
  }

  // Determine if there are actual changes to trigger a save/message
  let hasChanged = false;
  if (!oldRvData) {
    // If it's a new RV, it's always a change if a name is entered
    if (name) hasChanged = true;
  } else {
    // Compare basic fields
    for (const field of [
      "name",
      "address",
      "city",
      "state",
      "email",
      "phone",
      "area",
    ]) {
      if (newRvData[field] !== oldRvData[field]) {
        hasChanged = true;
        break;
      }
    }

    // Special handling for latitude and longitude comparison
    const oldLat = parseFloat(oldRvData.latitude);
    const oldLon = parseFloat(oldRvData.longitude);
    const newLat = parseFloat(newRvData.latitude);
    const newLon = parseFloat(newRvData.longitude);

    // Check if latitude has changed meaningfully
    if (
      isNaN(oldLat) !== isNaN(newLat) ||
      (!isNaN(oldLat) &&
        !isNaN(newLat) &&
        oldLat.toFixed(6) !== newLat.toFixed(6))
    ) {
      hasChanged = true;
    }
    // Check if longitude has changed meaningfully
    if (
      isNaN(oldLon) !== isNaN(newLon) ||
      (!isNaN(oldLon) &&
        !isNaN(newLon) &&
        oldLon.toFixed(6) !== newLon.toFixed(6))
    ) {
      hasChanged = true;
    }
    // Check visits separately (simple length/stringified comparison for now)
    if (JSON.stringify(newRvData.visits) !== JSON.stringify(oldRvData.visits)) {
      hasChanged = true;
    }
  }

  // --- Geocoding logic for RV addresses ---
  // Only attempt geocoding if latitude/longitude fields are currently empty/invalid
  // AND address/city/state are provided.
  // Also, only geocode if the address/city/state fields have changed or it's a new RV without coordinates.
  const addressChanged = oldRvData
    ? newRvData.address !== oldRvData.address ||
      newRvData.city !== oldRvData.city ||
      newRvData.state !== oldRvData.state
    : true;

  if (
    (isNaN(newRvData.latitude) || isNaN(newRvData.longitude)) &&
    (newRvData.address || newRvData.city || newRvData.state) &&
    addressChanged
  ) {
    let query = "";
    if (newRvData.address && newRvData.city && newRvData.state) {
      query = `${newRvData.address}, ${newRvData.city}, ${newRvData.state}`;
    } else if (newRvData.city && newRvData.state) {
      query = `${newRvData.city}, ${newRvData.state}`;
    }

    if (query) {
      console.log(`Attempting to geocode RV: ${query}`);
      const coords = await geocodeCityState(query);
      if (coords) {
        newRvData.latitude = coords.lat;
        newRvData.longitude = coords.lon;
        rvLatitudeInput.value = coords.lat.toFixed(6); // Update UI
        rvLongitudeInput.value = coords.lon.toFixed(6); // Update UI
        showMessage("RV location geocoded successfully!", "info");
        hasChanged = true; // Mark as changed if geocoding was successful
      } else {
        // If geocoding fails, explicitly set lat/lon to null to prevent incorrect default assignment
        newRvData.latitude = null;
        newRvData.longitude = null;
        rvLatitudeInput.value = "";
        rvLongitudeInput.value = "";
        showMessage(
          "Could not geocode RV address/city/state. Pin will be violet if default location is set.",
          "warning"
        );
        // Do NOT set hasChanged to true here, as it's a failure, not a data update.
      }
    }
  }

  // If name is empty, show confirmation dialog
  // This check is now only done when navigating away or adding a new visit
  // It's removed from the general blur listener.
  // The logic for this is now handled in showView and addVisit functions.

  if (hasChanged) {
    // Only save and show message if data actually changed
    if (currentRVId) {
      const index = rvs.findIndex((rv) => rv.id === currentRVId);
      if (index !== -1) {
        rvs[index] = newRvData;
        showMessage("RV Information updated automatically!", "success");
      }
    } else {
      rvs.push(newRvData);
      showMessage("RV Information added automatically!", "success");
      currentRVId = newRvData.id; // Set currentRVId for newly added RV
      // Find the index of the newly added RV in the *unfiltered* rvs array
      currentRvIndex = rvs.findIndex((rv) => rv.id === currentRVId);
    }

    saveDataToLocalStorage();
    renderRVs(); // Re-render the list
    updateMap(); // Update the map
    updateRvFormNavButtons(); // Update button states after saving
    generateAreaFilterCheckboxes("contact"); // Re-generate area filters in case a new area was added
    generateAreaFilterCheckboxes("map");
    generateAreaFilterCheckboxes("form");
  } else {
    console.log("No significant changes detected, not saving RV.");
  }
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
    // If the deleted RV was the current one being edited, clear the form
    if (currentRVId === rvId) {
      clearRVForm(); // Clear the form completely
      showView(myRVsView); // Navigate back to list view
    }
    generateAreaFilterCheckboxes("contact"); // Re-generate area filters in case an area was removed
    generateAreaFilterCheckboxes("map");
    generateAreaFilterCheckboxes("form");
  } else {
    showMessage("RV not found for deletion.", "error");
  }
}

/**
 * Adds a new visit entry (at the top/most recent).
 * @param {boolean} isInitialAdd - True if called during clearRVForm for initial entry.
 */
function addVisit(isInitialAdd = false) {
  const now = new Date();
  const dateString = now.toISOString().split("T")[0]; //YYYY-MM-DD
  const timeString = now.toTimeString().split(" ")[0].substring(0, 5); // HH:MM

  const newVisit = {
    date: dateString,
    time: timeString,
    note: "",
    timestamp: now.toISOString(),
  };

  // Check for empty name *before* adding visit if not an initial autofill
  if (!isInitialAdd && rvNameInput.value.trim() === "") {
    showConfirmationDialog(
      "No name has been entered for this contact. It cannot be easily identified without one. Do you want to proceed without saving this contact?",
      () => {
        // User chose to proceed without saving current (empty name) RV
        // Add the new visit to a *new* RV (which will be blank until name is entered)
        clearRVForm(false); // Clear current form, don't autofill
        // Now, add the new visit to this newly cleared form
        renderVisitsInForm([newVisit]);
        showMessage("New visit entry added to a new, unsaved contact.", "info");
      },
      () => {
        // User chose to cancel, do nothing, stay on current form
      }
    );
    return; // Stop further execution
  }

  // If adding to an existing RV, find it and add the visit
  if (currentRVId) {
    const rv = rvs.find((r) => r.id === currentRVId);
    if (rv) {
      if (!rv.visits) rv.visits = [];
      rv.visits.unshift(newVisit); // Add to the beginning for most recent
      renderVisitsInForm(rv.visits); // Re-render the visits section
      saveRV(); // Autosave after adding visit
      if (!isInitialAdd) showMessage("New visit entry added.", "info");
    }
  } else {
    // If it's a new RV being created (currentRVId is null),
    // and this is the initial autofill from clearRVForm(true)
    if (isInitialAdd) {
      renderVisitsInForm([newVisit]);
    } else {
      // This case should ideally not be hit if the name check above works.
      // But as a fallback, if currentRVId is null and it's not an initial add,
      // it means an "Add Visit" was clicked on a blank new form.
      // We'll treat it as creating a new RV with just this visit,
      // and the "no name" dialog would have already handled the saving part.
      // So, just render the visit.
      renderVisitsInForm([newVisit]);
      showMessage("New visit entry added to a new contact.", "info");
    }
  }
}

/**
 * Removes a specific visit entry by its index.
 * @param {number} indexToRemove - The index of the visit to remove in the current RV's visits array.
 */
function removeVisit(indexToRemove) {
  if (currentRVId) {
    const rv = rvs.find((r) => r.id === currentRVId);
    if (rv && rv.visits && rv.visits.length > 0) {
      // Ensure there are visits to remove
      showConfirmationDialog(
        "Are you sure you want to delete this visit entry?",
        () => {
          rv.visits.splice(indexToRemove, 1); // Remove the visit
          renderVisitsInForm(rv.visits); // Re-render the visits section
          saveRV(); // Autosave after removing visit
          showMessage("Visit entry deleted.", "success");
        }
      );
    } else {
      showMessage("No visit entry to delete.", "info");
    }
  } else {
    // If no current RV, and user tries to remove a visit from a new, unsaved form
    // just clear the displayed visits.
    rvVisitsContainer.innerHTML = "";
    showMessage("Visit entry cleared from new contact.", "info");
  }
}

/**
 * Geocoding Functions
 */

/**
 * Fetches coordinates for a given address/city/state using Nominatim (OpenStreetMap).
 * @param {string} query - The address, city, state, or combination to geocode.
 * @returns {Promise<{lat: number, lon: number}|null>} - Latitude and longitude or null if not found.
 */
async function geocodeCityState(query) {
  if (!query) {
    console.log("Geocoding: Query is empty.");
    showMessage("Geocoding failed: Query is empty.", "error"); // ADD THIS LINE
    return null;
  }
  const encodedQuery = encodeURIComponent(`${query}, USA`);
  const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1`;
  console.log("Geocoding URL:", url);
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log("Geocoding response data:", data);

    if (data && data.length > 0) {
      showMessage(`Geocoding successful for: ${query}`, "success"); // ADD THIS LINE
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    } else {
      showMessage(`Geocoding found no results for: ${query}`, "warning"); // ADD THIS LINE
    }
  } catch (error) {
    console.error("Error geocoding:", error);
    showMessage(`Geocoding network error: ${error.message}`, "error"); // ADD THIS LINE
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
    cityInput.value = ""; // Clear city/state inputs when updating from coords
    stateInput = defaultStateInput;
    stateInput.value = ""; // Clear city/state inputs when updating from coords
  } else {
    latInput = rvLatitudeInput;
    longInput = rvLongitudeInput;
    cityInput = rvCityInput;
    cityInput.value = ""; // Clear city/state inputs when updating from coords
    stateInput = rvStateInput;
    stateInput.value = ""; // Clear city/state inputs when updating from coords
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
    const result = await geocodeCityState(`${city}, ${state}`);
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
 * @returns {Promise<void>} A promise that resolves when the script is loaded.
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
  showMessage("Attempting to initialize map...", "info");
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
        const zoom = !isNaN(defaultLat) && !isNaN(defaultLng) ? 14 : 1;
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

  console.log("Map centering on:", defaultLat, defaultLng);

  // Only set center if valid coordinates exist in settings
  const center =
    !isNaN(defaultLat) && !isNaN(defaultLng)
      ? { lat: defaultLat, lng: defaultLng }
      : { lat: 0, lng: 0 }; // Default to 0,0 if no valid settings coords
  const zoom = !isNaN(defaultLat) && !isNaN(defaultLng) ? 14 : 1; // Zoom out if no specific location

  // --- ADDED/MODIFIED LINES FOR DEBUGGING ---
  showMessage(
    `Google Map Init - Settings Lat: ${settings.defaultLatitude}, Lng: ${settings.defaultLongitude}`,
    "info"
  );
  showMessage(
    `Google Map Init - Parsed Lat: ${defaultLat}, Lng: ${defaultLng}`,
    "info"
  );
  showMessage(
    `Google Map Init - Final Center: ${center.lat}, ${center.lng}`,
    "info"
  ); // Note .lat, .lng for Google Maps
  showMessage(`Google Map Init - Final Zoom: ${zoom}`, "info");
  // --- END DEBUGGING LINES ---

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

  console.log("Map centering on:", defaultLat, defaultLng);

  const center =
    !isNaN(defaultLat) && !isNaN(defaultLng)
      ? [defaultLat, defaultLng]
      : [0, 0]; // Default to 0,0 if no valid settings coords
  const zoom = !isNaN(defaultLat) && !isNaN(defaultLng) ? 14 : 1; // Zoom out if no specific location

  // --- ADDED/MODIFIED LINES FOR DEBUGGING ---
  showMessage(
    `Leaflet Map Init - Settings Lat: ${settings.defaultLatitude}, Lng: ${settings.defaultLongitude}`,
    "info"
  );
  showMessage(
    `Leaflet Map Init - Parsed Lat: ${defaultLat}, Lng: ${defaultLng}`,
    "info"
  );
  showMessage(
    `Leaflet Map Init - Final Center: ${center[0]}, ${center[1]}`,
    "info"
  );
  showMessage(`Leaflet Map Init - Final Zoom: ${zoom}`, "info");
  // --- END DEBUGGING LINES ---

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

  // Get filtered RVs for map display
  const rvsToDisplayOnMap = getFilteredAndSortedRVs();

  rvsToDisplayOnMap.forEach((rv) => {
    let lat = parseFloat(rv.latitude);
    let lon = parseFloat(rv.longitude);
    let isGeolocated = !isNaN(lat) && !isNaN(lon);

    let pinColor = "blue"; // Default Blue for geolocated pins
    let markerLat = lat;
    let markerLon = lon;
    let markerTitle = rv.name || rv.address || "Unnamed RV";

    const mostRecentVisit =
      rv.visits && rv.visits.length > 0 ? rv.visits[0] : null;

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
    } else if (mostRecentVisit) {
      // Only check for red pin if geolocated and has visits
      // Check for red pin condition (14+ days ago)
      const today = new Date();
      const visitDate = new Date(mostRecentVisit.date);
      today.setHours(0, 0, 0, 0);
      visitDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (today.getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (!isNaN(diffDays) && diffDays >= 14) {
        pinColor = "red"; // Red for 14+ days ago
      }
    }

    // Apply color filter logic (already handled by getFilteredAndSortedRVs, but double-check for robustness)
    const selectedColorFilters = Array.from(
      document.querySelectorAll(
        `#mapShowColorFilterCheckboxes input[type="checkbox"]:checked`
      )
    ).map((cb) => cb.value);

    if (
      selectedColorFilters.length > 0 &&
      selectedColorFilters.length < 3 &&
      !selectedColorFilters.includes(pinColor)
    ) {
      return; // Skip this RV if its color doesn't match selected filters
    }

    const coordKey = `${markerLat},${markerLon}`;
    if (usedCoords[coordKey]) {
      // Offset duplicate coordinates slightly
      const offset = 0.0001 * usedCoords[coordKey];
      markerLat += offset;
      markerLon += offset;
    }
    usedCoords[coordKey] = (usedCoords[coordKey] || 0) + 1;

    // Build common info window/popup content
    const commonContent = `
      <div style="padding: 5px; font-family: Arial, sans-serif;">
        <h4 style="margin-top: 0; margin-bottom: 5px; color: #333;">${
          rv.name || "Unnamed RV"
        }</h4>
        <p style="margin-bottom: 3px;">${rv.address || ""}${
      rv.address && (rv.city || rv.state) ? ", " : ""
    }${rv.city || ""}${rv.city && rv.state ? ", " : ""}${rv.state || ""}</p>
        ${
          isGeolocated
            ? `<p style="font-size: 0.8em; color: #666;">Lat: ${lat.toFixed(
                5
              )}, Lon: ${lon.toFixed(5)}</p>`
            : ""
        }
      </div>
    `;

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

      const infoWindow = new google.maps.InfoWindow({
        content: commonContent, // Use commonContent
      });

      // Add mouseover and mouseout listeners for info window
      marker.addListener("mouseover", () => infoWindow.open(activeMap, marker));
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

      // Bind popup and open/close on mouseover/mouseout
      marker.bindPopup(commonContent, {
        // Use commonContent
        closeButton: false, // Don't show a close button
        autoClose: false, // Don't auto-close on map click
      });

      marker.on("mouseover", function () {
        this.openPopup();
      });
      marker.on("mouseout", function () {
        this.closePopup();
      });
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
    document.getElementById("rvNavHeaderBtns").style.display = "none";
    areaFilterCheckboxesId = "areaFilterCheckboxes";
    colorFilterCheckboxesId = "mapShowColorFilterCheckboxes"; // My RVs view doesn't have color filter, but map does
    sortOrderRadioName = "sortOrder";
  } else if (rvFormView.style.display === "block") {
    document.getElementById("rvNavHeaderBtns").style.display = "flex";
    areaFilterCheckboxesId = "formAreaFilterCheckboxes";
    // Removed color filter from form view, so use an empty array for filtering
    colorFilterCheckboxesId = "mapShowColorFilterCheckboxes"; // Fallback to map's color filter for consistency in filterRVs
    sortOrderRadioName = "formSortOrder";
  } else if (mapView.style.display === "block") {
    document.getElementById("rvNavHeaderBtns").style.display = "none";
    areaFilterCheckboxesId = "mapAreaFilterCheckboxes";
    colorFilterCheckboxesId = "mapShowColorFilterCheckboxes";
    sortOrderRadioName = "sortOrder"; // Map view uses the main list's sort order
  } else {
    // Default to main filters if no specific view is active or recognized
    areaFilterCheckboxesId = "areaFilterCheckboxes";
    colorFilterCheckboxesId = "mapShowColorFilterCheckboxes";
    sortOrderRadioName = "sortOrder";
  }

  // Get selected area filters
  const selectedAreaFilters = Array.from(
    document.querySelectorAll(
      `#${areaFilterCheckboxesId} input[type="checkbox"]:checked`
    )
  ).map((cb) => cb.value);

  // Get selected color filters (only applicable for map and form views)
  let selectedColorFilters = [];
  if (document.getElementById(colorFilterCheckboxesId)) {
    // Check if the element exists
    selectedColorFilters = Array.from(
      document.querySelectorAll(
        `#${colorFilterCheckboxesId} input[type="checkbox"]:checked`
      )
    ).map((cb) => cb.value);
  }

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
  // Ensure buttons are visible in RV form view
  prevRvBtn.style.display = "flex";
  nextRvBtn.style.display = "flex";
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
    updateCityStateFromCoordinates("default")
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
    // If settings are incomplete, show warning, otherwise proceed to add RV
    if (!areSettingsComplete()) {
      showConfirmationDialog(
        "Before adding a new RV, please complete your default City/State or Coordinates in Settings. Do you want to proceed to Settings?",
        () => {
          showView(settingsView);
        },
        () => {
          // User chose to go back, stay on current view
        }
      );
    } else {
      clearRVForm(false); // Do not autofill immediately
      showView(rvFormView);
    }
  });

  // RV Form Autofill on Name Entry:
  rvNameInput.addEventListener("input", () => {
    // Only autofill if it's a new RV (currentRVId is null) and the form is currently empty
    if (!currentRVId && rvNameInput.value.trim().length === 1) {
      // Trigger on first character
      clearRVForm(true); // Now autofill with defaults and initial visit
    }
  });

  // RV Form Autosave: Add blur listeners to all relevant inputs for autosave
  document
    .querySelectorAll("#rvFormView input:not([readonly]), #rvFormView textarea") // Exclude readonly inputs
    .forEach((input) => {
      input.addEventListener("blur", saveRV);
    });

  // Phone number auto-formatting
  rvPhoneInput.addEventListener("input", (e) => {
    e.target.value = formatPhoneNumber(e.target.value);
  });

  // Area input autosave
  rvAreaInput.addEventListener("blur", saveRV);

  addVisitBtnHeader.addEventListener("click", () => addVisit()); // Add new visit

  // Previous/Next RV navigation buttons
  prevRvBtn.addEventListener("click", showPreviousRv);
  nextRvBtn.addEventListener("click", showNextRv);

  // Sort and Filter Event Listeners (for all relevant views)
  // Main RV list sort
  document
    .querySelectorAll('#myRVsView .sort-options input[type="radio"]')
    .forEach((radio) => {
      radio.addEventListener("change", handleSortFilterChange);
    });
  // RV Form view sort
  document
    .querySelectorAll('#rvFormView .sort-options input[type="radio"]')
    .forEach((radio) => {
      radio.addEventListener("change", handleSortFilterChange);
    });

  // Main RV list area filter to force commit
  document
    .querySelectorAll('#myRVsView .filter-options input[type="checkbox"]')
    .forEach((checkbox) => {
      checkbox.addEventListener("change", handleFilterChange);
    });
  // Map view filters (color and area)
  document
    .querySelectorAll('#mapView .filter-options input[type="checkbox"]')
    .forEach((checkbox) => {
      checkbox.addEventListener("change", handleFilterChange);
    });
  // RV Form view filters (color and area)
  document
    .querySelectorAll('#rvFormView .filter-options input[type="checkbox"]')
    .forEach((checkbox) => {
      checkbox.addEventListener("change", handleFilterChange);
    });

  // Initial generation of Area filters for all views
  generateAreaFilterCheckboxes("contact");
  generateAreaFilterCheckboxes("map");
  generateAreaFilterCheckboxes("form");
});
