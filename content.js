const top_button = document.createElement("button");
const bottom_button = document.createElement("button");

top_button.textContent = "↑";
bottom_button.textContent = "↓";

top_button.className = "scroll-helper-button top";
bottom_button.className = "scroll-helper-button bottom";

// Create a host element
const host = document.createElement("div");

// Attach a Shadow DOM
const shadow = host.attachShadow({
  mode: "open",
});

// Add the host to the page
document.body.appendChild(host);

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
}

.top {
    bottom: 60px;
}

.bottom {
    bottom: 20px;
}
`;

shadow.appendChild(style);

function setButtonsVisibility(hidden) {
  top_button.style.visibility = hidden ? "hidden" : "visible";
  bottom_button.style.visibility = hidden ? "hidden" : "visible";
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateSettings" && message.settings) {
    if (typeof message.settings.hideButtons === "boolean") {
      setButtonsVisibility(message.settings.hideButtons);
    }
  }
});

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

top_button.addEventListener("click", () => {
  scrollToPercent(0);
});

bottom_button.addEventListener("click", () => {
  scrollToPercent(1);
});
