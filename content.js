const processedElements = new WeakSet();

// Settings
let isTorrentLtEnabled = true;
let isLinkomanijaEnabled = true;

// Initialize
chrome.storage.local.get(['enableTorrentLt', 'enableLinkomanija'], (result) => {
  if (result.enableTorrentLt !== undefined) isTorrentLtEnabled = result.enableTorrentLt;
  if (result.enableLinkomanija !== undefined) isLinkomanijaEnabled = result.enableLinkomanija;

  checkAndRun();
});

// Listen for changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    if (changes.enableTorrentLt) {
      isTorrentLtEnabled = changes.enableTorrentLt.newValue;
      checkAndRun();
    }
    if (changes.enableLinkomanija) {
      isLinkomanijaEnabled = changes.enableLinkomanija.newValue;
      checkAndRun();
    }
  }
});

let observer;
let observerTimeout;

function checkAndRun() {
  const hostname = window.location.hostname;
  let shouldRun = false;

  if (hostname.includes('torrent.lt') || hostname.includes('torrent.ai')) {
    shouldRun = isTorrentLtEnabled;
  } else if (hostname.includes('linkomanija.net')) {
    shouldRun = isLinkomanijaEnabled;
  }

  if (shouldRun) {
    if (!observer) startObserver();
    showPreviews();
    toggleGalleryView(true);
  } else {
    stopObserver();
    removePreviews(); // Optional: remove injected images if we want "pure" state
    toggleGalleryView(false); // Hide gallery, show original table
  }
}

function startObserver() {
  if (observer) return;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showPreviews);
  } else {
    showPreviews();
  }

  observer = new MutationObserver((mutations) => {
    if (observerTimeout) clearTimeout(observerTimeout);
    observerTimeout = setTimeout(() => {
      showPreviews();
    }, 500);
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function stopObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (observerTimeout) clearTimeout(observerTimeout);
}

function removePreviews() {
  const images = document.querySelectorAll('.preview-image');
  images.forEach(img => img.remove());
}

function showPreviews() {
  const hostname = window.location.hostname;
  if (hostname.includes('torrent.lt') || hostname.includes('torrent.ai')) {
    if (isTorrentLtEnabled) handleTorrentLt();
  } else if (hostname.includes('linkomanija.net')) {
    if (isLinkomanijaEnabled) handleLinkomanija();
  }
}

function handleTorrentLt() {
  const cells = document.querySelectorAll('.torrent-name_cell');

  cells.forEach(cell => {
    if (cell.querySelector('.preview-image')) return;
    if (processedElements.has(cell)) return;

    const link = cell.querySelector('a[data-poster-preview]');

    if (link) {
      processedElements.add(cell);
      const imageUrl = link.getAttribute('data-poster-preview');
      if (imageUrl) {
        // Extract metadata is now mostly done in gallery extraction, but we still inject images for backup list view?
        // User wants gallery view mostly. 
        // But we inject images into the cell just in case, or maybe to help extraction?
        // extractTorrentLtData uses data-poster-preview attribute which is already there.
        // But let's inject anyway for older behavior compatibility or if gallery fails.
        // Wait, injectImage adds .preview-wrapper.
        // Original logic injected images into the table structure.
        // We'll keep it for robustness.

        const row = cell.parentElement;
        let size = '';
        let seeds = '';
        let leeches = '';

        // Basic fallback extraction for list view injection
        if (row.cells.length >= 7) {
          size = row.cells[3].textContent.trim();
          seeds = row.cells[4].textContent.trim();
          leeches = row.cells[5].textContent.trim();
        }

        let downloadUrl = '';
        const downloadLink = row.querySelector('.download-button') || row.querySelector('a[href*="download.php"]');
        if (downloadLink) {
          downloadUrl = downloadLink.href;
        }

        injectImage(cell, imageUrl, size, seeds, leeches, downloadUrl);
      }
    }
  });
}

async function handleLinkomanija() {
  let rows = document.querySelectorAll('#content form[action="browse.php"] > table tr');
  if (rows.length === 0) {
    rows = document.querySelectorAll('#content table tr');
  }

  for (const row of rows) {
    if (row.querySelector('.preview-image')) continue;
    if (processedElements.has(row)) continue;

    const columns = row.querySelectorAll('td');
    const link = row.querySelector('a[href*="details"]');

    if (link) {
      if (!link.textContent.trim()) continue;

      processedElements.add(row);
      const detailsUrl = link.href;

      try {
        const cached = await getCache(detailsUrl);
        if (cached) {
          injectImage(link, cached, '', '', '');
          continue;
        }

        let imageUrl = await fetchPosterFromDetails(detailsUrl);

        if (!imageUrl) {
          imageUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWVlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyMCIgZmlsbD0iI2FhYSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tm8gUG9zdGVyPC90ZXh0Pjwvc3ZnPg==';
        }

        await setCache(detailsUrl, imageUrl);

        let size = '';
        let seeds = '';
        let leeches = '';

        if (row.cells.length >= 8) {
          if (/[\d\.]+\s*[KMGT]B/i.test(row.cells[5].textContent)) {
            size = row.cells[5].textContent.trim();
            seeds = row.cells[6].textContent.trim();
            leeches = row.cells[7].textContent.trim();
          } else if (/[\d\.]+\s*[KMGT]B/i.test(row.cells[4].textContent)) {
            size = row.cells[4].textContent.trim();
            seeds = row.cells[5].textContent.trim();
            leeches = row.cells[6].textContent.trim();
          }
        }

        let downloadUrl = '';
        const downloadLink = row.querySelector('a[href*="download.php"]');
        if (downloadLink) {
          downloadUrl = downloadLink.href;
        }

        injectImage(link, imageUrl, size, seeds, leeches, downloadUrl);
      } catch (err) {
        console.error('Failed to fetch/parse poster for', detailsUrl, err);
      }
    }
  }
}

// Storage wrappers
function getCache(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key]);
    });
  });
}

function setCache(key, value) {
  return new Promise((resolve) => {
    const obj = {};
    obj[key] = value;
    chrome.storage.local.set(obj, () => {
      resolve();
    });
  });
}

async function fetchPosterFromDetails(url) {
  try {
    const response = await fetch(url);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');

    const descr = doc.querySelector('.descr_text');
    let images = [];
    if (descr) {
      images = descr.querySelectorAll('img');
    }

    if (!images || images.length === 0) {
      images = doc.querySelectorAll('#content img');
    }

    for (const img of images) {
      const src = img.getAttribute('src') || '';
      if (!src) continue;

      const lowerSrc = src.toLowerCase();
      if (lowerSrc.includes('cat_') || lowerSrc.includes('arrow') || lowerSrc.includes('button') || lowerSrc.includes('stars') || lowerSrc.includes('rss') || lowerSrc.includes('facebook') || lowerSrc.includes('twitter')) continue;

      const w = parseInt(img.getAttribute('width')) || 0;
      const h = parseInt(img.getAttribute('height')) || 0;

      if (w > 0 && w < 50) continue;
      if (h > 0 && h < 50) continue;

      return src;
    }
    return null;
  } catch (e) {
    return null;
  }
}

function injectImage(container, url, size, seeds, leeches, downloadUrl) {
  if (container.querySelector('.preview-image')) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'preview-wrapper';
  wrapper.style.position = 'relative';

  const img = document.createElement('img');
  img.src = url;
  img.classList.add('preview-image');

  wrapper.appendChild(img);

  if (size) {
    const sizeBadge = document.createElement('div');
    sizeBadge.className = 'meta-badge meta-size';
    sizeBadge.textContent = size;
    if (downloadUrl) {
      sizeBadge.style.cursor = 'pointer';
      sizeBadge.title = 'Download .torrent';
      sizeBadge.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = downloadUrl;
      };
    }
    wrapper.appendChild(sizeBadge);
  }

  if (seeds !== '' && leeches !== '') {
    const peersBadge = document.createElement('div');
    peersBadge.className = 'meta-badge meta-peers';
    const sSpan = document.createElement('span');
    sSpan.className = 'seeds-count';
    sSpan.textContent = seeds;

    const lSpan = document.createElement('span');
    lSpan.className = 'leeches-count';
    lSpan.textContent = leeches;

    peersBadge.appendChild(sSpan);
    peersBadge.appendChild(document.createTextNode(' / '));
    peersBadge.appendChild(lSpan);

    if (downloadUrl) {
      peersBadge.style.cursor = 'pointer';
      peersBadge.title = 'Download .torrent';
      peersBadge.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = downloadUrl;
      };
    }

    wrapper.appendChild(peersBadge);
  }

  container.appendChild(wrapper);

  // If active, update gallery
  if (document.body.classList.contains('gallery-view-active')) {
    let href = '';
    if (container.tagName === 'A') {
      href = container.href;
    } else {
      const l = container.querySelector('a');
      if (l) href = l.href;
    }

    if (href) {
      const galleryContainer = document.getElementById('gallery-view-container');
      if (galleryContainer) {
        let card = galleryContainer.querySelector(`.gallery-card a[href="${href}"]`);
        if (card) {
          const cardImg = card.closest('.gallery-card').querySelector('.card-image');
          // Update downloadUrl on the existing card badges if needed, but usually we just regenerate if data changes.
          // For now, assume regeneration or that badges are fine.
          if (cardImg) cardImg.src = url;
          else {
            const wrapper = card.closest('.gallery-card').querySelector('.card-image-wrapper');
            wrapper.innerHTML = '';
            const img = document.createElement('img');
            img.src = url;
            img.className = 'card-image';
            wrapper.appendChild(img);
          }
        } else {
          debounceRefreshGallery();
        }
      }
    }
  }
}

let refreshTimeout;
function debounceRefreshGallery() {
  if (refreshTimeout) clearTimeout(refreshTimeout);
  refreshTimeout = setTimeout(() => {
    const c = document.getElementById('gallery-view-container');
    if (c) generateGalleryCards(c);
  }, 500);
}

function toggleGalleryView(active) {
  const containerId = 'gallery-view-container';
  let container = document.getElementById(containerId);

  if (active) {
    document.body.classList.add('gallery-view-active');

    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      const mainTable = findMainTable();
      if (mainTable) {
        mainTable.parentNode.insertBefore(container, mainTable);
      } else {
        document.body.appendChild(container);
      }
    }

    generateGalleryCards(container);
    container.style.display = 'grid';

  } else {
    document.body.classList.remove('gallery-view-active');
    if (container) {
      container.style.display = 'none';
      container.innerHTML = '';
    }
  }
}

function findMainTable() {
  const hostname = window.location.hostname;
  if (hostname.includes('torrent.lt') || hostname.includes('torrent.ai')) {
    return document.querySelector('.torrents-table');
  } else if (hostname.includes('linkomanija.net')) {
    let table = document.querySelector('#content form[action="browse.php"] > table:not(.bottom)');
    if (!table) {
      const tables = document.querySelectorAll('#content form[action="browse.php"] > table');
      if (tables.length > 1) table = tables[tables.length - 1];
      else if (tables.length === 1) table = tables[0];
    }
    return table || document.querySelector('#content table[width="100%"]');
  }
  return null;
}

function generateGalleryCards(container) {
  container.innerHTML = '';

  const hostname = window.location.hostname;
  let items = [];

  if (hostname.includes('torrent.lt') || hostname.includes('torrent.ai')) {
    items = extractTorrentLtData();
  } else if (hostname.includes('linkomanija.net')) {
    items = extractLinkomanijaData();
  }

  items.forEach(item => {
    const card = createGalleryCard(item);
    container.appendChild(card);
  });
}

function createGalleryCard(item) {
  const card = document.createElement('div');
  card.className = 'gallery-card';

  const imgWrapper = document.createElement('a');
  imgWrapper.className = 'card-image-wrapper';
  imgWrapper.href = item.link;
  imgWrapper.style.display = 'block';

  if (item.poster) {
    const img = document.createElement('img');
    img.src = item.poster;
    img.className = 'card-image';
    imgWrapper.appendChild(img);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'card-no-image';
    placeholder.textContent = 'No Image';
    imgWrapper.appendChild(placeholder);
  }

  if (item.size) {
    const sizeBadge = document.createElement('div');
    sizeBadge.className = 'meta-badge meta-size';
    sizeBadge.textContent = item.size;

    if (item.downloadUrl) {
      sizeBadge.style.cursor = 'pointer';
      sizeBadge.title = 'Download .torrent';
      sizeBadge.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = item.downloadUrl;
      };
    }

    imgWrapper.appendChild(sizeBadge);
  }

  if (item.seeds !== '' && item.leeches !== '') {
    const peersBadge = document.createElement('div');
    peersBadge.className = 'meta-badge meta-peers';
    const sSpan = document.createElement('span');
    sSpan.className = 'seeds-count';
    sSpan.textContent = item.seeds;

    const lSpan = document.createElement('span');
    lSpan.className = 'leeches-count';
    lSpan.textContent = item.leeches;

    peersBadge.appendChild(sSpan);
    peersBadge.appendChild(document.createTextNode(' / '));
    peersBadge.appendChild(lSpan);

    if (item.downloadUrl) {
      peersBadge.style.cursor = 'pointer';
      peersBadge.title = 'Download .torrent';
      peersBadge.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = item.downloadUrl;
      };
    }

    imgWrapper.appendChild(peersBadge);
  }

  const titleDiv = document.createElement('div');
  titleDiv.className = 'card-title';
  const link = document.createElement('a');
  link.href = item.link;
  link.textContent = item.title;
  titleDiv.appendChild(link);

  card.appendChild(imgWrapper);
  card.appendChild(titleDiv);

  return card;
}

function extractTorrentLtData() {
  const data = [];
  const rows = document.querySelectorAll('.torrents-table__name-row');

  rows.forEach(row => {
    let link = row.querySelector('a[data-poster-preview]') || row.querySelector('a[href*="details"]');
    if (!link) return;

    const poster = link.getAttribute('data-poster-preview');
    const title = link.textContent.trim();
    const href = link.href;

    const seedsCell = row.querySelector('.seeders_cell');
    const leechesCell = row.querySelector('.leechers_cell');
    const seeds = seedsCell ? seedsCell.textContent.trim() : '';
    const leeches = leechesCell ? leechesCell.textContent.trim() : '';

    let size = '';
    const infoRow = row.nextElementSibling;
    if (infoRow && infoRow.classList.contains('torrents-table__info-row')) {
      const sizeCell = infoRow.querySelector('.size_cell');
      if (sizeCell) size = sizeCell.textContent.trim();
    }

    let downloadUrl = '';
    const downloadLink = row.querySelector('.download-button') || (infoRow ? infoRow.querySelector('.download-button') : null) || row.querySelector('a[href*="download.php"]') || (infoRow ? infoRow.querySelector('a[href*="download.php"]') : null);
    if (downloadLink) {
      downloadUrl = downloadLink.href;
    }

    if (poster) {
      data.push({ title, link: href, poster, size, seeds, leeches, downloadUrl });
    }
  });
  return data;
}

function extractLinkomanijaData() {
  const data = [];
  let rows = document.querySelectorAll('#content form[action="browse.php"] > table tr');
  if (rows.length === 0) {
    rows = document.querySelectorAll('#content table tr');
  }

  rows.forEach(row => {
    const link = row.querySelector('a[href*="details"]');
    if (!link) return;

    const title = link.textContent.trim();
    if (!title) return;

    const href = link.href;

    const injectedImg = link.querySelector('img.preview-image') || row.querySelector('img.preview-image');
    let poster = injectedImg ? injectedImg.src : null;

    let size = '';
    let seeds = '';
    let leeches = '';

    if (row.cells.length >= 8) {
      if (/[\d\.]+\s*[KMGT]B/i.test(row.cells[5].textContent)) {
        size = row.cells[5].textContent.trim();
        seeds = row.cells[6].textContent.trim();
        leeches = row.cells[7].textContent.trim();
      } else if (/[\d\.]+\s*[KMGT]B/i.test(row.cells[4].textContent)) {
        size = row.cells[4].textContent.trim();
        seeds = row.cells[5].textContent.trim();
        leeches = row.cells[6].textContent.trim();
      }
    }

    let downloadUrl = '';
    const downloadLink = row.querySelector('a[href*="download.php"]');
    if (downloadLink) {
      downloadUrl = downloadLink.href;
    }

    if (poster) {
      data.push({ title, link: href, poster, size, seeds, leeches, downloadUrl });
    }
  });
  return data;
}
