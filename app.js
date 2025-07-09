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

const rvListContainer = document.querySelector(".rv-list");
const sortOldNewRadio = document.getElementById("sortOldNew");
const sortNewOldRadio = document.getElementById("sortNewOld");
const filterAllAreasCheckbox = document.getElementById("filterAllAreas");
const filterNoAreaCheckbox = document.getElementById("filterNoArea");
const areaFilterCheckboxesDiv = document.getElementById("areaFilterCheckboxes");
const mapAreaFilterCheckboxesDiv = document.getElementById(
  "mapAreaFilterCheckboxes"
);

let currentRVId = null; // To store the ID of the RV being edited
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
  confirmButton.textContent = "Confirm";
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
  cancelButton.textContent = "Cancel";
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
 * Calculates days since a given date.
 * @param {string} dateString - The date string (YYYY-MM-DD).
 * @returns {number|string} - Number of days ago, "Today", "Yesterday", or "N/A".
 */
function getDaysSince(dateString) {
  if (!dateString) return "N/A";
  const today = new Date();
  const visitDate = new Date(dateString);
  today.setHours(0, 0, 0, 0); // Normalize to start of day
  visitDate.setHours(0, 0, 0, 0); // Normalize to start of day

  const diffTime = today.getTime() - visitDate.getTime(); // Calculate difference in milliseconds
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

  if (viewToShow === settingsView) {
    appSubheading.textContent = "Settings";
    addRVBtn.style.display = "none"; // Hide add button in settings view
    settingsBtn.classList.add("active"); // Add active class to settings button
  } else if (viewToShow === myRVsView) {
    appSubheading.textContent = "Contact Info";
    addRVBtn.style.display = "flex"; // Show add button in contacts view
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
    addRVBtn.style.display = "none"; // Hide add button in RV form view
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
 * Filters the RVs based on selected area checkboxes.
 * @param {Array} rvsArray - The array of RVs to filter.
 * @param {Array} selectedAreas - An array of selected area names (e.g., ['No Area', 'North District']).
 * @returns {Array} - The filtered array.
 */
function filterRVs(rvsArray, selectedAreas) {
  if (selectedAreas.includes("all")) {
    return rvsArray;
  }
  if (selectedAreas.length === 0) {
    if (
      document.getElementById("filterNoArea") &&
      document.getElementById("filterNoArea").checked
    ) {
      return rvsArray.filter((rv) => (rv.area || "No Area") === "No Area");
    }
    return [];
  }

  return rvsArray.filter((rv) => selectedAreas.includes(rv.area || "No Area"));
}

/**
 * Renders the list of RVs in the myRVsView, applying sorting and filtering.
 */
function renderRVs() {
  let rvsToDisplay = [...rvs]; // Create a copy to avoid modifying original array

  // 1. Apply Filtering
  const selectedFilterAreas = Array.from(
    document.querySelectorAll(
      '#areaFilterCheckboxes input[type="checkbox"]:checked'
    )
  ).map((cb) => cb.value);

  if (filterAllAreasCheckbox.checked) {
    rvsToDisplay = rvs;
  } else if (selectedFilterAreas.length > 0) {
    rvsToDisplay = filterRVs(rvs, selectedFilterAreas);
  } else {
    if (filterNoAreaCheckbox.checked) {
      rvsToDisplay = rvs.filter((rv) => (rv.area || "No Area") === "No Area");
    } else {
      rvsToDisplay = [];
    }
  }

  // 2. Apply Sorting
  const selectedSortOrder =
    document.querySelector('.sort-options input[name="sortOrder"]:checked')
      ?.value || "oldest"; // Default to 'oldest' if no radio is checked
  rvsToDisplay = sortRVs(rvsToDisplay, selectedSortOrder);

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
 * @param {'contact'|'map'} viewType - Indicates which view's filter checkboxes to generate.
 */
function generateAreaFilterCheckboxes(viewType) {
  // Since the 'Area' input is removed, we only need 'All Areas' and 'No Area' filters.
  let targetDiv, filterAllId, filterNoAreaId;

  if (viewType === "contact") {
    targetDiv = areaFilterCheckboxesDiv;
    filterAllId = "filterAllAreas";
    filterNoAreaId = "filterNoArea";
  } else if (viewType === "map") {
    targetDiv = mapAreaFilterCheckboxesDiv;
    filterAllId = "mapFilterAllAreas";
    filterNoAreaId = "mapFilterNoArea";
  } else {
    return;
  }

  // Store current checked state of the permanent checkboxes
  const currentAllChecked =
    targetDiv.querySelector(`#${filterAllId}`)?.checked || true;
  const currentNoAreaChecked =
    targetDiv.querySelector(`#${filterNoAreaId}`)?.checked || false;

  // Clear all existing children except the permanent checkboxes
  Array.from(targetDiv.children).forEach((child) => {
    if (
      child.id !== filterAllId &&
      child.id !== filterNoAreaId &&
      child.htmlFor !== filterAllId &&
      child.htmlFor !== filterNoAreaId
    ) {
      child.remove();
    }
  });

  // Ensure permanent checkboxes exist and are in the correct order
  const recreateCheckbox = (id, value, text, checked) => {
    let checkbox = targetDiv.querySelector(`#${id}`);
    let label = targetDiv.querySelector(`label[for="${id}"]`);

    if (!checkbox) {
      checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = id;
      checkbox.value = value;
      targetDiv.appendChild(checkbox);
    }
    if (!label) {
      label = document.createElement("label");
      label.htmlFor = id;
      targetDiv.appendChild(label);
    }
    checkbox.checked = checked;
    label.textContent = text;
    return { checkbox, label };
  };

  const allCb = recreateCheckbox(
    filterAllId,
    "all",
    "All Areas",
    currentAllChecked
  );
  const noAreaCb = recreateCheckbox(
    filterNoAreaId,
    "No Area",
    "No Area",
    currentNoAreaChecked
  );

  if (targetDiv.firstChild !== allCb.checkbox) {
    targetDiv.prepend(allCb.label);
    targetDiv.prepend(allCb.checkbox);
  }
  if (
    allCb.checkbox.nextSibling !== noAreaCb.checkbox &&
    allCb.label.nextSibling !== noAreaCb.checkbox
  ) {
    const insertAfter = allCb.label;
    if (insertAfter) {
      insertAfter.after(noAreaCb.label);
      insertAfter.after(noAreaCb.checkbox);
    }
  }

  // Re-attach event listeners to all checkboxes
  targetDiv.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.removeEventListener("change", handleFilterChange);
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
  const filterAllAreasCheckboxInGroup =
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
      if (filterAllAreasCheckboxInGroup) {
        filterAllAreasCheckboxInGroup.checked = false;
      }
    } else {
      const anyOtherChecked = allCheckboxesInGroup.some(
        (cb) => cb.checked && cb.value !== "all"
      );
      if (!anyOtherChecked) {
        if (filterAllAreasCheckboxInGroup) {
          filterAllAreasCheckboxInGroup.checked = true;
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
 * Clears the RV form fields.
 */
function clearRVForm() {
  rvNameInput.value = "";
  rvAddressInput.value = "";
  rvCityInput.value = "";
  rvStateInput.value = "";
  // No rvAreaInput to set
  rvEmailInput.value = "";
  rvLatitudeInput.value = "";
  rvLongitudeInput.value = "";
  rvLastContactedDateInput.value = "";
  rvLastContactedDayInput.value = "";
  rvLastContactedTimeInput.value = "";
  rvNoteInput.value = "";
  currentRVId = null;
  if (removeVisitBtnForm) removeVisitBtnForm.style.display = "none";
  // formHasUnsavedChanges is no longer needed
}

/**
 * Populates the RV form fields for editing an existing RV.
 * @param {string} rvId - The ID of the RV to edit.
 */
function editRV(rvId) {
  const rvToEdit = rvs.find((rv) => rv.id === rvId);

  if (rvToEdit) {
    currentRVId = rvId;

    rvNameInput.value = rvToEdit.name || "";
    rvAddressInput.value = rvToEdit.address || "";
    rvCityInput.value = rvToEdit.city || "";
    rvStateInput.value = rvToEdit.state || "";
    // No rvAreaInput to populate
    rvEmailInput.value = rvToEdit.email || "";
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
    // formHasUnsavedChanges is no longer needed
  } else {
    showMessage("RV not found.", "error");
    console.error("No such RV with ID:", rvId);
  }
}

/**
 * Saves a new or updates an existing Return Visit to local storage.
 */
function saveRV() {
  const name = rvNameInput.value.trim();
  const address = rvAddressInput.value.trim();
  const city = rvCityInput.value.trim();
  const state = rvStateInput.value.trim();
  // Area field removed, will always be "No Area"
  const email = rvEmailInput.value.trim();
  const latitude = parseFloat(rvLatitudeInput.value);
  const longitude = parseFloat(rvLongitudeInput.value);
  const lastContactedDate = rvLastContactedDateInput.value;
  const lastContactedTime = rvLastContactedTimeInput.value;
  const note = rvNoteInput.value.trim();

  // Basic validation
  if (!name && !address) {
    // Only show warning, don't prevent saving if other fields are valid
    // This allows partial entries to be saved if user leaves a field
    // but still highlights missing key info.
    showMessage(
      "Please enter at least a Name or Address for the Return Visit.",
      "warning"
    );
  }

  const rvData = {
    id: currentRVId || generateUniqueId(),
    name: name,
    address: address,
    city: city,
    state: state,
    area: "No Area", // Always "No Area"
    email: email,
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
      showMessage("RV Information updated successfully!", "success");
    }
  } else {
    rvs.push(rvData);
    showMessage("RV Information added successfully!", "success");
  }

  saveDataToLocalStorage();
  renderRVs(); // Re-render the list
  updateMap(); // Update the map
  // clearRVForm(); // No longer clearing the form automatically
  // showView(myRVsView); // No longer navigating back automatically
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

// --- Geocoding/Reverse Geocoding Functions ---

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
    markers.forEach((marker) => leafletMap.removeLayer(marker));
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

    let pinColor = "#2196F3"; // Default Blue
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
        pinColor = "#673AB7"; // Violet for non-geolocated
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
        pinColor = "#f44336"; // Red for 14+ days ago
      }
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
        map: map,
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

      marker.addListener("mouseover", () => infoWindow.open(map, marker));
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
      }).addTo(leafletMap);

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
      } else {
        // If only non-geolocated pins were added (e.g., all violet)
        // and no valid default coordinates, map will stay at its initial center/zoom
      }
    } else {
      // Leaflet
      if (bounds.isValid()) {
        leafletMap.fitBounds(bounds);
      } else {
        // If only non-geolocated pins were added
        // and no valid default coordinates, map will stay at its initial center/zoom
      }
    }
  } else {
    // If no pins at all, map will stay at its initial center/zoom
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
    clearRVForm();
    showView(rvFormView);
  });

  // RV Form Autosave: Add blur listeners to all relevant inputs for autosave
  document
    .querySelectorAll("#rvFormView input, #rvFormView textarea")
    .forEach((input) => {
      input.addEventListener("blur", saveRV);
    });

  addVisitBtnForm.addEventListener("click", addVisit);
  removeVisitBtnForm.addEventListener("click", removeVisit);

  // Sort and Filter Event Listeners
  if (sortOldNewRadio) {
    sortOldNewRadio.addEventListener("change", handleSortFilterChange);
  }
  if (sortNewOldRadio) {
    sortNewOldRadio.addEventListener("change", handleSortFilterChange);
  }
  if (filterAllAreasCheckbox) {
    filterAllAreasCheckbox.addEventListener("change", handleFilterChange);
  }
  if (filterNoAreaCheckbox) {
    filterNoAreaCheckbox.addEventListener("change", handleFilterChange);
  }
  generateAreaFilterCheckboxes("contact");
});
