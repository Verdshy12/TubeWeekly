// 1. Start the process immediately when tab opens
document.addEventListener('DOMContentLoaded', () => {
  const status = document.getElementById('statusText');

  // Ask Background script to scrape
  chrome.runtime.sendMessage({ action: "startScraping" }, (response) => {
    if (chrome.runtime.lastError) {
      status.innerText = "Error: " + chrome.runtime.lastError.message;
    }
  });

  // Listen for progress updates or completion
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "updateStatus") {
      status.innerText = msg.text;
    }
    else if (msg.action === "dataReady") {
      renderDashboard(msg.data);
    }
  });
});

function renderDashboard(data) {
  document.getElementById('loader').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';

  // --- A. CALCULATE HOURS ---
  let totalSeconds = 0;
  let musicCount = 0;
  let otherCount = 0;

  data.forEach(video => {
    totalSeconds += video.duration; // We will scrape this as seconds

    // Simple Keyword Categorization
    const lowerTitle = video.title.toLowerCase();
    const isMusic = lowerTitle.includes('official video') ||
                    lowerTitle.includes('lyrics') ||
                    lowerTitle.includes('audio') ||
                    video.channel.includes('VEVO');

    if (isMusic) musicCount++; else otherCount++;
  });

  const totalHours = (totalSeconds / 3600).toFixed(1);
  document.getElementById('totalHours').innerText = `${totalHours} hrs`;

  // --- B. CALCULATE PERCENTAGES ---
  const totalVids = musicCount + otherCount;
  const musicPct = Math.round((musicCount / totalVids) * 100);

  const barHTML = `
    <div class="bar-container">
      <div class="bar-label"><span>Music</span> <span>${musicPct}%</span></div>
      <div class="bar-bg"><div class="bar-fill" style="width:${musicPct}%"></div></div>
    </div>
    <div class="bar-container">
      <div class="bar-label"><span>Content</span> <span>${100 - musicPct}%</span></div>
      <div class="bar-bg"><div class="bar-fill" style="background:#444; width:${100 - musicPct}%"></div></div>
    </div>
  `;
  document.getElementById('musicBar').innerHTML = barHTML;

  // --- C. TOP CREATORS ---
  const creatorCounts = {};
  data.forEach(v => { creatorCounts[v.channel] = (creatorCounts[v.channel] || 0) + 1; });

  const sortedCreators = Object.entries(creatorCounts)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 5); // Top 5

  const listDiv = document.getElementById('topCreatorsList');
  sortedCreators.forEach(([name, count]) => {
    listDiv.innerHTML += `
      <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #333;">
        <span>${name}</span> <span style="color:#ff0000; font-weight:bold;">${count} vids</span>
      </div>`;
  });
}
