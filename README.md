# Torrent Posters Preview

**Torrent Posters Preview** is a lightweight Chrome extension that enhances your browsing experience on Lithuanian torrent trackers (`torrent.lt` / `torrent.ai` and `linkomanija.net`) by adding visual previews and a modern gallery layout.

## Features

### 🖼️ Modern Gallery View
Transform the old-school list view into a **modern, responsive grid layout**.
-   **Visual Browsing:** Browse torrents by their poster images.
-   **Metadata Badges:** See essential info at a glance:
    -   **File Size** (Top Left)
    -   **Seeders / Leechers** (Top Right)
-   **Clickable Posters:** Click any poster to go directly to the torrent details page.
-   **Refined Design:** Clean typography, hover effects, and dark-mode friendly styles.

### ⚡ Automatic Previews
If you prefer the classic list view, the extension can simply insert poster previews directly into the table rows.

### 🚀 Performance & Privacy
-   **Smart Caching:** Images are cached locally in your browser to load lists instantly on repeat visits and save bandwidth.
-   **Privacy Focused:** No tracking, no external servers. All processing happens locally on your device.
-   **Toggleable:** Easily switch between **Gallery View** and **List View**, or disable the extension entirely via the popup menu.

## Supported Sites
-   `torrent.lt` / `torrent.ai`
-   `linkomanija.net`

## Installation

### From Source (Developer Mode)
1.  Clone or download this repository.
2.  Open Chrome and navigate to `chrome://extensions/`.
3.  Enable **Developer mode** in the top-right corner.
4.  Click **Load unpacked**.
5.  Select the folder containing this extension's files.

## Usage

1.  **Visit a supported site** (e.g., `torrent.lt/lt/torrents`).
2.  **Gallery Mode:** By default, the extension may enable Gallery View. You will see a grid of posters instead of the text list.
3.  **Controls:** Click the extension icon in your browser toolbar to:
    -   Toggle **Enable Extension** (on/off) global switch.
    -   Toggle **Gallery View** (switch between Grid and List layouts).
    -   Toggle **Enable on [Site]** (enable/disable for specific trackers).
    -   Clear Cache

## Privacy Policy

This extension respects your privacy.
-   **No Analytics:** We do not track your browsing history or collect personal data.
-   **Local Storage:** All cached images and settings are stored locally on your machine (`chrome.storage.local`).
-   **Direct Connections:** Image requests are made directly from your browser to the source (or cached).

[MIT License](LICENSE)
