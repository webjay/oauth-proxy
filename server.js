'use strict';

const request = require('request');
const createServer = require('http').createServer;
const urlParse = require('url').parse;

const Port = process.env.PORT || 3000;

function defaultResponse (res) {
  res.end();
}

function handler (req, res) {
  if (urlParse(req.url).pathname !== '/') {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'accept, origin, content-type');
  res.setHeader('Access-Control-Max-Age', 86400);
  res.setHeader('Access-Control-Expose-Headers', 'X-Rate-Limit-Remaining');
  switch (req.method) {
    case 'GET':
      const query = urlParse(req.url, true).query;
      if (!query.url) return defaultResponse(res);
      const oauth = {
        consumer_key: process.env.consumer,
        consumer_secret: process.env.consumer_secret,
        token: process.env.token,
        token_secret: process.env.token_secret
      };
      request.get({
        url: query.url,
        oauth: oauth,
        json: true
      }).on('response', (response) => {
        delete response.headers['expires'];
        delete response.headers['cache-control'];
        delete response.headers['pragma'];
        delete response.headers['set-cookie'];
        response.headers['cache-control'] = 'private, max-age=3600';
      }).pipe(res);
      break;
    default:
      defaultResponse(res);
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
