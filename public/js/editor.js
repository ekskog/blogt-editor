document.addEventListener("DOMContentLoaded", () => {
  const sunbatheBtn = document.getElementById("sunbatheBtn");
  const form = document.getElementById("editorForm");

  if (sunbatheBtn && form) {
    sunbatheBtn.addEventListener("click", () => {
      alert("The form is now sunbathed!");
      form.style.backgroundColor = "#fdf6e3"; // Simulate sunbathing by changing form background color.
    });
  } else {
    console.error("Sunbathe button or form not found in the DOM.");
  }
});
