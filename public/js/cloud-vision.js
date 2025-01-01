document.addEventListener('DOMContentLoaded', () => {
    const analyzeButtons = document.querySelectorAll('.analyze-image');
    analyzeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const imageUrl = button.dataset.imageUrl;

            fetch('/eye', {
                method: 'POST',
                body: JSON.stringify({ imageUrl }),
                headers: { 'Content-Type': 'application/json' }
            })
                .then(response => {
                    return response.json();
                })
                .then(data => {
                    console.log('Analysis Results:', data);
                })
                .catch(error => {
                    console.error('Error analyzing image:', error);
                });
        });
    });
});