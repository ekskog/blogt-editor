document.addEventListener("DOMContentLoaded", function() {
    const canvas = document.getElementById('wordCloudCanvas');
    const tags = JSON.parse(canvas.dataset.tags);

    // Minimal configuration for WordCloud2.js
    WordCloud(canvas, {
        list: tags,
        gridSize: 10,
        weightFactor: 0.2,   // Simple scaling for tag sizes
        fontFamily: 'Arial, sans-serif',
        color: 'random-light',   // Let WordCloud2 handle random colors
        backgroundColor: '#ffffff'
    });
});
