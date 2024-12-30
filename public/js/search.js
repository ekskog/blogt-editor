document.querySelector('form').addEventListener('submit', function(e) {
    debug('Form submitted');
    debug('Search term:', this.tag.value);
})