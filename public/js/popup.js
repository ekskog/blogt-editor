// Add this JavaScript to your script file or within a script tag in your template
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('.image-container img');
    const popup = document.createElement('div');
    popup.classList.add('popup');
    popup.innerHTML = `
      <span class="close">&times;</span>
      <div class="popup-content">
        <img src="" alt="">
      </div>
    `;
    document.body.appendChild(popup);
  
    const popupImage = popup.querySelector('.popup-content img');
    const closeBtn = popup.querySelector('.close');
  
    images.forEach(image => {
      image.addEventListener('click', function() {
        popup.style.display = 'block';
        popupImage.src = this.src;
      });
    });
  
    closeBtn.addEventListener('click', function() {
      popup.style.display = 'none';
    });
  
    popup.addEventListener('click', function(event) {
      if (event.target === popup) {
        popup.style.display = 'none';
      }
    });
  });