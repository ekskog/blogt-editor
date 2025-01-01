document.addEventListener('DOMContentLoaded', () => {
  
  const hamburger = document.querySelector('.hamburger-menu');
  const navLinks = document.querySelector('.nav-links');
    
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  } else {
    console.err('Missing elements:', {
      hamburger: !!hamburger,
      navLinks: !!navLinks
    });
  }
});

// JavaScript for toggling submenu visibility on click
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', function (e) {
    // Prevent other items from remaining open when a new one is clicked
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
    
    // Toggle 'active' class on clicked menu item
    this.classList.toggle('active');
  });
});
