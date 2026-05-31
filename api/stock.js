const TICKERS = [
  { key: 'sp500', name: 'S&P 500', symbol: '^GSPC', av: '.INX' },
  { key: 'dow', name: 'Dow Jones', symbol: '^DJI', av: '.DJI' },
  { key: 'nasdaq', name: 'NASDAQ', symbol: '^IXIC', av: '.IXIC' },
  { key: 'ftse', name: 'FTSE 100', symbol: '^FTSE', av: '^FTSE' },
  { key: 'nikkei', name: 'Nikkei 225', symbol: '^N225', av: '^N225' },
  { key: 'dax', name: 'DAX', symbol: '^GDAXI', av: '^GDAXI' },
  { key: 'hsi', name: 'Hang Seng', symbol: '^HSI', av: '^HSI' },
  { key: 'asx', name: 'ASX 200', symbol: '^AXJO', av: '^AXJO' },
  { key: 'gold', name: 'Gold', symbol: 'GC=F', av: 'XAUUSD' },
  { key: 'silver', name: 'Silver', symbol: 'SI=F', av: 'XAGUSD' },
  { key: 'crude', name: 'Crude Oil', symbol: 'CL=F', av: 'WTI' },
  { key: 'natgas', name: 'Nat Gas', symbol: 'NG=F', av: 'NG' },
  { key: 'copper', name: 'Copper', symbol: 'HG=F', av: 'HG' },
  { key: 'platinum', name: 'Platinum', symbol: 'PL=F', av: 'PL' }
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
    const p = Math.max(base + jitter, 0.01);
    return { ...d, price: p.toFixed(2) };
  });
}

// Try Yahoo Finance v7
async function tryYahooV7(symbols) {
  const url = 'https://query1.finance.yahoo.com/v7/finance/quote?symbols=' + symbols;
  const r = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json,text/html',
      'Origin': 'https://finance.yahoo.com',
      'Referer': 'https://finance.yahoo.com/'
    }
  });
  if (!r.ok) throw new Error('Yahoo v7: ' + r.status);
  const j = await r.json();
  return j.quoteResponse?.result || [];
}

// Try Yahoo Finance v6 quote summary (individual calls)
async function tryYahooV6(symbol) {
  const url = 'https://query1.finance.yahoo.com/v6/finance/quoteSummary/' + encodeURIComponent(symbol) + '?modules=price';
  const r = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json'
    }
  });
  if (!r.ok) return null;
  const j = await r.json();
  return j.quoteSummary?.result?.[0]?.price || null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate');

  try {
    const symbols = TICKERS.map(t => t.symbol).join(',');
    let results;

    // Strategy 1: Yahoo v7 batch
    try {
      results = await tryYahooV7(symbols);
    } catch { results = null; }

    // Strategy 2: Yahoo v6 individual
    if (!results || results.length === 0) {
      results = [];
      for (const t of TICKERS) {
        try {
          const p = await tryYahooV6(t.symbol);
          if (p) {
            results.push({
              symbol: t.symbol,
              regularMarketPrice: p.regularMarketPrice?.raw,
              regularMarketChange: p.regularMarketChange?.raw,
              regularMarketChangePercent: p.regularMarketChangePercent?.raw
            });
          }
        } catch {}
      }
    }

    if (results && results.length > 0) {
      const symbolMap = {};
      results.forEach(r => { symbolMap[r.symbol] = r; });

      const data = TICKERS.map(t => {
        const r = symbolMap[t.symbol];
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

      if (data.length > 0) {
        return res.json({ data, source: 'yahoo', timestamp: Date.now() });
      }
    }

    res.json({ data: getDemoData(), source: 'demo', timestamp: Date.now() });
  } catch {
    res.json({ data: getDemoData(), source: 'demo', timestamp: Date.now() });
  }
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
