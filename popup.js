// 1. WHEN POPUP OPENS: Load existing data
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['recapData', 'lastUpdated'], (result) => {
    if (result.recapData) {
      document.getElementById('status').textContent = `Last updated: ${result.lastUpdated}`;
      displayResults(result.recapData);
    } else {
      document.getElementById('status').textContent = "No data yet. Click the button to start.";
    }
  });
});

// 2. WHEN BUTTON CLICKED: Start fresh scan
document.getElementById('syncBtn').addEventListener('click', () => {
  chrome.tabs.create({url: 'recap.html'});
});

function displayResults(items) {
  const container = document.getElementById('results');
  container.innerHTML = "<h3>Top Creators</h3>";

  if (items.length === 0) {
    container.innerHTML += "<p>No videos found.</p>";
    return;
  }

  items.slice(0, 10).forEach(item => {
    const div = document.createElement('div');
    div.className = 'item';

    // Make the item clickable to see details in console (simple debugging)
    div.title = "Click to log details to console";
    div.style.cursor = "pointer";
    div.onclick = () => console.log(`Videos for ${item.name}:`, item);

    div.innerHTML = `<span>${item.name}</span> <span class="count">${item.count}</span>`;
    container.appendChild(div);
  });
}
