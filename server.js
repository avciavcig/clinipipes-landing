const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 80;
http.createServer((req, res) => {
  fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.end(data);
  });
}).listen(PORT, () => console.log('Port: ' + PORT));
