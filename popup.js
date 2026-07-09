const radios = document.querySelectorAll('input[name="scrollMode"]');

const contents = document.querySelectorAll(".section-content");

const saveTextButton = document.getElementById("saveText");

const saveTextWarning = document.getElementById("saveTextWarning");

function updateSections() {
  contents.forEach((content) => {
    content.style.display = "none";
  });

  const selected = document.querySelector('input[name="scrollMode"]:checked');

  selected.closest(".section").querySelector(".section-content").style.display =
    "block";
}

function saveSettings(settings) {
  return chrome.storage.local.set({ settings });
}

function notifyActiveTab(settings) {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.tabs.sendMessage(tab.id, {
      action: "updateSettings",
      settings,
    });
  });
}
async function saveAndApplySettings(settings) {
  await saveSettings(settings);
  notifyActiveTab(settings);
}

function getDefaultSettings() {
  return {
    mode: "text",
    top: 100,
    bottom: 100,
  };
}

function isScrollInputDataValid({ topValue, bottomValue, mode }) {
  if (
    mode === "percent" &&
    (typeof topValue !== "number" ||
      typeof bottomValue !== "number" ||
      isNaN(topValue) ||
      isNaN(bottomValue) ||
      topValue < 0 ||
      bottomValue < 0 ||
      topValue > 100 ||
      bottomValue > 100)
  ) {
    return {
      valid: false,
      message: "Percentage must be between 0 and 100.",
    };
  }
  if (
    mode === "text" &&
    (typeof topValue !== "string" ||
      typeof bottomValue !== "string" ||
      topValue.trim() === "" ||
      bottomValue.trim() === "")
  ) {
    return {
      valid: false,
      message: "Invalid text value.",
    };
  }
  if (mode !== "percent" && mode !== "text") {
    return {
      valid: false,
      message: "Please select a valid option.",
    };
  }
  return {
    valid: true,
    message: "",
  };
}

saveTextButton.addEventListener("click", async () => {
  //we expect either one [top text + bottom text] or [% value]
  const selectedMode = document.querySelector(
    'input[name="scrollMode"]:checked',
  ).value;
  let inputsAreValid = true; //use this to take final decision if we want to send data or show warnings
  let validationError = "";
  //by default, we set mode text and scroll to 100%, this is a worst case fallback
  let extensionSettings = getDefaultSettings();

  if (selectedMode === "text") {
    const topText = document.getElementById("topText").value;
    const bottomText = document.getElementById("bottomText").value;
    const inputValidation = isScrollInputDataValid({
      topValue: topText,
      bottomValue: bottomText,
      mode: selectedMode,
    });
    if (inputValidation.valid) {
      extensionSettings = {
        mode: "text",
        top: topText.trim(),
        bottom: bottomText.trim(),
      };
    } else {
      inputsAreValid = false;
      validationError = inputValidation.message;
    }
  } else if (selectedMode === "percent") {
    const topPercent = Number(document.getElementById("topPercent").value);
    const bottomPercent = Number(
      document.getElementById("bottomPercent").value,
    );
    const inputValidation = isScrollInputDataValid({
      topValue: topPercent,
      bottomValue: bottomPercent,
      mode: selectedMode,
    });
    if (inputValidation.valid) {
      extensionSettings = {
        mode: "percent",
        top: topPercent,
        bottom: bottomPercent,
      };
    } else {
      inputsAreValid = false;
      validationError = inputValidation.message;
    }
  } else {
    inputsAreValid = false;
  }
  //if all inputs are valid, send data to the chrome tab
  if (inputsAreValid) {
    await saveAndApplySettings(extensionSettings);
    saveTextWarning.style.display = "none";
  } else {
    //warning UI
    saveTextWarning.style.display = "flex";
    saveTextWarning.textContent = validationError || "Something went wrong";
  }
});

radios.forEach((radio) => {
  radio.addEventListener("change", updateSections);
});

document.querySelectorAll("input").forEach((input) => {
  input.addEventListener("input", () => {
    saveTextWarning.style.display = "none";
  });
});

updateSections();
