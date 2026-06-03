const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 8080;
const routes = {'/':'index.html','/hakkimizda':'hakkimizda.html','/gizlilik':'gizlilik.html','/teslimat':'teslimat.html','/mesafeli-satis':'mesafeli-satis.html'};
http.createServer((req,res)=>{
const url=req.url.split('?')[0];
const file=routes[url]||null;
if(!file){res.writeHead(404);res.end('Not found');return;}
fs.readFile(path.join(__dirname,file),(err,data)=>{
if(err){res.writeHead(404);res.end('Not found');return;}
res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
res.end(data);
});
}).listen(PORT,()=>console.log('Port: '+PORT));
