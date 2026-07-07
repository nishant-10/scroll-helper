const top_button = document.createElement("button");
const bottom_button = document.createElement("button");

top_button.textContent = "↑";
bottom_button.textContent = "↓";

top_button.className = "scroll-helper-button top";
bottom_button.className = "scroll-helper-button bottom";

document.body.appendChild(top_button);
document.body.appendChild(bottom_button);

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
  true // Capture phase is important
);

function scrollToPercent(percent) {
  const maxScroll =
    activeScroller.scrollHeight - activeScroller.clientHeight;

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