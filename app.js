// app.js

document.addEventListener("DOMContentLoaded", () => {
  // 1. Get references to our main UI elements
  const appContent = document.getElementById("appContent");
  const settingsView = document.getElementById("settingsView");
  const myRVsView = document.getElementById("myRVsView");
  const mapView = document.getElementById("mapView");
  const rvFormView = document.getElementById("rvFormView");
  const settingsBtn = document.getElementById("settingsBtn");

  // Settings View Elements
  const defaultCityInput = document.getElementById("defaultCity");
  const defaultStateInput = document.getElementById("defaultState");
  const defaultAreaInput = document.getElementById("defaultArea");
  const defaultLatitudeInput = document.getElementById("defaultLatitude");
  const defaultLongitudeInput = document.getElementById("defaultLongitude");
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");
  const useCurrentLocationBtn = document.getElementById(
    "useCurrentLocationBtn"
  );
  const exportDataBtn = document.getElementById("exportDataBtn");
  const importDataInput = document.getElementById("importDataInput"); // The hidden file input
  const importDataBtn = document.getElementById("importDataBtn"); // The visible button
  const addRVBtn = document.getElementById("addRVBtn");

  // RV Form Elements
  const rvUseCurrentLocationBtn = document.getElementById(
    "rvUseCurrentLocationBtn"
  );
  const rvLastContactedDateInput = document.getElementById(
    "rvLastContactedDate"
  );
  const rvLastContactedDayInput = document.getElementById("rvLastContactedDay");
  const rvLastContactedTimeInput = document.getElementById(
    "rvLastContactedTime"
  );

  // Footer Navigation Links
  const myRVsLink = document.getElementById("myRVsLink");
  const mapLink = document.getElementById("mapLink");

  // Validation Feedback Spans

  // Store references to all views in a map for easy management
  const views = {
    settings: settingsView,
    myRVs: myRVsView,
    map: mapView,
    rvForm: rvFormView,
  };

  let currentView = "settings"; // Default to settings for initial development

  // Function to show a specific view and hide others
  const showView = (viewId) => {
    for (const id in views) {
      if (views[id]) {
        // Check if the view element actually exists
        views[id].style.display = "none"; // Hide all views
      }
    }
    if (views[viewId]) {
      // If the requested view exists, show it
      views[viewId].style.display = "block";
      currentView = viewId;
      // Conditionally show/hide settings button based on current view
      if (settingsBtn) {
        // Ensure button exists before trying to access
        if (viewId === "settings") {
          settingsBtn.style.display = "none"; // Hide if on settings page
        } else {
          settingsBtn.style.display = "flex"; // Show for other pages (using flex from CSS)
        }
      }
      // Conditionally show/hide settings button based on current view
      if (settingsBtn) {
        // Ensure button exists before trying to access
        if (viewId === "settings") {
          settingsBtn.style.display = "none"; // Hide if on settings page
        } else {
          settingsBtn.style.display = "flex"; // Show for other pages (using flex from CSS)
        }
      }
      // Later: Update header title based on currentView
      // Later: Highlight active footer/header icon
    }
  };

  // 2. First-Time Use Logic
  // We'll use localStorage to check if this is the first visit.
  const isFirstTimeUser = localStorage.getItem("isFirstTimeUser") === null; // Check if key exists

  if (isFirstTimeUser) {
    // If it's the first time, show settings view and set flag
    showView("settings");
    // We'll set this to 'false' only AFTER initial settings are saved,
    // but for now, we'll keep it null to always show settings.
    // Once user saves settings, we'll set localStorage.setItem('isFirstTimeUser', 'false');
  } else {
    // If not first time, show the myRVs view
    showView("myRVs"); // Now defaults to myRVs view
  }

  // 3. Add Event Listeners for Navigation Buttons (Placeholder for now)
  settingsBtn.addEventListener("click", () => showView("settings"));
  myRVsLink.addEventListener("click", () => showView("myRVs"));
  mapLink.addEventListener("click", () => showView("map"));
  addRVBtn.addEventListener("click", () => showView("rvForm"));

  // --- Settings View Logic ---

  // Function to apply capitalization (first letter of each word)
  const capitalizeWords = (inputElement) => {
    const value = inputElement.value;
    inputElement.value = value
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Function to validate and format state (2 capital letters)
  const formatState = (inputElement) => {
    let value = inputElement.value.toUpperCase(); // Convert to uppercase immediately
    if (value.length > 2) {
      value = value.substring(0, 2); // Truncate to 2 characters
    }
    inputElement.value = value;
  };

  // Function to provide visual validation feedback

  // Event Listeners for Input Validation

  // Function to load settings from Local Storage
  const loadSettings = () => {
    const settings = JSON.parse(localStorage.getItem("myRVsSettings")) || {};
    defaultCityInput.value = settings.defaultCity || "";
    defaultStateInput.value = settings.defaultState || "";
    defaultAreaInput.value = settings.defaultArea || "No Area"; // Pre-fill 'No Area' if empty
    defaultLatitudeInput.value = settings.defaultLatitude || "";
    defaultLongitudeInput.value = settings.defaultLongitude || "";
  };

  // Function to save settings to Local Storage
  const saveSettings = () => {
    const cityValue = defaultCityInput.value.trim();
    const stateValue = defaultStateInput.value.trim();
    const areaValue = defaultAreaInput.value.trim();
    const latitudeValue = defaultLatitudeInput.value.trim();
    const longitudeValue = defaultLongitudeInput.value.trim();

    const latLongEntered = latitudeValue !== "" && longitudeValue !== "";

    let overallValid = true;
    let errorMessage = "";

    // Determine if City/State are required or optional
    if (!latLongEntered) {
      // Lat/Long not entered, so City and State are mandatory
      if (cityValue === "") {
        errorMessage += "City cannot be empty.\n";
        overallValid = false;
      }
      if (stateValue.length !== 2) {
        errorMessage += "State must be 2 letters.\n";
        overallValid = false;
      }
    } else {
      // Lat/Long ARE entered, so City/State are optional.
      // Still validate their format if they ARE entered.
      if (cityValue !== "" && stateValue.length !== 2) {
        errorMessage += "If State is entered, it must be 2 letters.\n";
        overallValid = false;
      }
      // Validate Lat/Long are valid numbers if they were entered
      if (
        isNaN(parseFloat(latitudeValue)) ||
        isNaN(parseFloat(longitudeValue))
      ) {
        errorMessage +=
          "Please enter valid numbers for Latitude and Longitude.\n";
        overallValid = false;
      }
    }

    // Auto-fill "No Area" if Area is empty, otherwise use provided value
    const finalAreaValue = areaValue === "" ? "No Area" : areaValue;

    if (overallValid) {
      const settings = {
        defaultCity: cityValue,
        defaultState: stateValue,
        defaultArea: finalAreaValue, // Use the auto-filled or user-provided value
        defaultLatitude: latitudeValue,
        defaultLongitude: longitudeValue,
      };
      localStorage.setItem("myRVsSettings", JSON.stringify(settings));
      localStorage.setItem("isFirstTimeUser", "false"); // Mark as not first-time user
      alert("Settings saved successfully!"); // Confirmation

      // Optional: update the Area field in the UI with "No Area" if it was auto-filled
      defaultAreaInput.value = finalAreaValue;

      // After saving, we would typically switch to the main RVs view (myRVs view).
      // For now, we'll keep it on settings as myRVs view is not yet built.
      // In future, this would be: showView('myRVs');
    } else {
      alert(
        "Please correct the following issues before saving:\n" + errorMessage
      );
    }
  };

  // Event Listener for Save Settings Button
  saveSettingsBtn.addEventListener("click", saveSettings);
  // --- RV Form Logic ---

  // Function to update the Day field based on the Date field
  const updateDayField = () => {
    const dateValue = rvLastContactedDateInput.value;
    if (dateValue) {
      // Adding 'T00:00:00' to avoid timezone conversion issues on different browsers
      const date = new Date(dateValue + "T00:00:00");
      const options = { weekday: "short" }; // e.g., "Mon", "Tue"
      rvLastContactedDayInput.value = date.toLocaleDateString("en-US", options);
    } else {
      rvLastContactedDayInput.value = ""; // Clear day if date is cleared
    }
  };

  // Event listener for date input changes
  rvLastContactedDateInput.addEventListener("change", updateDayField);

  // Initial update in case date is pre-filled (e.g., from browser auto-fill)
  updateDayField();

  // Event Listener for Use Current Location Button
  useCurrentLocationBtn.addEventListener("click", () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          defaultLatitudeInput.value = position.coords.latitude.toFixed(6);
          defaultLongitudeInput.value = position.coords.longitude.toFixed(6);
          alert("Location retrieved successfully!");
        },
        (error) => {
          // Handle errors based on error.code
          let errorMessage = "Unable to retrieve your location.";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage =
                "Location access denied. Please enable it in your browser settings.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage = "The request to get user location timed out.";
              break;
            case error.UNKNOWN_ERROR:
              errorMessage =
                "An unknown error occurred while getting location.";
              break;
          }
          alert(errorMessage);
          console.error("Geolocation Error:", error);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  });

  // Initial load of settings when the app starts
  loadSettings();
  // ... we will add these in the next steps ...

  console.log("App initialized.");
});
