const blogPostsContainer = document.getElementById('blog-posts');
const url = 'api/posts';

async function loadBlogPosts(posts) {
    try {
        blogPostsContainer.innerHTML = ''; // Clear existing posts
        const isSinglePost = posts.length === 1;

        console.log(isSinglePost)

        posts.forEach((post) => {
            const lines = post.content.split('\n');
            const permalink = lines[1].split(': ')[1].trim();
            const tagsLine = lines[2].split(': ')[1];
            const tags = tagsLine ? tagsLine.split(', ').map(tag => tag.trim()) : [];
            const titleLine = lines.find(line => line.trim().startsWith('# '));
            const title = titleLine ? titleLine.replace(/^#\s*/, '').trim() : 'Untitled';
            // Extract the date parts from the filename using regex
            const match = post.fileName.match(/(\d{4})\/(\d{2})\/(\d{2})\.md/);
            if (!match) {
                console.error("Invalid filename format");
            }

            // Destructure the matched groups into variables
            const [_, year, month, day] = match;

            const parsedDate = `${day}/${month}/${year}`

            let htmlContentMarkdown = lines.slice(3).join('\n'); // Content after metadata
            let htmlContentParsed = marked.parse(htmlContentMarkdown); // Parse content

            htmlContentParsed = htmlContentParsed.replace(/<img(.*?)src="(.*?)"(.*?)>/g,
                '<img$1src="$2"$3 class="clickable-image" onclick="showImageOverlay(\'$2\')">');

            const postElement = document.createElement('article');
            postElement.classList.add('blog-post');
            postElement.innerHTML = `
            <div class="markdown-content">${htmlContentParsed}</div>
            <div class="light">
              <span class="post-date ${isSinglePost ? '' : 'clickable'}" data-date="${year}-${month}-${day}">${parsedDate}</span>
              ${tags.map(tag => `· <a title="Everything tagged ${tag}" href="/tagged/${tag.toLowerCase().replace(/\s+/g, '-')}">${tag}</a>`).join(' ')}
            </div>
        `;
            blogPostsContainer.appendChild(postElement);

            // Add horizontal rule after the post
            const hr = document.createElement('hr');
            hr.className = 'full';
            blogPostsContainer.appendChild(hr);
        });

        // Add click event listeners to all post dates
        if (!isSinglePost) {
            document.querySelectorAll('.post-date.clickable').forEach(dateElement => {
                dateElement.addEventListener('click', (event) => {
                    event.preventDefault(); // Prevent default action
                    const date = event.target.dataset.date;
                    fetchPosts(date).then(posts => {
                        loadBlogPosts(posts);
                    }).catch(error => {
                        console.error('Error fetching single post:', error);
                    });
                });
            });
        }

    } catch (error) {
        console.error('Error loading blog posts:', error);
        blogPostsContainer.innerHTML = '<p>Error loading blog posts. Please try again later.</p>';
    }
}

async function fetchPosts(date = null) {
    let url = '/api/posts';
    let options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (date) {
        options.method = 'POST';
        options.body = JSON.stringify({ date });
    }

    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        throw error;
    }
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    fetchPosts()
        .then(posts => {
            loadBlogPosts(posts)
        })
        .catch(error => {
            console.error('Error fetching 5 latest posts:', error);
        });
});

// If you have this function, keep it; otherwise, you can remove it
function showImageOverlay(imageSrc) {
    // Implementation of image overlay functionality
}