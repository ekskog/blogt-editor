document.addEventListener('DOMContentLoaded', () => {
    const analyzeButtons = document.querySelectorAll('.analyze-image');
    analyzeButtons.forEach(button => {
        button.addEventListener('click', () => {
            console.log('Button clicked!');
            const imageUrl = button.dataset.imageUrl;
            console.log('Image URL:', imageUrl);

            fetch('/eye', {
                method: 'POST',
                body: JSON.stringify({ imageUrl }),
                headers: { 'Content-Type': 'application/json' }
            })
                .then(response => {
                    console.log('Response:', response);
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