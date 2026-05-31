// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const id = this.getAttribute('href');
        if (id === '#') return;
        const el = document.querySelector(id);
        if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
    });
});

// ===== LIVE STOCK TICKER =====
const TICKERS = [
  'sp500', 'dow', 'nasdaq', 'sep1',
  'ftse', 'nikkei', 'dax', 'sep2',
  'hsi', 'asx', 'sep3',
  'gold', 'silver', 'crude', 'sep4',
  'natgas', 'copper', 'platinum'
];

function formatPrice(val) {
  const n = parseFloat(val);
  if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n.toFixed(2);
}

function buildTickerHTML(items, duplicate) {
  let html = '';
  const list = duplicate ? [...items, ...items] : items;
  list.forEach(item => {
    if (item === 'sep1' || item === 'sep2' || item === 'sep3' || item === 'sep4') {
      html += '<div class="ticker-sep">•</div>';
    } else {
      html += `<div class="ticker-item">
        <span class="ticker-label">${item.name}</span>
        <span class="ticker-value">${formatPrice(item.price)}</span>
        <span class="ticker-change ${item.direction}">${item.changePercent >= 0 ? '+' : ''}${item.changePercent}%</span>
      </div>`;
    }
  });
  return html;
}

let tickerAnimation = null;

function populateTicker(data) {
  const container = document.getElementById('stockTicker');
  if (!container) return;

  const ordered = TICKERS.map(key => {
    if (key.startsWith('sep')) return key;
    return data.find(d => d.key === key) || null;
  }).filter(Boolean);

  // Build map for lookup
  const dataMap = {};
  data.forEach(d => { dataMap[d.key] = d; });

  const items = TICKERS.map(key => {
    if (key.startsWith('sep')) return key;
    return dataMap[key] || null;
  }).filter(Boolean);

  container.innerHTML = buildTickerHTML(items, true);

  // Start scroll animation
  if (tickerAnimation) { cancelAnimationFrame(tickerAnimation); tickerAnimation = null; }

  let pos = 0;
  const speed = 0.4;
  function animate() {
    pos -= speed;
    const half = container.scrollWidth / 2;
    if (pos <= -half) pos = 0;
    container.style.transform = 'translateX(' + pos + 'px)';
    tickerAnimation = requestAnimationFrame(animate);
  }
  animate();
}

function fetchStocks() {
  fetch('/api/stock')
    .then(r => r.json())
    .then(res => {
      if (res.data && res.data.length > 0) {
        populateTicker(res.data);
      } else {
        populateTicker(getDemoStockData());
      }
    })
    .catch(() => populateTicker(getDemoStockData()));
}

function getDemoStockData() {
  return [
    { key:'sp500', name:'S&P 500', price:'5238.42', change:'42.68', changePercent:'+0.82', direction:'up' },
    { key:'dow', name:'Dow Jones', price:'39847.15', change:'253.40', changePercent:'+0.64', direction:'up' },
    { key:'nasdaq', name:'NASDAQ', price:'18654.33', change:'206.15', changePercent:'+1.12', direction:'up' },
    { key:'ftse', name:'FTSE 100', price:'8246.10', change:'-19.20', changePercent:'-0.23', direction:'down' },
    { key:'nikkei', name:'Nikkei 225', price:'39102.50', change:'558.90', changePercent:'+1.45', direction:'up' },
    { key:'dax', name:'DAX', price:'18625.80', change:'68.40', changePercent:'+0.37', direction:'up' },
    { key:'hsi', name:'Hang Seng', price:'18945.30', change:'-97.30', changePercent:'-0.51', direction:'down' },
    { key:'asx', name:'ASX 200', price:'7834.60', change:'21.80', changePercent:'+0.28', direction:'up' },
    { key:'gold', name:'Gold', price:'2356.80', change:'7.30', changePercent:'+0.31', direction:'up' },
    { key:'silver', name:'Silver', price:'31.84', change:'0.29', changePercent:'+0.92', direction:'up' },
    { key:'crude', name:'Crude Oil', price:'78.42', change:'-0.53', changePercent:'-0.67', direction:'down' },
    { key:'natgas', name:'Nat Gas', price:'2.89', change:'0.06', changePercent:'+2.14', direction:'up' },
    { key:'copper', name:'Copper', price:'4.73', change:'0.03', changePercent:'+0.55', direction:'up' },
    { key:'platinum', name:'Platinum', price:'1024.50', change:'-1.85', changePercent:'-0.18', direction:'down' }
  ];
}

fetchStocks();
setInterval(fetchStocks, 180000); // refresh every 3 min

// ===== LIVE NEWS TICKER (multi-source) =====
const NEWS_FEEDS = [
  { name: 'BBC', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { name: 'NYT', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml' }
];
const RSS_PROXY = 'https://api.rss2json.com/v1/api.json?rss_url=';

function renderNews(items) {
  const track = document.getElementById('newsTrack');
  if (!track) return;
  let html = '';
  items.forEach((item, i) => {
    const src = item.source || 'News';
    html += `<span class="news-item">📰 ${item.title} <span style="opacity:0.5;font-size:0.75rem;">— ${src}</span></span>`;
  });
  track.innerHTML = html + html;
  let pos = 0;
  const speed = 0.6;
  function animate() {
    pos -= speed;
    if (pos <= -(track.scrollWidth / 2)) pos = 0;
    track.style.transform = 'translateX(' + pos + 'px)';
    requestAnimationFrame(animate);
  }
  animate();
}

function fetchNews() {
  const track = document.getElementById('newsTrack');
  if (!track) return;

  // Try multiple feeds, use first that succeeds
  let tried = 0;

  function tryFeed(index) {
    if (index >= NEWS_FEEDS.length) {
      renderNews(getFallbackNews());
      return;
    }
    const feed = NEWS_FEEDS[index];
    fetch(RSS_PROXY + encodeURIComponent(feed.url))
      .then(r => r.json())
      .then(data => {
        if (data.status === 'ok' && data.items && data.items.length > 0) {
          const items = data.items.slice(0, 15).map(i => ({
            title: i.title,
            source: feed.name
          }));
          renderNews(items);
        } else {
          tryFeed(index + 1);
        }
      })
      .catch(() => tryFeed(index + 1));
  }
  tryFeed(0);
}

function getFallbackNews() {
  return [
    { title: 'Global markets track record highs amid economic recovery', source: 'Reuters' },
    { title: 'Tech sector leads gains on AI innovation wave', source: 'Bloomberg' },
    { title: 'Central banks maintain cautious monetary policy stance', source: 'Financial Times' },
    { title: 'Oil markets stabilize as OPEC maintains output targets', source: 'CNBC' },
    { title: 'Asia-Pacific trade volumes rise on improved demand outlook', source: 'Nikkei Asia' },
    { title: 'Gold prices supported by persistent inflation concerns', source: 'Reuters' },
    { title: 'European stocks open higher on positive earnings season', source: 'BBC News' },
    { title: 'Emerging market currencies strengthen against US dollar', source: 'Bloomberg' }
  ];
}

fetchNews();
