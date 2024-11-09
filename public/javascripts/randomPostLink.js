// Function to generate a random date within a specified range
function getRandomDate(start, end) {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  return `posts/${year}${month}${day}`;
}

// Set up the random link navigation
document.addEventListener("DOMContentLoaded", function() {
  const randomLink = document.getElementById('random-link');
  const startDate = new Date(2010, 2, 11); // March 11, 2010
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 1); // The day before the current date

  // Add a click event listener
  randomLink.addEventListener("click", function(event) {
    event.preventDefault(); // Prevent the default anchor behavior
    const randomUrl = '/' + getRandomDate(startDate, endDate);
    window.location.href = randomUrl; // Navigate to the random URL
  });
});
