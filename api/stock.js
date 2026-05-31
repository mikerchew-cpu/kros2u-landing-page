// Maps TerminalFeed ETF symbols to our ticker keys
const ETF_MAP = { SPY: 'sp500', DIA: 'dow', QQQ: 'nasdaq' };

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

const NAME_MAP = { sp500:'S&P 500', dow:'Dow Jones', nasdaq:'NASDAQ', ftse:'FTSE 100', nikkei:'Nikkei 225', dax:'DAX', hsi:'Hang Seng', asx:'ASX 200', gold:'Gold', silver:'Silver', crude:'Crude Oil', natgas:'Nat Gas', copper:'Copper', platinum:'Platinum' };

function getDemoData() {
  const now = new Date();
  const seed = now.getMinutes() + now.getHours() * 60;
  return DEMO.map((d, i) => {
    const base = parseFloat(d.price);
    const jitter = Math.sin(seed * 0.1 + i * 1.5) * base * 0.003;
    return { ...d, price: Math.max(base + jitter, 0.01).toFixed(2) };
  });
}

async function tryTerminalFeed() {
  const r = await fetch('https://terminalfeed.io/api/stocks');
  if (!r.ok) throw new Error('Status ' + r.status);
  const j = await r.json();
  return j.data;
}

function toTickerItem(key, price, changePercent) {
  return {
    key,
    name: NAME_MAP[key],
    price: price.toFixed(2),
    changePercent: (changePercent >= 0 ? '+' : '') + changePercent.toFixed(2),
    direction: changePercent >= 0 ? 'up' : 'down'
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate');

  try {
    const data = await tryTerminalFeed();
    if (data && data.indices && data.indices.length > 0) {
      const live = {};
      data.indices.forEach(idx => {
        const key = ETF_MAP[idx.symbol];
        if (key) live[key] = toTickerItem(key, idx.price, idx.change_percent);
      });
      const demo = getDemoData();
      const merged = demo.map(d => live[d.key] || d);
      return res.json({ data: merged, source: 'terminalfeed+demo', timestamp: Date.now() });
    }
    res.json({ data: getDemoData(), source: 'demo', timestamp: Date.now() });
  } catch {
    res.json({ data: getDemoData(), source: 'demo', timestamp: Date.now() });
  }
}
