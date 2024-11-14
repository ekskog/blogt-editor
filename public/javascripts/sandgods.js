function toggleAccordion(index) {
    const contents = document.querySelectorAll('.accordion-content');
    contents.forEach((content, i) => {
        if (i === index) {
            // Toggle the selected section
            content.style.maxHeight = content.style.maxHeight ? null : content.scrollHeight + 'px';
        } else {
            // Close other sections
            content.style.maxHeight = null;
        }
    });
}
