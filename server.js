const http=require('http');const fs=require('fs');const path=require('path');
const PORT=process.env.PORT||8080;
const ADMIN_KEY=process.env.ADMIN_KEY||'admin123';
const GITHUB_TOKEN=process.env.GITHUB_TOKEN||'';
const GITHUB_REPO='avciavcig/clinipipes-landing';
const GITHUB_BRANCH='main';
const PAGES={'/':'index.html','/hakkimizda':'hakkimizda.html','/gizlilik':'gizlilik.html','/teslimat':'teslimat.html','/mesafeli-satis':'mesafeli-satis.html','/sss':'sss.html','/kullanim-kosullari':'kullanim-kosullari.html','/etk':'etk.html','/admin':'admin.html'};
const EDITABLE=['index.html','hakkimizda.html','gizlilik.html','teslimat.html','mesafeli-satis.html','sss.html','kullanim-kosullari.html','etk.html','content.json'];
function githubPut(fn,content,msg,cb){
  const https=require('https');
  const p='/repos/'+GITHUB_REPO+'/contents/'+fn;
  const hdr={'Authorization':'token '+GITHUB_TOKEN,'User-Agent':'clinipipes-admin'};
  https.get({hostname:'api.github.com',path:p+'?ref='+GITHUB_BRANCH,headers:hdr},function(r){
    let d='';r.on('data',function(c){d+=c;});r.on('end',function(){
      let sha=null;try{sha=JSON.parse(d).sha;}catch(e){}
      const body=JSON.stringify({message:msg,content:Buffer.from(content).toString('base64'),sha:sha,branch:GITHUB_BRANCH});
      const req=https.request({hostname:'api.github.com',path:p,method:'PUT',headers:Object.assign({'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)},hdr)},function(r2){let d2='';r2.on('data',function(c){d2+=c;});r2.on('end',function(){cb(r2.statusCode===200||r2.statusCode===201);});});
      req.on('error',function(){cb(false);});req.write(body);req.end();
    });
  }).on('error',function(){cb(false);});
}
function commit(fn,content,cb){
  fs.writeFileSync(path.join(__dirname,fn),content,'utf-8');
  if(GITHUB_TOKEN){githubPut(fn,content,'Admin: '+fn,cb);}else{cb(false);}
}
http.createServer(function(req,res){
  const url=req.url.split('?')[0];
  const qs=new URLSearchParams(req.url.includes('?')?req.url.split('?')[1]:'');
  if(url==='/content.json'){
    try{const d=fs.readFileSync(path.join(__dirname,'content.json'));res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-cache'});res.end(d);}
    catch(e){res.writeHead(200,{'Content-Type':'application/json'});res.end('{}');}return;
  }
  if(url==='/api/file'&&req.method==='GET'){
    if(qs.get('key')!==ADMIN_KEY){res.writeHead(401);res.end('Unauthorized');return;}
    const name=qs.get('name');
    if(!EDITABLE.includes(name)){res.writeHead(403);res.end('Not allowed');return;}
    try{
      let c=fs.readFileSync(path.join(__dirname,name),'utf-8');
      if(name==='index.html'){c=c.replace(/data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+/g,'[BASE64_IMAGE]');}
      res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8'});res.end(c);
    }catch(e){res.writeHead(404);res.end('Not found');}return;
  }
  if(url==='/api/save'&&req.method==='POST'){
    if(qs.get('key')!==ADMIN_KEY){res.writeHead(401);res.end('Unauthorized');return;}
    let body='';req.on('data',function(d){body+=d;});req.on('end',function(){
      try{
        const data=JSON.parse(body);
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
          fs.writeFileSync(path.join(__dirname,'content.json'),body);
          if(GITHUB_TOKEN){githubPut('content.json',body,'Admin: content.json',function(ok){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:true,github:ok}));});}
          else{res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:true,github:false}));}
        }
      }catch(e){res.writeHead(400);res.end(e.message);}
    });return;
  }
  if(url==='/api/claim-slot'&&req.method==='POST'){
    try{
      var cd=JSON.parse(fs.readFileSync(path.join(__dirname,'content.json'),'utf-8'));
      if(!cd.founding)cd.founding={slots_remaining:0,discount:50};
      if(cd.founding.slots_remaining>0){
        cd.founding.slots_remaining--;
        var upd=JSON.stringify(cd);
        commit('content.json',upd,function(ok){
          res.writeHead(200,{'Content-Type':'application/json'});
          res.end(JSON.stringify({ok:true,remaining:cd.founding.slots_remaining}));
        });
      }else{res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:false,remaining:0}));}
    }catch(e){res.writeHead(400);res.end(e.message);}
    return;
  }
  const file=PAGES[url]||null;
  if(!file){res.writeHead(404);res.end('Not found');return;}
  if(url==='/admin'&&qs.get('key')!==ADMIN_KEY){
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
    res.end('<!DOCTYPE html><html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><form method=GET action=/admin><h2 style="margin-bottom:1rem">CliniPipes Admin</h2><input name=key type=password placeholder="Sifre" style="display:block;padding:.5rem;margin:.5rem 0;width:200px;border:1px solid #ddd;border-radius:6px"><button style="padding:.5rem 1rem;background:#1D9E75;color:#fff;border:none;border-radius:6px;cursor:pointer">Giris</button></form></body></html>');
    return;
  }
  fs.readFile(path.join(__dirname,file),function(err,data){
    if(err){res.writeHead(404);res.end('Not found');return;}
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(data);
  });
}).listen(PORT,function(){console.log('Port: '+PORT);});
