chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startScraping") {
    runScraper(sender.tab.id); // Pass the ID of the recap tab to send data back
    return true;
  }
});

async function runScraper(targetTabId) {
  // 1. Create hidden tab
  const tab = await chrome.tabs.create({ url: 'https://www.youtube.com/feed/history', active: false });

  // 2. Wait for load
  chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
    if (tabId === tab.id && info.status === 'complete') {
      chrome.tabs.onUpdated.removeListener(listener);

      // 3. Inject Scraper
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: scrapeWithDuration
      }, (results) => {
        chrome.tabs.remove(tab.id); // Close hidden tab

        // 4. Send data to the Recap Tab
        if (results && results[0]) {
          chrome.tabs.sendMessage(targetTabId, {
            action: "dataReady",
            data: results[0].result
          });
        }
      });
    }
  });
}

// --- THE SCRAPER FUNCTION ---
async function scrapeWithDuration() {
  const MAX_SCROLLS = 40; // More scrolls for 28 days
  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  // Helper to parse "3:20" into 200 seconds
  const parseDuration = (str) => {
    if (!str) return 0;
    const parts = str.split(':').map(Number);
    if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
    if (parts.length === 2) return parts[0]*60 + parts[1];
    return 0;
  };

  // Helper to check if string implies > 1 month
  const isTooOld = (str) => str.includes('month') || str.includes('year');

  for (let i = 0; i < MAX_SCROLLS; i++) {
    window.scrollTo(0, document.documentElement.scrollHeight);
    await wait(1500);

    // Optional: Check the last visible date to see if we should stop early
    // (This is hard to do reliably on all layouts, so we rely on simple scrolling for now)
  }

  const scrapedItems = [];
  const cards = document.querySelectorAll('.yt-lockup-view-model');

  cards.forEach(card => {
    // A. Channel & Title (Using our proven "Text Strategy")
    const titleEl = card.querySelector('.yt-lockup-metadata-view-model__title');
    const title = titleEl ? titleEl.innerText.trim() : "Unknown";

    let channel = "Unknown";
    const textSpans = card.querySelectorAll('.yt-content-metadata-view-model__metadata-text');
    if (textSpans.length > 0) channel = textSpans[0].innerText.trim();

    // B. Duration (Look for the overlay badge)
    const badge = card.querySelector('.yt-badge-shape__text'); // Class for "4:32"
    const durationText = badge ? badge.innerText.trim() : "0:00";
    const durationSeconds = parseDuration(durationText);

    // C. Date (Look for "2 days ago")
    // Usually the 3rd item in textSpans, or scraped from description
    // For simplicity, we save all and filter in JS if needed

    if (title.length > 2) {
      scrapedItems.push({ title, channel, duration: durationSeconds });
    }
  });

  return scrapedItems;
}
