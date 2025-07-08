// app.js

// --- Global Variables ---
// No Firebase instances needed for local storage
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
const addRVBtn = document.getElementById("addRVBtn"); // Now in main header
const saveRvBtn = document.getElementById("saveRvBtn");
const cancelRvBtn = document.getElementById("cancelRvBtn");

// Settings View Elements
const defaultCityInput = document.getElementById("defaultCity");
const defaultStateInput = document.getElementById("defaultState");
const defaultAreaInput = document.getElementById("defaultArea");
const defaultLatitudeInput = document.getElementById("defaultLatitude");
const defaultLongitudeInput = document.getElementById("defaultLongitude");
const useCurrentLocationBtn = document.getElementById("useCurrentLocationBtn");
const exportDataBtn = document.getElementById("exportDataBtn");
const importDataBtn = document.getElementById("importDataBtn");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const cancelSettingsBtn = document.getElementById("cancelSettingsBtn");
const googleMapsApiKeyInput = document.getElementById("googleMapsApiKey"); // Google Maps API Key input

// RV Form View Elements
const rvNameInput = document.getElementById("rvName");
const rvAddressInput = document.getElementById("rvAddress");
const rvCityInput = document.getElementById("rvCity");
const rvStateInput = document.getElementById("rvState");
const rvAreaInput = document.getElementById("rvArea");
const rvEmailInput = document.getElementById("rvEmail");
const rvLatitudeInput = document.getElementById("rvLatitude");
const rvLongitudeInput = document.getElementById("rvLongitude");
const rvUseCurrentLocationBtn = document.getElementById(
  "rvUseCurrentLocationBtn"
);
const rvLastContactedDateInput = document.getElementById("rvLastContactedDate");
const rvLastContactedDayInput = document.getElementById("rvLastContactedDay");
const rvLastContactedTimeInput = document.getElementById("rvLastContactedTime");
const addVisitBtnForm = document.querySelector("#rvFormView .add-visit-btn"); // Renamed to avoid conflict
const removeVisitBtnForm = document.querySelector(
  "#rvFormView .remove-visit-btn"
); // Renamed to avoid conflict
const rvNoteInput = document.getElementById("rvNote");

const rvListContainer = document.querySelector(".rv-list"); // Container for RV cards
const sortOldNewRadio = document.getElementById("sortOldNew");
const sortNewOldRadio = document.getElementById("sortNewOld");
const filterAllAreasCheckbox = document.getElementById("filterAllAreas");
const filterNoAreaCheckbox = document.getElementById("filterNoArea");
const areaFilterCheckboxesDiv = document.getElementById("areaFilterCheckboxes");
const mapAreaFilterCheckboxesDiv = document.getElementById(
  "mapAreaFilterCheckboxes"
); // New: Map filter checkboxes div

let currentRVId = null; // To store the ID of the RV being edited
let mapInitialized = false; // Flag to prevent multiple map initializations
let formHasUnsavedChanges = false;

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
  // The CSS for .message-box should handle position, z-index, opacity, and transition
  // The inline styles here are a fallback/reinforcement
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
 * Shows a specific view section and updates header/footer visual states.
 * @param {HTMLElement} viewToShow - The view element to display.
 */
function showView(viewToShow) {
  hideAllViews();
  viewToShow.style.display = "block";

  // Update subheading in the main header
  const appSubheading = document.getElementById("appSubheading");
  if (viewToShow === settingsView) {
    appSubheading.textContent = "Settings";
    addRVBtn.style.display = "none"; // Hide add button in settings view
  } else if (viewToShow === myRVsView) {
    appSubheading.textContent = "Contact Info";
    addRVBtn.style.display = "flex"; // Show add button in contacts view
    generateAreaFilterCheckboxes("contact"); // Regenerate filter options for contacts view
  } else if (viewToShow === mapView) {
    appSubheading.textContent = "Map";
    addRVBtn.style.display = "none"; // Hide add button in map view
    loadDataFromLocalStorage(); // Ensure settings are fresh before initializing map
    initMap(); // Initialize map when map view is shown
    generateAreaFilterCheckboxes("map"); // Regenerate filter options for map view
  } else if (viewToShow === rvFormView) {
    appSubheading.textContent = "RV Information"; // Set subheading for RV form view
    addRVBtn.style.display = "fles"; // Hide add button in RV form view
  }

  // Update footer active state
  document.querySelectorAll(".app-footer a").forEach((link) => {
    link.classList.remove("active");
  });
  if (viewToShow === myRVsView) {
    myRVsLink.classList.add("active");
  } else if (viewToShow === mapView) {
    mapLink.classList.add("active");
  }
  // settingsBtn visibility is handled above based on view
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
  defaultAreaInput.value = settings.defaultArea || "";
  defaultLatitudeInput.value = settings.defaultLatitude || "";
  defaultLongitudeInput.value = settings.defaultLongitude || "";
  googleMapsApiKeyInput.value = settings.googleMapsApiKey || ""; // Populate API key field
}

/**
 * Saves settings to local storage.
 */
async function saveSettings() {
  // Made async to await geocoding
  const defaultCity = defaultCityInput.value.trim();
  const defaultState = defaultStateInput.value.trim();
  const defaultArea = defaultAreaInput.value.trim();
  let defaultLatitude = parseFloat(defaultLatitudeInput.value);
  let defaultLongitude = parseFloat(defaultLongitudeInput.value);
  const googleMapsApiKey = googleMapsApiKeyInput.value.trim(); // Get API key value

  // If City/State are provided but Lat/Long are not, try to geocode
  if (
    defaultCity &&
    defaultState &&
    (isNaN(defaultLatitude) || isNaN(defaultLongitude))
  ) {
    const coords = await geocodeCityState(defaultCity, defaultState);
    if (coords) {
      defaultLatitude = coords.lat;
      defaultLongitude = coords.lon;
      defaultLatitudeInput.value = coords.lat.toFixed(6); // Update UI
      defaultLongitudeInput.value = coords.lon.toFixed(6); // Update UI
    } else {
      showMessage(
        "Could not find coordinates for the entered City and State. Please enter valid location or coordinates.",
        "warning"
      );
      return; // Prevent saving if geocoding fails and no manual coordinates
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
    return;
  }

  settings = {
    defaultCity: defaultCity,
    defaultState: defaultState,
    defaultArea: defaultArea,
    defaultLatitude: isNaN(defaultLatitude) ? null : defaultLatitude,
    defaultLongitude: isNaN(defaultLongitude) ? null : defaultLongitude,
    googleMapsApiKey: googleMapsApiKey, // Save the API key
    lastUpdated: new Date().toISOString(),
  };

  saveDataToLocalStorage();
  showMessage("Settings saved successfully!", "success");
  // If API key changed, force map re-initialization on next map view
  mapInitialized = false;
  showView(myRVsView); // Navigate back to RV list after saving
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
        // Made async to await reverse geocoding
        latInput.value = position.coords.latitude.toFixed(6);
        longInput.value = position.coords.longitude.toFixed(6);
        showMessage("Location retrieved successfully!", "success");
        // Also update city/state if this is the default settings form
        if (latInput === defaultLatitudeInput) {
          await updateCityStateFromCoordinates("default");
        } else if (latInput === rvLatitudeInput) {
          await updateCityStateFromCoordinates("rv");
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
            rvs = importedData.rvs;
            renderRVs(rvs); // Update UI
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
      // newest
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
    return rvsArray; // If 'All Areas' is checked, return all RVs
  }
  if (selectedAreas.length === 0) {
    // If no specific area is selected and 'All Areas' is not
    // This scenario should be handled by handleFilterChange to ensure 'No Area' is selected if nothing else is.
    // If it still happens, it means no areas are filtered, so return everything if 'No Area' was explicitly selected.
    if (document.getElementById("filterNoArea").checked) {
      // Only return No Area if explicitly checked
      return rvsArray.filter((rv) => (rv.area || "No Area") === "No Area");
    }
    return []; // If nothing is explicitly filtered, show nothing.
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
    document.querySelectorAll('.filter-options input[type="checkbox"]:checked')
  ).map((cb) => cb.value);

  // Adjust logic for 'All Areas' checkbox
  if (filterAllAreasCheckbox.checked) {
    rvsToDisplay = rvs; // Show all if 'All Areas' is selected
  } else if (selectedFilterAreas.length > 0) {
    rvsToDisplay = filterRVs(rvs, selectedFilterAreas);
  } else {
    // If 'All Areas' is not checked and no other filter is selected
    // This case indicates user intends to see no results or only 'No Area' if selected.
    // handleFilterChange already ensures filterNoAreaCheckbox is checked if nothing else.
    if (filterNoAreaCheckbox.checked) {
      rvsToDisplay = rvs.filter((rv) => (rv.area || "No Area") === "No Area");
    } else {
      rvsToDisplay = []; // No filters selected, no results
    }
  }

  // 2. Apply Sorting
  const selectedSortOrder = document.querySelector(
    '.sort-options input[name="sortOrder"]:checked'
  ).value;
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

    // Determine display name
    const displayName = rv.name || rv.address || "Unnamed RV";

    // Get last visited date for display and calculate days since
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
            <p>${rv.city || ""}, ${rv.state || ""}</p>
            <p class="last-visited-info">Days since last visited: ${daysSinceLastVisited}</p>
            <div class="area-display">${rv.area || "No Area"}</div>
        `;
    rvListContainer.appendChild(rvCard);

    // Add event listener to the card itself for editing
    rvCard.addEventListener("click", (event) => {
      // Prevent clicking on the delete button from also triggering edit
      if (!event.target.closest(".delete-rv-btn")) {
        editRV(rv.id);
      }
    });
  });

  // Add event listeners to newly rendered delete buttons
  document.querySelectorAll(".delete-rv-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
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
  const uniqueAreas = new Set(rvs.map((rv) => rv.area || "No Area"));
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
    return; // Invalid viewType
  }

  const currentCheckedAreas = Array.from(
    targetDiv.querySelectorAll('input[type="checkbox"]:checked')
  ).map((cb) => cb.value);

  // Clear existing dynamic checkboxes, but keep permanent ones
  Array.from(targetDiv.children).forEach((child) => {
    if (
      child.tagName === "INPUT" &&
      child.id !== filterAllId &&
      child.id !== filterNoAreaId
    ) {
      child.remove();
    } else if (
      child.tagName === "LABEL" &&
      child.htmlFor !== filterAllId &&
      child.htmlFor !== filterNoAreaId
    ) {
      child.remove();
    }
  });

  uniqueAreas.forEach((area) => {
    if (area !== "No Area") {
      // 'No Area' is already a permanent checkbox
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `${viewType}FilterArea${area.replace(/\s+/g, "")}`;
      checkbox.value = area;
      checkbox.checked = currentCheckedAreas.includes(area); // Maintain checked state

      const label = document.createElement("label");
      label.htmlFor = checkbox.id;
      label.textContent = area;

      targetDiv.appendChild(checkbox);
      targetDiv.appendChild(label);
    }
  });

  // Re-attach event listeners to all checkboxes
  targetDiv.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.removeEventListener("change", handleFilterChange); // Remove old listener
    checkbox.addEventListener("change", handleFilterChange); // Add new listener
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
    // If 'All Areas' is checked/unchecked
    allCheckboxesInGroup.forEach((cb) => {
      if (cb.value !== "all") {
        cb.checked = false; // Uncheck all others
      }
    });
    if (!changedCheckbox.checked) {
      // If 'All Areas' is unchecked, and no other is explicitly checked, check 'No Area'
      const anyOtherChecked = allCheckboxesInGroup.some(
        (cb) => cb.checked && cb.value !== "all"
      );
      if (!anyOtherChecked && filterNoAreaCheckboxInGroup) {
        filterNoAreaCheckboxInGroup.checked = true;
      }
    }
  } else {
    // If any specific area checkbox is checked/unchecked
    if (changedCheckbox.checked) {
      if (filterAllAreasCheckboxInGroup) {
        filterAllAreasCheckboxInGroup.checked = false; // Uncheck 'All Areas'
      }
    } else {
      // If a specific area is unchecked, and no other is checked (including dynamic ones), check 'All Areas'
      const anyOtherChecked = allCheckboxesInGroup.some(
        (cb) => cb.checked && cb.value !== "all"
      );
      if (!anyOtherChecked) {
        filterAllAreasCheckboxInGroup.checked = true;
      }
    }
  }
  renderRVs(); // Re-render with new filters
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
  rvAreaInput.value = settings.defaultArea || "No Area"; // Set default area on new form
  rvEmailInput.value = "";
  rvLatitudeInput.value = "";
  rvLongitudeInput.value = "";
  rvLastContactedDateInput.value = "";
  const formInputs = document.querySelectorAll(
    "#rvFormView input, #rvFormView textarea"
  );
  formInputs.forEach((input) => {
    input.addEventListener("input", () => {
      formHasUnsavedChanges = true;
    });
  });
  rvLastContactedDayInput.value = "";
  rvLastContactedTimeInput.value = "";
  rvNoteInput.value = "";
  currentRVId = null; // Clear current RV ID
  // Removed the line that attempts to set textContent of h2
  if (removeVisitBtnForm) removeVisitBtnForm.style.display = "none"; // Check if element exists before accessing
}

/**
 * Populates the RV form fields for editing an existing RV.
 * @param {string} rvId - The ID of the RV to edit.
 */
function editRV(rvId) {
  const rvToEdit = rvs.find((rv) => rv.id === rvId);

  if (rvToEdit) {
    currentRVId = rvId; // Set the current RV ID for saving
    // Removed the line that attempts to set textContent of h2

    rvNameInput.value = rvToEdit.name || "";
    rvAddressInput.value = rvToEdit.address || "";
    rvCityInput.value = rvToEdit.city || "";
    rvStateInput.value = rvToEdit.state || "";
    rvAreaInput.value = rvToEdit.area || "";
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
        : "none"; // Check if element exists

    showView(rvFormView);
  } else {
    showMessage("RV not found.", "error");
    console.error("No such RV with ID:", rvId);
  }
}

/**
 * Saves a new or updates an existing Return Visit.
 */
function saveRV() {
  const name = rvNameInput.value.trim();
  const address = rvAddressInput.value.trim();
  const city = rvCityInput.value.trim();
  const state = rvStateInput.value.trim();
  let area = rvAreaInput.value.trim();
  const email = rvEmailInput.value.trim();
  const latitude = parseFloat(rvLatitudeInput.value);
  const longitude = parseFloat(rvLongitudeInput.value);
  const lastContactedDate = rvLastContactedDateInput.value;
  const lastContactedTime = rvLastContactedTimeInput.value;
  const note = rvNoteInput.value.trim();

  // Basic validation
  if (!name && !address) {
    showMessage(
      "Please enter at least a Name or Address for the Return Visit.",
      "warning"
    );
    return;
  }

  // If area is empty, try to use default from settings
  if (!area) {
    area = settings.defaultArea || "No Area";
  }

  const rvData = {
    id: currentRVId || generateUniqueId(), // Use existing ID or generate new
    name: name,
    address: address,
    city: city,
    state: state,
    area: area,
    email: email,
    latitude: isNaN(latitude) ? null : latitude,
    longitude: isNaN(longitude) ? null : longitude,
    lastContacted: lastContactedDate
      ? {
          // Renamed to lastVisited in UI, but keeping data field name for now
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
      : new Date().toISOString(), // Preserve createdAt for existing, set for new
    updatedAt: new Date().toISOString(),
  };

  if (currentRVId) {
    // Update existing RV
    const index = rvs.findIndex((rv) => rv.id === currentRVId);
    if (index !== -1) {
      rvs[index] = rvData;
      showMessage("RV Information updated successfully!", "success"); // Changed message
    }
  } else {
    // Add new RV
    rvs.push(rvData);
    showMessage("RV Information added successfully!", "success"); // Changed message
  }

  saveDataToLocalStorage();
  renderRVs(); // Re-render the list
  updateMap(); // Update the map
  clearRVForm();
  showView(myRVsView); // Go back to RV list
}

/**
 * Deletes a Return Visit.
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
 * Adds a new visit entry (currently just updates lastContacted).
 * In a more complex app, this would add to an array of visits.
 */
function addVisit() {
  const now = new Date();
  const dateString = now.toISOString().split("T")[0]; //YYYY-MM-DD
  const timeString = now.toTimeString().split(" ")[0].substring(0, 5); // HH:MM

  rvLastContactedDateInput.value = dateString;
  rvLastContactedDayInput.value = getFormattedDay(dateString);
  rvLastContactedTimeInput.value = timeString;
  if (removeVisitBtnForm) removeVisitBtnForm.style.display = "inline-flex"; // Corrected variable name
  showMessage("Current date/time added to 'Visited' fields.", "info"); // Changed message
}

/**
 * Removes the last visit entry (currently just clears lastContacted).
 */
function removeVisit() {
  rvLastContactedDateInput.value = "";
  rvLastContactedDayInput.value = "";
  rvLastContactedTimeInput.value = "";
  if (removeVisitBtnForm) removeVisitBtnForm.style.display = "none"; // Corrected variable name
  showMessage("Visited date/time cleared.", "info"); // Changed message
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
 * Fetches coordinates for a given city and state using Nominatim (OpenStreetMap).
 * @param {string} city - The city name.
 * @param {string} state - The state abbreviation.
 * @returns {Promise<{lat: number, lon: number}|null>} - Latitude and longitude or null if not found.
 */
async function geocodeCityState(city, state) {
  if (!city || !state) return null;
  const query = encodeURIComponent(`${city}, ${state}, USA`);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
  try {
    const response = await fetch(url);
    const data = await response.json();
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
  if (isNaN(lat) || isNaN(lon)) return null;
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data && data.address) {
      const address = data.address;
      const city =
        address.city ||
        address.town ||
        address.city_district ||
        address.village ||
        address.hamlet ||
        "";
      const state = address.state_code || address.state || ""; // state_code for 2-letter state
      return { city: city, state: state };
    }
  } catch (error) {
    console.error("Error reverse geocoding coordinates:", error);
  }
  return null;
}

/**
 * Initializes the map based on user settings (Google Maps or Leaflet/OSM).
 */
async function initMap() {
  // Ensure settings are loaded before determining map provider
  loadDataFromLocalStorage();

  // Determine if Google Maps API key is provided
  const googleMapsApiKey =
    settings.googleMapsApiKey && settings.googleMapsApiKey.trim() !== "";

  // If Google Maps is currently initialized and we need to switch to Leaflet, destroy Google Map.
  if (map && !googleMapsApiKey) {
    const mapContainer = document.getElementById("mapContainer");
    mapContainer.innerHTML = ""; // Clear Google Map elements
    map = null;
    mapInitialized = false; // Reset flag
  }
  // If Leaflet is currently initialized and we need to switch to Google Maps, destroy Leaflet Map.
  if (leafletMap && googleMapsApiKey) {
    leafletMap.remove();
    leafletMap = null;
    mapInitialized = false; // Reset flag
  }

  const mapContainer = document.getElementById("mapContainer");
  mapContainer.style.height = "400px"; // Ensure map container has a height

  if (googleMapsApiKey) {
    // Use Google Maps
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
      window.mapReady(); // Google Maps script already loaded, just initialize map
    }
  } else {
    // Use Leaflet/OpenStreetMap
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

  const defaultLat = parseFloat(settings.defaultLatitude) || 34.05;
  const defaultLng = parseFloat(settings.defaultLongitude) || -118.25;

  map = new google.maps.Map(document.getElementById("mapContainer"), {
    center: { lat: defaultLat, lng: defaultLng },
    zoom: 10,
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

  // Load Leaflet CSS and JS if not already loaded
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

  const defaultLat = parseFloat(settings.defaultLatitude) || 34.05;
  const defaultLng = parseFloat(settings.defaultLongitude) || -118.25;

  leafletMap = L.map("mapContainer").setView([defaultLat, defaultLng], 10);

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

  // Clear existing markers
  if (mapProvider === "google" && map) {
    markers.forEach((marker) => marker.setMap(null));
    markers = [];
  } else if (mapProvider === "leaflet" && leafletMap) {
    markers.forEach((marker) => leafletMap.removeLayer(marker));
    markers = [];
  } else {
    console.log("No active map initialized to update markers.");
    return;
  }

  const bounds =
    mapProvider === "google"
      ? new google.maps.LatLngBounds()
      : L.latLngBounds(); // Corrected for Leaflet
  let pinsAdded = 0;

  // Store used coordinates to apply fanning offset
  const usedCoords = {}; // Format: "lat,lon": count

  rvs.forEach((rv) => {
    let lat = parseFloat(rv.latitude);
    let lon = parseFloat(rv.longitude);
    let isGeolocated = !isNaN(lat) && !isNaN(lon);

    // Determine pin color and position
    let pinColor = "#2196F3"; // Default Blue
    let markerLat = lat;
    let markerLon = lon;
    let markerTitle = rv.name || rv.address || "Unnamed RV";

    if (!isGeolocated) {
      // If not geolocated, use default settings coordinates and violet color
      markerLat = parseFloat(settings.defaultLatitude) || 34.05;
      markerLon = parseFloat(settings.defaultLongitude) || -118.25;
      pinColor = "#673AB7"; // Violet for non-geolocated
      markerTitle += " (Location Unknown)";
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
    // Apply fanning offset if coordinates are identical
    if (usedCoords[coordKey]) {
      const offset = 0.0001 * usedCoords[coordKey]; // Small offset
      markerLat += offset;
      markerLon += offset;
    }
    usedCoords[coordKey] = (usedCoords[coordKey] || 0) + 1;

    if (mapProvider === "google" && map) {
      // Create custom SVG icon for Google Maps
      const svgIcon = {
        path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
        fillColor: pinColor,
        fillOpacity: 1,
        strokeWeight: 0, // No stroke for cleaner look
        scale: 1.5, // Adjust size
        anchor: new google.maps.Point(12, 24), // Center of the base of the pin
      };

      const marker = new google.maps.Marker({
        position: { lat: markerLat, lng: markerLon },
        map: map,
        title: markerTitle,
        icon: svgIcon, // Use custom SVG icon
      });

      // Store RV ID on the marker for easy access in click handler
      marker.rvId = rv.id;

      // Info window content (for hover)
      const infoWindowContent = `
                <div style="padding: 10px; font-family: Arial, sans-serif;">
                    <h4 style="margin-top: 0; margin-bottom: 5px; color: #333;">${
                      rv.name || "Unnamed RV"
                    }</h4>
                    <p style="margin-bottom: 3px;">${rv.address || ""}, ${
        rv.city || ""
      }, ${rv.state || ""}</p>
                </div>
            `;
      const infoWindow = new google.maps.InfoWindow({
        content: infoWindowContent,
      });

      // Event listener for hover (mouseover/mouseout)
      marker.addListener("mouseover", () => infoWindow.open(map, marker));
      marker.addListener("mouseout", () => infoWindow.close());

      // Event listener for click (to open form)
      marker.addListener("click", () => editRV(marker.rvId));

      markers.push(marker);
      // Only extend bounds for pins that were originally geolocated, not the fanned ones or default-centered ones
      if (isGeolocated)
        bounds.extend(new google.maps.LatLng(markerLat, markerLon));
      pinsAdded++;
    } else if (mapProvider === "leaflet" && leafletMap) {
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

      // Store RV ID on the marker for easy access in click handler
      marker.rvId = rv.id;

      // Popup content (for hover/click)
      const popupContent = `
                <div style="padding: 5px; font-family: Arial, sans-serif;">
                    <h4 style="margin-top: 0; margin-bottom: 5px; color: #333;">${
                      rv.name || "Unnamed RV"
                    }</h4>
                    <p style="margin-bottom: 3px;">${rv.address || ""}, ${
        rv.city || ""
      }, ${rv.state || ""}</p>
                </div>
            `;
      marker.bindPopup(popupContent);

      // Directly open form on click for Leaflet
      marker.on("click", () => editRV(marker.rvId));

      markers.push(marker);
      if (isGeolocated) bounds.extend(L.latLng(markerLat, markerLon)); // Only extend bounds for geolocated pins
      pinsAdded++;
    }
  });

  // Adjust map bounds or center on default if no pins
  if (pinsAdded > 0) {
    if (mapProvider === "google" && map) {
      if (!bounds.isEmpty()) {
        // Only fit bounds if there are actual geolocated pins
        map.fitBounds(bounds);
      } else {
        // If only non-geolocated pins were added (e.g., all violet)
        const defaultLat = parseFloat(settings.defaultLatitude) || 34.05;
        const defaultLng = parseFloat(settings.defaultLongitude) || -118.25;
        map.setCenter({ lat: defaultLat, lng: defaultLng });
        map.setZoom(10); // A reasonable default zoom for a single point
      }
    } else if (mapProvider === "leaflet" && leafletMap) {
      if (bounds.isValid()) {
        // Corrected: Use isValid() for Leaflet bounds
        leafletMap.fitBounds(bounds);
      } else {
        // If only non-geolocated pins were added
        const defaultLat = parseFloat(settings.defaultLatitude) || 34.05;
        const defaultLng = parseFloat(settings.defaultLongitude) || -118.25;
        leafletMap.setView([defaultLat, defaultLng], 10); // A reasonable default zoom for a single point
      }
    }
  } else {
    // If no pins at all, center on default location
    const defaultLat = parseFloat(settings.defaultLatitude) || 34.05;
    const defaultLng = parseFloat(settings.defaultLongitude) || -118.25;
    if (mapProvider === "google" && map) {
      map.setCenter({ lat: defaultLat, lng: defaultLng });
      map.setZoom(10);
    } else if (mapProvider === "leaflet" && leafletMap) {
      leafletMap.setView([defaultLat, defaultLng], 10);
    }
  }
}

// --- Event Listeners ---

document.addEventListener("DOMContentLoaded", () => {
  // Load all data from local storage on app start
  loadDataFromLocalStorage();

  // Set initial view based on whether settings exist (first-time use)
  if (Object.keys(settings).length === 0) {
    showView(settingsView);
    showMessage(
      "Welcome! Please set your default city/state or coordinates.",
      "info"
    );
  } else {
    showView(myRVsView);
    renderRVs(); // Render RVs once loaded
  }

  // Populate settings form if data was loaded
  populateSettingsForm();

  // Navigation Buttons
  settingsBtn.addEventListener("click", () => {
    showView(settingsView);
  });
  myRVsLink.addEventListener("click", () => {
    showView(myRVsView);
    renderRVs(); // Re-render RVs
  });
  mapLink.addEventListener("click", () => {
    showView(mapView);
  });

  // Settings View Buttons
  useCurrentLocationBtn.addEventListener("click", () =>
    getCurrentLocation(defaultLatitudeInput, defaultLongitudeInput)
  );
  exportDataBtn.addEventListener("click", exportData);
  importDataBtn.addEventListener("click", importData);
  saveSettingsBtn.addEventListener("click", saveSettings);
  cancelSettingsBtn.addEventListener("click", () => {
    populateSettingsForm(); // Revert any unsaved changes by reloading from 'settings' variable
    showView(myRVsView); // Go back to RV list
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
    updateCityStateFromCoordinates("rv")
  );

  // My RVs View Buttons
  addRVBtn.addEventListener("click", () => {
    const formIsVisible = rvFormView.style.display === "block";

    if (formIsVisible && formHasUnsavedChanges) {
      const confirmDiscard = confirm(
        "You have unsaved changes. Save or Discard?"
      );
      if (!confirmDiscard) return;
    }

    clearRVForm();
    showView(rvFormView);
    formHasUnsavedChanges = false;
  });

  // RV Form View Buttons
  saveRvBtn.addEventListener("click", () => {
    saveRV();
    formHasUnsavedChanges = false;
  });

  cancelRvBtn.addEventListener("click", () => {
    clearRVForm(); // Clear form
    showView(myRVsView); // Go back to RV list
    formHasUnsavedChanges = false;
  });
  rvUseCurrentLocationBtn.addEventListener("click", () =>
    getCurrentLocation(rvLatitudeInput, rvLongitudeInput)
  );

  // Contacted Date/Time functionality
  rvLastContactedDateInput.addEventListener("change", (event) => {
    rvLastContactedDayInput.value = getFormattedDay(event.target.value);
  });

  const formInputs = document.querySelectorAll(
    "#rvFormView input, #rvFormView textarea"
  );
  formInputs.forEach((input) => {
    input.addEventListener("input", () => {
      formHasUnsavedChanges = true;
    });
  });

  addVisitBtnForm.addEventListener("click", addVisit); // Corrected variable name
  removeVisitBtnForm.addEventListener("click", removeVisit); // Corrected variable name

  // Sort and Filter Event Listeners
  // Added null checks before adding event listeners to prevent errors if elements are not found
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
  // Dynamic area checkboxes will have listeners re-attached in generateAreaFilterCheckboxes
  // Initial generation on load
  generateAreaFilterCheckboxes("contact"); // Ensure correct viewType is passed
});
