document.addEventListener("DOMContentLoaded", function () {
  const forms = document.querySelectorAll("form");

  forms.forEach((form) => {
    form.addEventListener("submit", function () {
      const btn = form.querySelector("button[type=submit]");
      if (btn) {
        // Change button text to "Loading..."
        btn.innerHTML = "Loading...";
        
        // Disable the button to prevent multiple submissions
        btn.disabled = true;
      }
    });
  });
});
