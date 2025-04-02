document.addEventListener("DOMContentLoaded", function () {
  const forms = document.querySelectorAll("form");

  forms.forEach((form) => {
    form.addEventListener("submit", function () {
      const btn = form.querySelector("button[type=submit]");
      if (btn) {
        const textSpan = document.createElement("span");
        textSpan.classList.add("submit-text", "hidden");
        textSpan.innerText = btn.innerText;

        const spinnerSpan = document.createElement("span");
        spinnerSpan.classList.add("spinner");
        spinnerSpan.innerHTML = "⚙️"; // Can be replaced with a FontAwesome spinner icon

        btn.innerHTML = ""; // Clear button content
        btn.appendChild(spinnerSpan);
        btn.disabled = true;
      }
    });
  });
});
