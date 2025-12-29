document.addEventListener('DOMContentLoaded', () => {
    const torrentLtCheckbox = document.getElementById('enableTorrentLt');
    const linkomanijaCheckbox = document.getElementById('enableLinkomanija');
    const clearBtn = document.getElementById('clearCache');
    const statusDiv = document.getElementById('status');

    // Load current settings
    chrome.storage.local.get(['enableTorrentLt', 'enableLinkomanija'], (result) => {
        if (result.enableTorrentLt === undefined) torrentLtCheckbox.checked = true;
        else torrentLtCheckbox.checked = result.enableTorrentLt;

        if (result.enableLinkomanija === undefined) linkomanijaCheckbox.checked = true;
        else linkomanijaCheckbox.checked = result.enableLinkomanija;
    });

    torrentLtCheckbox.addEventListener('change', () => {
        const isEnabled = torrentLtCheckbox.checked;
        chrome.storage.local.set({ enableTorrentLt: isEnabled }, () => {
            showStatus('Settings saved.');
        });
    });

    linkomanijaCheckbox.addEventListener('change', () => {
        const isEnabled = linkomanijaCheckbox.checked;
        chrome.storage.local.set({ enableLinkomanija: isEnabled }, () => {
            showStatus('Settings saved.');
        });
    });

    // Clear cache
    clearBtn.addEventListener('click', () => {
        chrome.storage.local.clear(() => {
            // Restore the settings because clear() wipes everything including settings!
            const isTorrentLtEnabled = torrentLtCheckbox.checked;
            const isLinkomanijaEnabled = linkomanijaCheckbox.checked;

            chrome.storage.local.set({
                enableTorrentLt: isTorrentLtEnabled,
                enableLinkomanija: isLinkomanijaEnabled
            }, () => {
                showStatus('Cache cleared!');
            });
        });
    });

    function showStatus(msg) {
        statusDiv.textContent = msg;
        setTimeout(() => {
            statusDiv.textContent = '';
        }, 2000);
    }
});
