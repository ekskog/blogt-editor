document.addEventListener('DOMContentLoaded', () => {
  console.log('Script loaded!');
  
  const hamburger = document.querySelector('.hamburger-menu');
  const navLinks = document.querySelector('.nav-links');
  
  console.log('Hamburger element:', hamburger);
  console.log('Nav links element:', navLinks);
  
  if (hamburger && navLinks) {
    console.log('Both elements found, adding click listener');
    hamburger.addEventListener('click', () => {
      console.log('Hamburger clicked!');
      console.log('Nav links classes before:', navLinks.classList.toString());
      navLinks.classList.toggle('active');
      console.log('Nav links classes after:', navLinks.classList.toString());
    });
  } else {
    console.log('Missing elements:', {
      hamburger: !!hamburger,
      navLinks: !!navLinks
    });
  }
});