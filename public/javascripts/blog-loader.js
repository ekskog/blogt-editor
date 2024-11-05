const blogPostsContainer = document.getElementById('blog-posts');

async function loadBlogPosts() {
    try {
        const response = await fetch('/api/posts');
        if (!response.ok) {
            throw new Error('Failed to fetch posts');
        }
        const posts = await response.json();

        blogPostsContainer.innerHTML = ''; // Clear existing posts

        posts.forEach((post) => {
            const lines = post.content.split('\n');
            const permalink = lines[1].split(': ')[1].trim();
            const tagsLine = lines[2].split(': ')[1];
            const tags = tagsLine ? tagsLine.split(', ').map(tag => tag.trim()) : [];
            const titleLine = lines.find(line => line.trim().startsWith('# '));
            const title = titleLine ? titleLine.replace(/^#\s*/, '').trim() : 'Untitled';
            console.log('File Name: ' + post.fileName);
            // Extract the date parts from the filename using regex
            const match = post.fileName.match(/(\d{4})\/(\d{2})\/(\d{2})\.md/);
            if (!match) {
                console.log("Invalid filename format");
            }

            // Destructure the matched groups into variables
            const [_, year, month, day] = match;

            const parsedDate = `${day}/${month}/${year}`
            console.log('Parsed Date: ' + parsedDate);


            let htmlContentMarkdown = lines.slice(3).join('\n'); // Content after metadata
            let htmlContentParsed = marked.parse(htmlContentMarkdown); // Parse content

            htmlContentParsed = htmlContentParsed.replace(/<img(.*?)src="(.*?)"(.*?)>/g,
                '<img$1src="$2"$3 class="clickable-image" onclick="showImageOverlay(\'$2\')">');

            const postElement = document.createElement('article');
            postElement.classList.add('blog-post');
            postElement.innerHTML = `
            <div class="markdown-content">${htmlContentParsed}</div>
            <div class="light">
                <a href="/posts/${year}/${month}/${day}.md" title="${title}">${parsedDate}</a>
                ${tags.map(tag => `· <a title="Everything tagged ${tag}" href="/tagged/${tag.toLowerCase().replace(/\s+/g, '-')}">${tag}</a>`).join(' ')}
            </div>
        `;
            blogPostsContainer.appendChild(postElement);

            // Add horizontal rule after the post
            const hr = document.createElement('hr');
            hr.className = 'full';
            blogPostsContainer.appendChild(hr);
        });

    } catch (error) {
        console.error('Error loading blog posts:', error);
        blogPostsContainer.innerHTML = '<p>Error loading blog posts. Please try again later.</p>';
    }
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    loadBlogPosts();
});