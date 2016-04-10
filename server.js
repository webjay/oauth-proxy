'use strict';

const requestGet = require('request').get;
const createServer = require('http').createServer;
const urlParse = require('url').parse;

const Port = process.env.PORT || 3000;

function handler (req, res) {
  const urlParsed = urlParse(req.url, true);
  if (urlParsed.pathname !== '/') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'accept, origin, content-type');
  res.setHeader('Access-Control-Max-Age', 86400);
  res.setHeader('Access-Control-Expose-Headers', 'X-Rate-Limit-Remaining');
  switch (req.method) {
    case 'OPTIONS':
      res.end();
      break;
    case 'GET':
      if (!urlParsed.query.url) {
        res.writeHead(409);
        res.end('Parameter missing');
        return;
      }
      requestGet({
        url: urlParsed.query.url,
        oauth: {
          consumer_key: process.env.consumer,
          consumer_secret: process.env.consumer_secret,
          token: urlParsed.query.token,
          token_secret: urlParsed.query.token_secret
        },
        json: true,
        gzip: true
      }).on('response', (response) => {
        delete response.headers['expires'];
        delete response.headers['cache-control'];
        delete response.headers['pragma'];
        delete response.headers['set-cookie'];
        response.headers['cache-control'] = 'private, max-age=3600';
      }).pipe(res);
      break;
    default:
      res.writeHead(405);
      res.end();
      break;
  }
}

const server = createServer(handler);

server.listen(Port, _ => {
  console.log('HTTP server listening on port', Port);
});

process.on('SIGTERM', _ => {
  server.close();
});
