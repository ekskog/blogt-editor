document.addEventListener('DOMContentLoaded', () => {
  debug('Script loaded!');
  
  const hamburger = document.querySelector('.hamburger-menu');
  const navLinks = document.querySelector('.nav-links');
  
  debug('Hamburger element:', hamburger);
  debug('Nav links element:', navLinks);
  
  if (hamburger && navLinks) {
    debug('Both elements found, adding click listener');
    hamburger.addEventListener('click', () => {
      debug('Hamburger clicked!');
      debug('Nav links classes before:', navLinks.classList.toString());
      navLinks.classList.toggle('active');
      debug('Nav links classes after:', navLinks.classList.toString());
    });
  } else {
    debug('Missing elements:', {
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
