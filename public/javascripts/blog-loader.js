const blogPostsContainer = document.getElementById('blog-posts');
const postsToLoad = 5;
let currentStartDate = new Date();

// Add this custom renderer for marked
const renderer = new marked.Renderer();
renderer.image = function(href, title, text) {
    return `<img src="${href}" alt="${text}" title="${title || ''}" width="540" height="540" style="max-width:100%; height:auto;">`;
};

marked.setOptions({
    renderer: renderer
});

async function loadBlogPosts(direction = 'initial') {
    console.log(`Starting to check posts from ${currentStartDate.toISOString()}`);

    let postsLoaded = 0;
    blogPostsContainer.innerHTML = ''; // Clear existing posts
    
    for (let i = 0; i < 5 && postsLoaded < postsToLoad; i++) {
        const currentDate = new Date(currentStartDate);
        currentDate.setDate(currentStartDate.getDate() - i);
        
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const postPath = `/posts/${year}/${month}/${day}.md`;

        console.log(`Checking: ${postPath}`);

        try {
            const response = await fetch(postPath);
            console.log(`Response status: ${response.status}`);
            
            if (response.ok) {
                const markdown = await response.text();
                console.log(`Loaded post content (first 50 chars): ${markdown.substring(0, 50)}...`);
                
                const html = marked.parse(markdown);
                
                const postElement = document.createElement('article');
                postElement.classList.add('blog-post', 'entry');
                postElement.innerHTML = `
                    <h2>${year}-${month}-${day}</h2>
                    <div class="markdown-content">${html}</div>
                `;
                blogPostsContainer.appendChild(postElement);
                
                postsLoaded++;
                console.log(`Loaded post for ${year}-${month}-${day}`);
            } else {
                console.log(`No post found for ${year}-${month}-${day}`);
            }
        } catch (error) {
            console.error(`Error loading post for ${year}-${month}-${day}:`, error);
        }
    }

    console.log(`Finished checking 5 days, loaded ${postsLoaded} posts.`);
    updatePaginationButtons(postsLoaded);
}

function updatePaginationButtons(postsLoaded) {
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');

    if (prevButton && nextButton) {
        // Always enable the "Next" button as there might be older posts
        nextButton.disabled = false;

        // Only enable the "Previous" button if we're not at the most recent posts
        prevButton.disabled = currentStartDate >= new Date();
    } else {
        console.warn('Pagination buttons not found in the DOM');
    }
}

function loadPreviousPosts() {
    currentStartDate = new Date(currentStartDate.getTime() + 5 * 24 * 60 * 60 * 1000); // Add 5 days
    if (currentStartDate > new Date()) {
        currentStartDate = new Date(); // Ensure we don't go beyond the current date
    }
    loadBlogPosts('previous');
}

function loadNextPosts() {
    currentStartDate = new Date(currentStartDate.getTime() - 5 * 24 * 60 * 60 * 1000); // Subtract 5 days
    loadBlogPosts('next');
}

// Initial load
loadBlogPosts('initial');

// Add event listeners to pagination buttons
document.addEventListener('DOMContentLoaded', () => {
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');

    if (prevButton && nextButton) {
        prevButton.addEventListener('click', loadPreviousPosts);
        nextButton.addEventListener('click', loadNextPosts);
    } else {
        console.warn('Pagination buttons not found in the DOM');
    }
});