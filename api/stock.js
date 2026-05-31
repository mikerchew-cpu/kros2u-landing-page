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

const SYMBOL_TO_KEY = {};
TICKERS.forEach(t => { SYMBOL_TO_KEY[t.symbol] = t; });

const DEMO = [
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

async function tryYahoo() {
  const symbols = TICKERS.map(t => t.symbol).join(',');
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Origin': 'https://finance.yahoo.com',
      'Referer': 'https://finance.yahoo.com/'
    }
  });

  if (!response.ok) {
    throw new Error(`Yahoo returned ${response.status}`);
  }

  const json = await response.json();
  const results = json.quoteResponse?.result;

  if (!results || !Array.isArray(results) || results.length === 0) {
    throw new Error('No results from Yahoo');
  }

  return results.map(r => {
    const ticker = SYMBOL_TO_KEY[r.symbol];
    if (!ticker) return null;
    const price = r.regularMarketPrice || 0;
    const change = r.regularMarketChange || 0;
    const changePercent = r.regularMarketChangePercent || 0;
    return {
      key: ticker.key, name: ticker.name,
      price: price.toFixed(2), change: change.toFixed(2),
      changePercent: (changePercent >= 0 ? '+' : '') + changePercent.toFixed(2),
      direction: change >= 0 ? 'up' : 'down'
    };
  }).filter(Boolean);
}

function getDemoData() {
  const now = new Date();
  const seed = now.getMinutes() + now.getHours() * 60;
  return DEMO.map(d => ({
    ...d,
    price: (parseFloat(d.price) + Math.sin(seed + TICKERS.findIndex(t => t.key === d.key)) * 10).toFixed(2)
  }));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate');

  try {
    const data = await tryYahoo();
    res.json({ data, source: 'yahoo', timestamp: Date.now() });
  } catch (err) {
    res.json({ data: getDemoData(), source: 'demo', timestamp: Date.now() });
  }
}
