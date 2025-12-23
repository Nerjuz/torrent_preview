function showPreviews() {
  const cells = document.querySelectorAll('.torrent-name_cell');
  
  cells.forEach(cell => {
    // Check if image is already present to avoid duplicates
    if (cell.querySelector('.preview-image')) return;

    // The data attribute might be on the cell itself or a link inside it.
    // Based on typical behavior, let's check the link first or the cell.
    // The user said "link with data-poster-preview".
    const link = cell.querySelector('a[data-poster-preview]');
    
    if (link) {
      const imageUrl = link.getAttribute('data-poster-preview');
      if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.style.height = '300px';
        img.style.display = 'block';
        img.style.marginTop = '10px';
        img.classList.add('preview-image');
        
        // Append to the cell
        cell.appendChild(img);
      }
    }
  });
}

// Run on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showPreviews);
} else {
    showPreviews();
}

// Observe for dynamic content (just in case, though likely not needed for this site)
const observer = new MutationObserver(showPreviews);
observer.observe(document.body, { childList: true, subtree: true });
