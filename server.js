const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Simple .env parser
const envPath = path.join(__dirname, '.env');
const config = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] ? match[2].trim() : '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      config[match[1]] = value;
    }
  });
}

const PORT = 8080;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  // ── Security headers on every response ─────────────────────────────
  const origWriteHead = res.writeHead.bind(res);
  res.writeHead = function (statusCode, headersArg, ...rest) {
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
      'Permissions-Policy': 'geolocation=(self), microphone=(self), camera=()',
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://unpkg.com https://cdn.ux4g.gov.in https://meet.jit.si",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com https://cdn.ux4g.gov.in",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: blob: https:",
        "connect-src 'self' wss: https:",
        "media-src 'self' blob: data:",
        "worker-src 'self' blob:",
        "frame-src https://meet.jit.si https://www.youtube.com https://www.youtube-nocookie.com",
        "frame-ancestors 'none'"
      ].join('; ')
    };
    return origWriteHead(statusCode, Object.assign({}, headersArg || {}, securityHeaders), ...rest);
  };

  // NOTE: No /api/config endpoint — API keys must never be sent to the client.
  // AI calls that need a server-side key should be proxied through the backend.

  // Serve clean SVG Favicon for /favicon.ico
  if (parsedUrl.pathname === '/favicon.ico') {
    res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
    res.end('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🛡️</text></svg>');
    return;
  }

  // Live Geolocation All-Crime & Safety Intelligence Proxy Endpoint
  if (parsedUrl.pathname === '/api/news') {
    const city = (parsedUrl.query.city || 'India').replace(/[^a-zA-Z0-9 ]/g, '').trim();
    const district = (parsedUrl.query.district || '').replace(/[^a-zA-Z0-9 ]/g, '').trim();
    const state = (parsedUrl.query.state || 'Maharashtra').replace(/[^a-zA-Z0-9 ]/g, '').trim();
    const qLat = parseFloat(parsedUrl.query.lat) || 20.5937;
    const qLng = parseFloat(parsedUrl.query.lng) || 78.9629;

    // Comprehensive search covering ALL crimes (violent, property, road, financial, cyber, police FIRs)
    const locTerms = [city, district, state].filter(Boolean).slice(0, 3).join(' OR ');
    const crimeTerms = '(crime OR police OR robbery OR theft OR murder OR accident OR fraud OR arrest OR assault OR scam OR FIR)';
    const query = encodeURIComponent(`(${locTerms}) ${crimeTerms}`);
    const feedUrl = `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`;

    const request = https.get(feedUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (rssRes) => {
      let data = '';
      rssRes.on('data', chunk => data += chunk);
      rssRes.on('end', () => {
        const items = [];
        const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<pubDate>(.*?)<\/pubDate>[\s\S]*?<source[^>]*>(.*?)<\/source>[\s\S]*?<\/item>/gi;
        let match;
        while ((match = itemRegex.exec(data)) !== null && items.length < 20) {
          const rawTitle = match[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/&amp;/g, '&');
          const link = match[2];
          const pubDate = match[3];
          const source = match[4].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1');

          // Categorize crime type based on title keywords
          let crimeType = '🚔 Police / Crime Report';
          let riskIntensity = 0.7;
          const lower = rawTitle.toLowerCase();
          if (lower.includes('murder') || lower.includes('killed') || lower.includes('assault') || lower.includes('dead')) {
            crimeType = '🚨 Violent Crime / Critical';
            riskIntensity = 0.95;
          } else if (lower.includes('robbery') || lower.includes('theft') || lower.includes('stolen') || lower.includes('burglary') || lower.includes('loot')) {
            crimeType = '⚠️ Robbery / Property Crime';
            riskIntensity = 0.85;
          } else if (lower.includes('fraud') || lower.includes('scam') || lower.includes('cheated') || lower.includes('lakh') || lower.includes('crore') || lower.includes('upi')) {
            crimeType = '⚡ Financial & Cyber Fraud';
            riskIntensity = 0.8;
          } else if (lower.includes('accident') || lower.includes('crash') || lower.includes('injured')) {
            crimeType = '🚑 Emergency / Road Accident';
            riskIntensity = 0.75;
          } else if (lower.includes('arrest') || lower.includes('busted') || lower.includes('nabbed') || lower.includes('held')) {
            crimeType = '🛡️ Police Enforcement / Arrest';
            riskIntensity = 0.65;
          }

          // Generate slight scatter coordinates near user location for clustering
          const jitterLat = qLat + (Math.random() - 0.5) * 0.18;
          const jitterLng = qLng + (Math.random() - 0.5) * 0.18;

          items.push({
            title: rawTitle,
            link,
            pubDate,
            source: source || 'Crime Desk',
            city: city || district || 'Local Area',
            crimeType,
            riskIntensity,
            lat: jitterLat,
            lng: jitterLng
          });
        }

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({
          success: true,
          city,
          district,
          state,
          count: items.length,
          news: items
        }));
      });
    });

    request.on('error', (err) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        city,
        error: err.message,
        news: []
      }));
    });
    return;
  }

  // Basic static file serving
  let filePath = req.url === '/' ? './overview.html' : '.' + req.url.split('?')[0];
  let extname = path.extname(filePath);

  // Block sensitive files: secrets, server source, package manifests, dotfiles, git
  // (strip the leading './' so the serving prefix itself doesn't trip dotfile rules)
  const checkPath = filePath.replace(/^\.\//, '');
  const blockedPatterns = [
    /^\./,                      // root-level dotfiles (.env etc.)
    /[\/\\]\./,                 // dotfiles / .git inside subdirectories
    /server\.js$/i,
    /package(-lock)?\.json$/i,
    /\.gitlab-ci/,
    /\.md$/i
  ];
  if (blockedPatterns.some(re => re.test(checkPath))) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
	
  // Clean path to prevent directory traversal
  filePath = path.normalize(filePath);
  if (filePath.startsWith('..')) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Handle lack of extension (like /operator or /index)
  if (!extname) {
    if (fs.existsSync(filePath + '.html')) {
      filePath += '.html';
      extname = '.html';
    } else if (fs.existsSync(filePath + '/index.html')) {
      filePath += '/index.html';
      extname = '.html';
    }
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + err.code);
      }
    } else {
      const contentType = MIME_TYPES[extname] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running at http://localhost:${PORT}/ (bound to loopback only)`);
});
