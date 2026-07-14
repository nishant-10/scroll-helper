const top_button = document.createElement("button");
const bottom_button = document.createElement("button");

top_button.textContent = "↑";
bottom_button.textContent = "↓";

top_button.className = "scroll-helper-button top";
bottom_button.className = "scroll-helper-button bottom";

// Create a host element
const host = document.createElement("div");
host.style.position = "fixed";
host.style.inset = "0";
host.style.zIndex = "2147483647";
host.style.pointerEvents = "none";

// Attach a Shadow DOM
const shadow = host.attachShadow({
  mode: "open",
});

// Add the host to the page
document.body.appendChild(host);

const toast = document.createElement("div");
toast.className = "scroll-helper-toast";
shadow.appendChild(toast);

// Add buttons inside the Shadow DOM
shadow.appendChild(top_button);
shadow.appendChild(bottom_button);

const style = document.createElement("style");
style.textContent = `
.scroll-helper-button {
    position: fixed;
    right: 20px;

    width: 30px;
    height: 30px;

    z-index: 2147483647;

    background: #4285f4;
    color: white;
    border: none;
    border-radius: 50%;

    opacity: 0.5;

    cursor: pointer;
    pointer-events: auto;
}

.top {
    bottom: 60px;
}

.bottom {
    bottom: 20px;
}

.scroll-helper-toast {
    position: fixed;
    right: 20px;
    bottom: 88px;
    max-width: 220px;
    padding: 10px 12px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.85);
    color: white;
    font-size: 12px;
    line-height: 1.4;
    text-align: center;
    opacity: 0;
    transform: translateY(8px);
    pointer-events: none;
    transition: opacity 0.2s ease, transform 0.2s ease;
    z-index: 2147483648;
}

.scroll-helper-toast.visible {
    opacity: 1;
    transform: translateY(0);
}
`;

shadow.appendChild(style);

const settings = {
  mode: "default",
  top: 100,
  bottom: 100,
  hideButtons: false,
};

function setButtonsVisibility(hidden) {
  top_button.style.visibility = hidden ? "hidden" : "visible";
  bottom_button.style.visibility = hidden ? "hidden" : "visible";
}

function applySettings(next) {
  Object.assign(settings, next);
  if (typeof settings.hideButtons === "boolean") {
    setButtonsVisibility(settings.hideButtons);
  }
}

// Load persisted settings so the chosen mode survives page loads and navigation
chrome.storage.local.get(["settings"], (data) => {
  if (data.settings) {
    applySettings(data.settings);
  }
});

// Stay in sync if settings change while this page is open
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.settings && changes.settings.newValue) {
    applySettings(changes.settings.newValue);
  }
});

function normalizeText(value) {
  return (value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function findScrollTarget(text, searchFromBottom = false) {
  const query = normalizeText(text);
  if (!query) {
    return null;
  }

  // Elements whose rendered text contains the query. innerText (not textContent)
  // reflects only on-screen text : it skips script/style and hidden nodes and
  // collapses to what the user actually sees : and it lets a match span several
  // inline or block child elements. Non-HTML elements (e.g. SVG) are skipped.
  const containing = Array.from(document.querySelectorAll("body *")).filter(
    (element) =>
      element instanceof HTMLElement &&
      normalizeText(element.innerText).includes(query),
  );

  // Reduce to the tightest wrappers: keep an element only if none of its children
  // also fully contain the query. (If a deeper descendant contained it, that
  // descendant's parent would too, so checking direct children is enough.) This
  // scrolls to the smallest element around the text, not a huge ancestor.
  const containingSet = new Set(containing);
  const tightest = containing.filter(
    (element) =>
      !Array.from(element.children).some((child) => containingSet.has(child)),
  );

  // Only elements actually laid out on the page can be scrolled into view.
  const matches = tightest.filter((element) => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });

  if (matches.length === 0) {
    return null;
  }

  // querySelectorAll returns document order: first = topmost, last = bottommost.
  return searchFromBottom ? matches[matches.length - 1] : matches[0];
}

// Default to the page itself
let activeScroller = document.scrollingElement || document.documentElement;

// Learn which element the user is actually scrolling
document.addEventListener(
  "scroll",
  (e) => {
    activeScroller =
      e.target === document
        ? document.scrollingElement || document.documentElement
        : e.target;

    console.log("Current scroller:", activeScroller);
  },
  true, // Capture phase is important
);

function scrollToPercent(percent) {
  const maxScroll = activeScroller.scrollHeight - activeScroller.clientHeight;

  activeScroller.scrollTo({
    top: maxScroll * percent,
    behavior: "smooth",
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    toast.classList.remove("visible");
  }, 1800);
}

function scrollToText(text, searchFromBottom = false) {
  const target = findScrollTarget(text, searchFromBottom);
  if (!target) {
    showToast("Text not found on this page.");
    return false;
  }

  target.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "nearest",
  });
  return true;
}

top_button.addEventListener("click", () => {
  if (settings.mode === "text") {
    scrollToText(settings.top, false);
  } else if (settings.mode === "percent") {
    scrollToPercent(settings.top / 100);
  } else {
    scrollToPercent(0);
  }
});

bottom_button.addEventListener("click", () => {
  if (settings.mode === "text") {
    scrollToText(settings.bottom, true);
  } else if (settings.mode === "percent") {
    scrollToPercent(settings.bottom / 100);
  } else {
    scrollToPercent(1);
  }
});
