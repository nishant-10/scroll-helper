const radios = document.querySelectorAll('input[name="scrollMode"]');

const contents = document.querySelectorAll(".section-content");

function updateSections() {
  contents.forEach((content) => {
    content.style.display = "none";
  });

  const selected = document.querySelector('input[name="scrollMode"]:checked');

  selected.closest(".section").querySelector(".section-content").style.display =
    "block";
}

radios.forEach((radio) => {
  radio.addEventListener("change", updateSections);
});

updateSections();
