document.addEventListener('DOMContentLoaded', () => {
    const enableCheckbox = document.getElementById('enablePreviews');
    const clearBtn = document.getElementById('clearCache');
    const statusDiv = document.getElementById('status');

    // Load current settings
    chrome.storage.local.get(['enablePreviews'], (result) => {
        // Default to true if not set
        if (result.enablePreviews === undefined) {
            enableCheckbox.checked = true;
        } else {
            enableCheckbox.checked = result.enablePreviews;
        }
    });

    // Save settings on change
    enableCheckbox.addEventListener('change', () => {
        const isEnabled = enableCheckbox.checked;
        chrome.storage.local.set({ enablePreviews: isEnabled }, () => {
            showStatus('Settings saved. Reload page to apply.');
        });
    });

    // Clear cache
    clearBtn.addEventListener('click', () => {
        chrome.storage.local.clear(() => {
            // Restore the setting because clear() wipes everything including settings!
            // Wait, we probably want to separate cache from settings, or just re-save settings.
            // Let's re-save the current setting immediately.
            const isEnabled = enableCheckbox.checked;
            chrome.storage.local.set({ enablePreviews: isEnabled }, () => {
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
