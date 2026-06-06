const http=require('http');const fs=require('fs');const path=require('path');const https=require('https');
const PORT=process.env.PORT||8080;
const ADMIN_KEY=process.env.ADMIN_KEY||'admin123';
const GITHUB_TOKEN=process.env.GITHUB_TOKEN||'';
const GITHUB_REPO='avciavcig/clinipipes-landing';
const GITHUB_BRANCH='main';
const PAGES={'/':'index.html','/hakkimizda':'hakkimizda.html','/gizlilik':'gizlilik.html','/teslimat':'teslimat.html','/mesafeli-satis':'mesafeli-satis.html','/sss':'sss.html','/kullanim-kosullari':'kullanim-kosullari.html','/etk':'etk.html','/admin':'admin.html'};
const EDITABLE=['index.html','hakkimizda.html','gizlilik.html','teslimat.html','mesafeli-satis.html','sss.html','kullanim-kosullari.html','etk.html','content.json'];
const ANALYTICS_FILE=path.join(__dirname,'analytics.json');
const LOCAL_ADMIN=path.join(__dirname,'admin_local.json');
var geoCache={};var visitBatch=0;

function getAdminKey(){try{return JSON.parse(fs.readFileSync(LOCAL_ADMIN,'utf-8')).key||ADMIN_KEY;}catch(e){return ADMIN_KEY;}}
function getAnalytics(){try{return JSON.parse(fs.readFileSync(ANALYTICS_FILE,'utf-8'));}catch(e){return{total:0,daily:{},cities:{},provinces:{},devices:{},recent:[]};}}
function saveAnalytics(d){fs.writeFileSync(ANALYTICS_FILE,JSON.stringify(d),'utf-8');}

function githubPut(fn,content,msg,cb){
  const p='/repos/'+GITHUB_REPO+'/contents/'+fn;
  const hdr={'Authorization':'token '+GITHUB_TOKEN,'User-Agent':'clinipipes-admin'};
  https.get({hostname:'api.github.com',path:p+'?ref='+GITHUB_BRANCH,headers:hdr},function(r){
    let d='';r.on('data',function(c){d+=c;});r.on('end',function(){
      let sha=null;try{sha=JSON.parse(d).sha;}catch(e){}
      const body=JSON.stringify({message:msg,content:Buffer.from(content).toString('base64'),sha:sha,branch:GITHUB_BRANCH});
      const req=https.request({hostname:'api.github.com',path:p,method:'PUT',headers:Object.assign({'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)},hdr)},
        function(r2){let d2='';r2.on('data',function(c){d2+=c;});r2.on('end',function(){cb(r2.statusCode===200||r2.statusCode===201);});});
      req.on('error',function(){cb(false);});req.write(body);req.end();
    });
  }).on('error',function(){cb(false);});
}
function commit(fn,content,cb){fs.writeFileSync(path.join(__dirname,fn),content,'utf-8');if(GITHUB_TOKEN){githubPut(fn,content,'Admin: '+fn,cb);}else{cb(false);}}

function commitAnalytics(){
  if(!GITHUB_TOKEN)return;
  try{const d=fs.readFileSync(ANALYTICS_FILE,'utf-8');githubPut('analytics.json',d,'Analytics update',function(){});}catch(e){}
}

function geoLookup(ip,cb){
  if(!ip||ip==='127.0.0.1'||ip==='::1'){cb(null);return;}
  if(geoCache[ip]){cb(geoCache[ip]);return;}
  https.get({hostname:'ip-api.com',path:'/json/'+ip+'?fields=city,regionName,country,countryCode,status'},function(r){
    let d='';r.on('data',function(c){d+=c;});r.on('end',function(){
      try{const g=JSON.parse(d);if(g.status==='success'){geoCache[ip]=g;cb(g);}else cb(null);}catch(e){cb(null);}
    });
  }).on('error',function(){cb(null);});
}

function trackVisit(req){
  const ip=(req.headers['x-forwarded-for']||req.socket.remoteAddress||'').split(',')[0].trim();
  const ua=req.headers['user-agent']||'';
  const device=/mobile|android|iphone|ipad|tablet/i.test(ua)?'Mobil':'Masaüstü';
  const date=new Date().toISOString().slice(0,10);
  const d=getAnalytics();
  d.total=(d.total||0)+1;
  d.daily=d.daily||{};d.daily[date]=(d.daily[date]||0)+1;
  d.devices=d.devices||{};d.devices[device]=(d.devices[device]||0)+1;
  d.recent=d.recent||[];
  const entry={date:new Date().toISOString().slice(0,16).replace('T',' '),device:device,city:'...',province:'...',country:'?'};
  d.recent.unshift(entry);if(d.recent.length>500)d.recent=d.recent.slice(0,500);
  saveAnalytics(d);
  visitBatch++;if(visitBatch>=50){visitBatch=0;commitAnalytics();}
  geoLookup(ip,function(geo){
    if(!geo)return;
    const d2=getAnalytics();
    d2.cities=d2.cities||{};d2.cities[geo.city]=(d2.cities[geo.city]||0)+1;
    d2.provinces=d2.provinces||{};d2.provinces[geo.regionName]=(d2.provinces[geo.regionName]||0)+1;
    d2.countries=d2.countries||{};d2.countries[geo.country]=(d2.countries[geo.country]||0)+1;
    const idx=d2.recent.findIndex(function(r){return r.city==='...'&&r.device===device;});
    if(idx>=0){d2.recent[idx].city=geo.city;d2.recent[idx].province=geo.regionName;d2.recent[idx].country=geo.country;}
    saveAnalytics(d2);
  });
}

// Load analytics from GitHub on startup
if(GITHUB_TOKEN){
  const p='/repos/'+GITHUB_REPO+'/contents/analytics.json?ref='+GITHUB_BRANCH;
  https.get({hostname:'api.github.com',path:p,headers:{'Authorization':'token '+GITHUB_TOKEN,'User-Agent':'clinipipes-admin'}},function(r){
    let d='';r.on('data',function(c){d+=c;});r.on('end',function(){
      try{const parsed=JSON.parse(d);const content=Buffer.from(parsed.content.replace(/\n/g,''),'base64').toString('utf-8');fs.writeFileSync(ANALYTICS_FILE,content,'utf-8');console.log('Analytics loaded from GitHub');}catch(e){console.log('Analytics: fresh start');}
    });
  }).on('error',function(){});
}

http.createServer(function(req,res){
  const url=req.url.split('?')[0];
  const qs=new URLSearchParams(req.url.includes('?')?req.url.split('?')[1]:'');
  const adminKey=getAdminKey();

  if(url==='/')trackVisit(req);

  if(url==='/content.json'){
    try{const d=fs.readFileSync(path.join(__dirname,'content.json'));res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-cache'});res.end(d);}
    catch(e){res.writeHead(200,{'Content-Type':'application/json'});res.end('{}');}return;
  }
  if(url==='/api/analytics'&&req.method==='GET'){
    if(qs.get('key')!==adminKey){res.writeHead(401);res.end('Unauthorized');return;}
    commitAnalytics();
    try{const d=fs.readFileSync(ANALYTICS_FILE,'utf-8');res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-cache'});res.end(d);}
    catch(e){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({total:0,daily:{},cities:{},provinces:{},devices:{},recent:[]}));}
    return;
  }
  if(url==='/api/update-password'&&req.method==='POST'){
    if(qs.get('key')!==adminKey){res.writeHead(401);res.end('Unauthorized');return;}
    let body='';req.on('data',function(d){body+=d;});req.on('end',function(){
      try{const data=JSON.parse(body);if(!data.newKey||data.newKey.length<4){res.writeHead(400);res.end('Şifre en az 4 karakter olmalı');return;}
      fs.writeFileSync(LOCAL_ADMIN,JSON.stringify({key:data.newKey}),'utf-8');
      res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:true}));}
      catch(e){res.writeHead(400);res.end(e.message);}
    });return;
  }
  if(url==='/api/file'&&req.method==='GET'){
    if(qs.get('key')!==adminKey){res.writeHead(401);res.end('Unauthorized');return;}
    const name=qs.get('name');
    if(!EDITABLE.includes(name)){res.writeHead(403);res.end('Not allowed');return;}
    try{let c=fs.readFileSync(path.join(__dirname,name),'utf-8');
    if(name==='index.html'){c=c.replace(/data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+/g,'[BASE64_IMAGE]');}
    res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8'});res.end(c);}
    catch(e){res.writeHead(404);res.end('Not found');}return;
  }
  if(url==='/api/save'&&req.method==='POST'){
    if(qs.get('key')!==adminKey){res.writeHead(401);res.end('Unauthorized');return;}
    let body='';req.on('data',function(d){body+=d;});req.on('end',function(){
      try{const data=JSON.parse(body);
      if(data.filename){
        if(!EDITABLE.includes(data.filename)){res.writeHead(403);res.end('Not allowed');return;}
        let content=data.content;
        if(data.filename==='index.html'){
          const orig=fs.readFileSync(path.join(__dirname,'index.html'),'utf-8');
          const imgs=[];let m;const re=/data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+/g;
          while((m=re.exec(orig))!==null)imgs.push(m[0]);
          let idx=0;content=content.replace(/\[BASE64_IMAGE\]/g,function(){return imgs[idx++]||'[BASE64_IMAGE]';});
        }
        commit(data.filename,content,function(ok){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:true,github:ok}));});
      }else{
        try{var ex=JSON.parse(fs.readFileSync(path.join(__dirname,'content.json'),'utf-8'));var inc=JSON.parse(body);if(inc.prices)ex.prices=inc.prices;if(inc.gallery!==undefined)ex.gallery=inc.gallery;body=JSON.stringify(ex);}catch(e){}
        fs.writeFileSync(path.join(__dirname,'content.json'),body);
        if(GITHUB_TOKEN){githubPut('content.json',body,'Admin: content.json',function(ok){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:true,github:ok}));});}
        else{res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:true,github:false}));}
      }}catch(e){res.writeHead(400);res.end(e.message);}
    });return;
  }
  if(url==='/api/claim-slot'&&req.method==='POST'){
    try{var cd=JSON.parse(fs.readFileSync(path.join(__dirname,'content.json'),'utf-8'));
    if(!cd.founding)cd.founding={slots_remaining:0,discount:50};
    if(cd.founding.slots_remaining>0){cd.founding.slots_remaining--;var upd=JSON.stringify(cd);
    commit('content.json',upd,function(ok){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:true,remaining:cd.founding.slots_remaining}));});}
    else{res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:false,remaining:0}));}}
    catch(e){res.writeHead(400);res.end(e.message);}return;
  }
  const file=PAGES[url]||null;
  if(!file){res.writeHead(404);res.end('Not found');return;}
  if(url==='/admin'&&qs.get('key')!==adminKey){
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
    res.end('<!DOCTYPE html><html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><form method=GET action=/admin><h2 style="margin-bottom:1rem">CliniPipes Admin</h2><input name=key type=password placeholder="Sifre" style="display:block;padding:.5rem;margin:.5rem 0;width:200px;border:1px solid #ddd;border-radius:6px"><button style="padding:.5rem 1rem;background:#1D9E75;color:#fff;border:none;border-radius:6px;cursor:pointer">Giris</button></form></body></html>');
    return;
  }
  fs.readFile(path.join(__dirname,file),function(err,data){
    if(err){res.writeHead(404);res.end('Not found');return;}
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(data);
  });
}).listen(PORT,function(){console.log('Port: '+PORT);});