// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Live News Ticker
const SOURCES = [
    { name: 'BBC', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
    { name: 'Reuters', url: 'https://www.reutersagency.com/feed/' },
    { name: 'Google News', url: 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en' }
];

const PROXY = 'https://api.rss2json.com/v1/api.json?rss_url=';

function fetchNews() {
    const track = document.getElementById('newsTrack');
    if (!track) return;

    // Try BBC first
    fetch(PROXY + encodeURIComponent(SOURCES[0].url))
        .then(r => r.json())
        .then(data => {
            if (data.status === 'ok' && data.items && data.items.length > 0) {
                renderNews(data.items.slice(0, 12));
            } else {
                fallbackNews();
            }
        })
        .catch(() => fallbackNews());
}

function renderNews(items) {
    const track = document.getElementById('newsTrack');
    if (!track) return;

    // Build a string of headlines separated by a divider
    let html = '';
    items.forEach((item, i) => {
        const title = item.title || '';
        const source = item.author || 'BBC News';
        html += `<span class="news-item">📰 ${title} <span style="opacity:0.5;font-size:0.75rem;">— ${source}</span></span>`;
    });
    // Duplicate for seamless loop
    track.innerHTML = html + html;

    // Animate via CSS transform
    const scrollWidth = track.scrollWidth / 2;
    let pos = 0;
    const speed = 0.5; // px per frame

    function animate() {
        pos -= speed;
        if (pos <= -scrollWidth) {
            pos = 0;
        }
        track.style.transform = 'translateX(' + pos + 'px)';
        requestAnimationFrame(animate);
    }
    animate();
}

function fallbackNews() {
    const headlines = [
        "Global markets react to latest economic data — Reuters",
        "Tech stocks rally on AI optimism — Bloomberg",
        "Central banks hold steady on interest rates — Financial Times",
        "Oil prices fluctuate amid supply concerns — BBC News",
        "Asia-Pacific markets mixed in morning trading — CNBC",
        "Gold hits new milestone as investors seek safety — Reuters",
        "Federal Reserve signals cautious approach — Wall Street Journal",
        "European markets open higher on positive earnings — FT",
        "Emerging market currencies strengthen — Bloomberg",
        "Bitcoin breaks resistance level — CoinDesk"
    ];
    renderNews(headlines.map(h => ({ title: h.split(' — ')[0], author: h.split(' — ')[1] })));
}

fetchNews();
