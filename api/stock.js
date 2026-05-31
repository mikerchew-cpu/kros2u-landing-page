const TICKERS = [
  { key: 'sp500', name: 'S&P 500', symbol: '^GSPC' },
  { key: 'dow', name: 'Dow Jones', symbol: '^DJI' },
  { key: 'nasdaq', name: 'NASDAQ', symbol: '^IXIC' },
  { key: 'ftse', name: 'FTSE 100', symbol: '^FTSE' },
  { key: 'nikkei', name: 'Nikkei 225', symbol: '^N225' },
  { key: 'dax', name: 'DAX', symbol: '^GDAXI' },
  { key: 'hsi', name: 'Hang Seng', symbol: '^HSI' },
  { key: 'asx', name: 'ASX 200', symbol: '^AXJO' },
  { key: 'gold', name: 'Gold', symbol: 'GC=F' },
  { key: 'silver', name: 'Silver', symbol: 'SI=F' },
  { key: 'crude', name: 'Crude Oil', symbol: 'CL=F' },
  { key: 'natgas', name: 'Nat Gas', symbol: 'NG=F' },
  { key: 'copper', name: 'Copper', symbol: 'HG=F' },
  { key: 'platinum', name: 'Platinum', symbol: 'PL=F' }
];

const DEMO = [
  { key:'sp500', name:'S&P 500', price:'5238.42', changePercent:'+0.82', direction:'up' },
  { key:'dow', name:'Dow Jones', price:'39847.15', changePercent:'+0.64', direction:'up' },
  { key:'nasdaq', name:'NASDAQ', price:'18654.33', changePercent:'+1.12', direction:'up' },
  { key:'ftse', name:'FTSE 100', price:'8246.10', changePercent:'-0.23', direction:'down' },
  { key:'nikkei', name:'Nikkei 225', price:'39102.50', changePercent:'+1.45', direction:'up' },
  { key:'dax', name:'DAX', price:'18625.80', changePercent:'+0.37', direction:'up' },
  { key:'hsi', name:'Hang Seng', price:'18945.30', changePercent:'-0.51', direction:'down' },
  { key:'asx', name:'ASX 200', price:'7834.60', changePercent:'+0.28', direction:'up' },
  { key:'gold', name:'Gold', price:'2356.80', changePercent:'+0.31', direction:'up' },
  { key:'silver', name:'Silver', price:'31.84', changePercent:'+0.92', direction:'up' },
  { key:'crude', name:'Crude Oil', price:'78.42', changePercent:'-0.67', direction:'down' },
  { key:'natgas', name:'Nat Gas', price:'2.89', changePercent:'+2.14', direction:'up' },
  { key:'copper', name:'Copper', price:'4.73', changePercent:'+0.55', direction:'up' },
  { key:'platinum', name:'Platinum', price:'1024.50', changePercent:'-0.18', direction:'down' }
];

function getDemoData() {
  const now = new Date();
  const seed = now.getMinutes() + now.getHours() * 60;
  return DEMO.map((d, i) => {
    const base = parseFloat(d.price);
    const jitter = Math.sin(seed * 0.1 + i * 1.5) * base * 0.003;
    return { ...d, price: Math.max(base + jitter, 0.01).toFixed(2) };
  });
}

async function tryYahoo() {
  const symbols = TICKERS.map(t => t.symbol).join(',');
  const url = 'https://query1.finance.yahoo.com/v7/finance/quote?symbols=' + symbols;
  const r = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Accept': 'application/json',
      'Origin': 'https://finance.yahoo.com',
      'Referer': 'https://finance.yahoo.com/'
    }
  });
  if (!r.ok) throw new Error('Status ' + r.status);
  const j = await r.json();
  return j.quoteResponse?.result || [];
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate');

  try {
    const results = await tryYahoo();
    if (results.length > 0) {
      const map = {};
      results.forEach(r => { map[r.symbol] = r; });
      const data = TICKERS.map(t => {
        const r = map[t.symbol];
        if (!r) return null;
        const price = r.regularMarketPrice || 0;
        const change = r.regularMarketChange || 0;
        const changePercent = r.regularMarketChangePercent || 0;
        return {
          key: t.key, name: t.name,
          price: price.toFixed(2),
          changePercent: (changePercent >= 0 ? '+' : '') + changePercent.toFixed(2),
          direction: change >= 0 ? 'up' : 'down'
        };
      }).filter(Boolean);
      if (data.length > 0) return res.json({ data, source: 'yahoo', timestamp: Date.now() });
    }
    res.json({ data: getDemoData(), source: 'demo', timestamp: Date.now() });
  } catch {
    res.json({ data: getDemoData(), source: 'demo', timestamp: Date.now() });
  }
}
