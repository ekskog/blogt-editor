document.querySelector('form').addEventListener('submit', function(e) {
    console.log('Form submitted');
    console.log('Search term:', this.tag.value);
})