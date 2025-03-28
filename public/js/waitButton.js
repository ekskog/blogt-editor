document.addEventListener("DOMContentLoaded", function () {
    const forms = document.querySelectorAll("form");
  
    forms.forEach((form) => {
      form.addEventListener("submit", function () {
        const btn = form.querySelector("button[type=submit]");
        if (btn) {
          btn.innerText = "Working...";
          btn.disabled = true;
        }
      });
    });
  });
  