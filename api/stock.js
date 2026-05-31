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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate');

  try {
    const symbols = TICKERS.map(t => t.symbol).join(',');
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (!response.ok) {
      throw new Error(`Yahoo API returned ${response.status}`);
    }

    const json = await response.json();
    const results = json.quoteResponse?.result;

    if (!results || !Array.isArray(results)) {
      throw new Error('Unexpected response structure');
    }

    const data = results.map(r => {
      const ticker = SYMBOL_TO_KEY[r.symbol];
      if (!ticker) return null;

      const price = r.regularMarketPrice || 0;
      const change = r.regularMarketChange || 0;
      const changePercent = r.regularMarketChangePercent || 0;

      return {
        key: ticker.key,
        name: ticker.name,
        price: price.toFixed(2),
        change: change.toFixed(2),
        changePercent: changePercent.toFixed(2),
        direction: change >= 0 ? 'up' : 'down'
      };
    }).filter(Boolean);

    if (data.length === 0) {
      throw new Error('No valid data returned');
    }

    res.json({ data, timestamp: Date.now() });
  } catch (err) {
    res.status(200).json({ error: err.message, fallback: true, timestamp: Date.now() });
  }
}
