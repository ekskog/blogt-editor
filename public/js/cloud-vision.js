document.addEventListener('DOMContentLoaded', () => {
    const analyzeButtons = document.querySelectorAll('.analyze-image');
    analyzeButtons.forEach(button => {
        button.addEventListener('click', () => {
            debug('Button clicked!');
            const imageUrl = button.dataset.imageUrl;
            debug('Image URL:', imageUrl);

            fetch('/eye', {
                method: 'POST',
                body: JSON.stringify({ imageUrl }),
                headers: { 'Content-Type': 'application/json' }
            })
                .then(response => {
                    debug('Response:', response);
                    return response.json();
                })
                .then(data => {
                    debug('Analysis Results:', data);
                })
                .catch(error => {
                    console.error('Error analyzing image:', error);
                });
        });
    });
});