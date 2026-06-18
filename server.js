const http=require('http');const fs=require('fs');const path=require('path');const https=require('https');const{execSync}=require('child_process');
const{createAdminAuth}=require('./lib/admin-auth');
const pubSec=require('./lib/public-security');
const ordersStore=require('./lib/orders-store');
const{provisionClinic,isPortalIntegrationEnabled}=require('./lib/portal-bridge');
const PORT=process.env.PORT||8080;
const ADMIN_KEY=process.env.ADMIN_KEY||'admin123';
const GITHUB_TOKEN=process.env.GITHUB_TOKEN||'';
const GITHUB_REPO='avciavcig/clinipipes-landing';
const GITHUB_BRANCH='main';
const PAGES={'/':'index.html','/hakkimizda':'hakkimizda.html','/gizlilik':'gizlilik.html','/teslimat':'teslimat.html','/mesafeli-satis':'mesafeli-satis.html','/on-bilgilendirme':'on-bilgilendirme.html','/sss':'sss.html','/kullanim-kosullari':'kullanim-kosullari.html','/etk':'etk.html','/admin':'admin.html'};
const EDITABLE=['index.html','hakkimizda.html','gizlilik.html','teslimat.html','mesafeli-satis.html','on-bilgilendirme.html','sss.html','kullanim-kosullari.html','etk.html','content.json','legal-seller.json','demo-data.json','demo/dashboard.html','demo/sales.html','demo/form.html','demo/doctor.html','demo/pdf.html'];
const DEMO_IDS=['dashboard','sales','form','pdf','doctor'];
const LEGAL_PAGES=['hakkimizda.html','gizlilik.html','teslimat.html','mesafeli-satis.html','on-bilgilendirme.html','sss.html','kullanim-kosullari.html','etk.html'];
const ANALYTICS_FILE=path.join(__dirname,'analytics.json');
const LOCAL_ADMIN=path.join(__dirname,'admin_local.json');
const auth=createAdminAuth(LOCAL_ADMIN,ADMIN_KEY);
var geoCache={};var visitBatch=0;

function jsonRes(res,status,data,req,admin){
  auth.setSecurityHeaders(res,{admin:!!admin});
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});
  res.end(JSON.stringify(data));
}
function htmlRes(res,status,html,req,admin){
  auth.setSecurityHeaders(res,{admin:!!admin});
  res.writeHead(status,{'Content-Type':'text/html; charset=utf-8'});
  res.end(html);
}
function requireAdmin(req,res,qs,csrf){
  return auth.authenticateRequest(req,qs,res,csrf!==false);
}
function setSessionCookies(res,req,session){
  auth.setCookie(res,auth.SESSION_COOKIE,session.token,8*3600,req);
}
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

function rebuildLegalPages(cb){
  try{execSync('node scripts/build-legal-pages.mjs',{cwd:__dirname,stdio:'pipe'});}catch(e){cb(false,e.message);return;}
  if(!GITHUB_TOKEN){cb(true);return;}
  var pending=LEGAL_PAGES.length,done=0,ok=true;
  LEGAL_PAGES.forEach(function(fn){
    try{var content=fs.readFileSync(path.join(__dirname,fn),'utf-8');
    githubPut(fn,content,'Admin: rebuild legal pages',function(gok){if(!gok)ok=false;done++;if(done===pending)cb(ok);});
    }catch(e){ok=false;done++;if(done===pending)cb(ok,e.message);}
  });
}

function mergeContent(inc){
  var ex={};
  try{ex=JSON.parse(fs.readFileSync(path.join(__dirname,'content.json'),'utf-8'));}catch(e){}
  if(inc.prices)ex.prices=inc.prices;
  if(inc.founding)ex.founding=Object.assign(ex.founding||{},inc.founding);
  if(inc.demo)ex.demo=Object.assign(ex.demo||{},inc.demo);
  if(inc.landing){
    ex.landing=ex.landing||{};
    if(inc.landing.hero)ex.landing.hero=Object.assign(ex.landing.hero||{},inc.landing.hero);
    if(inc.landing.faq)ex.landing.faq=inc.landing.faq;
    if(inc.landing.sections)ex.landing.sections=inc.landing.sections;
  }
  return JSON.stringify(ex);
}

function saveDemoImage(id,b64,cb){
  if(!DEMO_IDS.includes(id)){cb(false,'invalid id');return;}
  if(!auth.isValidPngBase64(b64)){cb(false,'invalid image');return;}
  var m=b64.match(/^data:image\/(\w+);base64,(.+)$/i);
  if(!m||m[1].toLowerCase()!=='png'){cb(false,'invalid image');return;}
  var fn='demo/'+id+'.png';
  try{
    fs.writeFileSync(path.join(__dirname,fn),Buffer.from(m[2],'base64'));
    var c=JSON.parse(fs.readFileSync(path.join(__dirname,'content.json'),'utf-8'));
    c.demo=c.demo||{};c.demo.version=(c.demo.version||1)+1;
    fs.writeFileSync(path.join(__dirname,'content.json'),JSON.stringify(c));
    if(GITHUB_TOKEN){
      var pending=2,done=0,ok=true;
      function fin(g){if(!g)ok=false;done++;if(done===pending)cb(ok);}
      githubPut(fn,fs.readFileSync(path.join(__dirname,fn)),'Admin: '+fn,fin);
      githubPut('content.json',JSON.stringify(c),'Admin: demo version',fin);
    }else cb(true);
  }catch(e){cb(false,e.message);}
}

function captureDemoScreens(cb){
  try{execSync('node scripts/capture-production-demo.mjs',{cwd:__dirname,stdio:'pipe',timeout:180000,env:process.env});
  var c=JSON.parse(fs.readFileSync(path.join(__dirname,'content.json'),'utf-8'));
  c.demo=c.demo||{};c.demo.version=(c.demo.version||1)+1;
  fs.writeFileSync(path.join(__dirname,'content.json'),JSON.stringify(c));
  if(!GITHUB_TOKEN){cb(true);return;}
  var files=DEMO_IDS.map(function(id){return'demo/'+id+'.png';}).concat(['content.json']);
  var pending=files.length,done=0,ok=true;
  files.forEach(function(fn){
    try{
      var content=fn==='content.json'?JSON.stringify(c):fs.readFileSync(path.join(__dirname,fn));
      githubPut(fn,content,'Admin: capture demo',function(g){if(!g)ok=false;done++;if(done===pending)cb(ok);});
    }catch(e){ok=false;done++;if(done===pending)cb(ok,e.message);}
  });
  }catch(e){cb(false,e.stderr?e.stderr.toString():e.message);}
}

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

  if(url==='/')trackVisit(req);

  if(/^\/(\.env|\.git|wp-admin|wp-login|phpmyadmin|\.well-known\/acme)/.test(url)||url.indexOf('..')>=0){
    auth.setSecurityHeaders(res);
    res.writeHead(404);res.end('Not found');return;
  }

  if(url==='/api/admin/login-info'&&req.method==='GET'){
    var cfg=auth.loadConfig();
    return jsonRes(res,200,{twoFactorRequired:!!cfg.totpEnabled},req,true);
  }
  if(url==='/api/admin/login'&&req.method==='POST'){
    return auth.readBody(req,function(err,body){
      if(err){return jsonRes(res,413,{ok:false,error:'payload_too_large'},req,true);}
      var ip=auth.getClientIp(req);
      var cfg=auth.loadConfig();
      var allowed=auth.checkLoginAllowed(cfg,ip);
      if(!allowed.ok){return jsonRes(res,429,{ok:false,error:'locked',retryAfter:allowed.retryAfter},req,true);}
      try{
        var data=JSON.parse(body||'{}');
        var password=String(data.password||'');
        var totp=String(data.totp||'').trim();
        var pending=String(data.pending||'');
        if(!password){return jsonRes(res,400,{ok:false,error:'password_required'},req,true);}
        if(!auth.verifyPassword(password,auth.getStoredPasswordHash(cfg))){
          var retry=auth.recordFailedLogin(cfg,ip);
          return jsonRes(res,401,{ok:false,error:'invalid_credentials',retryAfter:retry||undefined},req,true);
        }
        if(cfg.totpEnabled){
          if(pending&&!auth.consumePending2fa(pending,ip)){
            return jsonRes(res,401,{ok:false,error:'session_expired'},req,true);
          }
          if(!totp){
            var pToken=auth.createPending2fa(ip);
            return jsonRes(res,200,{ok:false,needs2fa:true,pending:pToken},req,true);
          }
          if(!auth.verifyTotp(cfg.totpSecret,totp)){
            var retry2=auth.recordFailedLogin(cfg,ip);
            return jsonRes(res,401,{ok:false,error:'invalid_2fa',retryAfter:retry2||undefined},req,true);
          }
        }
        auth.clearFailedLogin(cfg,ip);
        var session=auth.createSession(cfg);
        setSessionCookies(res,req,session);
        return jsonRes(res,200,{ok:true},req,true);
      }catch(e){return jsonRes(res,400,{ok:false,error:'bad_request'},req,true);}
    });
  }
  if(url==='/api/admin/logout'&&req.method==='POST'){
    var cfgL=auth.loadConfig();
    var tok=auth.parseCookies(req)[auth.SESSION_COOKIE];
    if(tok)auth.destroySession(cfgL,tok);
    auth.clearCookie(res,auth.SESSION_COOKIE,req);
    return jsonRes(res,200,{ok:true},req,true);
  }
  if(url==='/api/admin/me'&&req.method==='GET'){
    var cfgM=auth.loadConfig();
    var sess=auth.findSession(cfgM,auth.parseCookies(req)[auth.SESSION_COOKIE]);
    if(!sess){return jsonRes(res,401,{ok:false},req,true);}
    return jsonRes(res,200,{ok:true,csrf:sess.csrf,totpEnabled:!!cfgM.totpEnabled},req,true);
  }
  if(url==='/api/admin/2fa/setup'&&req.method==='POST'){
    if(!requireAdmin(req,res,qs))return;
    var cfgS=auth.loadConfig();
    if(cfgS.totpEnabled){return jsonRes(res,400,{ok:false,error:'already_enabled'},req,true);}
    var secret=auth.generateTotpSecret();
    cfgS.totpPendingSecret=secret;
    auth.saveConfig(cfgS);
    return jsonRes(res,200,{ok:true,secret:secret,uri:auth.getTotpUri(secret)},req,true);
  }
  if(url==='/api/admin/2fa/enable'&&req.method==='POST'){
    if(!requireAdmin(req,res,qs))return;
    return auth.readBody(req,function(err,body){
      if(err){return jsonRes(res,413,{ok:false,error:'payload_too_large'},req,true);}
      try{
        var data=JSON.parse(body||'{}');
        var cfgE=auth.loadConfig();
        if(!cfgE.totpPendingSecret){return jsonRes(res,400,{ok:false,error:'setup_required'},req,true);}
        if(!auth.verifyTotp(cfgE.totpPendingSecret,data.code)){return jsonRes(res,401,{ok:false,error:'invalid_2fa'},req,true);}
        cfgE.totpSecret=cfgE.totpPendingSecret;
        cfgE.totpEnabled=true;
        delete cfgE.totpPendingSecret;
        auth.saveConfig(cfgE);
        return jsonRes(res,200,{ok:true},req,true);
      }catch(e){return jsonRes(res,400,{ok:false,error:'bad_request'},req,true);}
    });
  }
  if(url==='/api/admin/2fa/disable'&&req.method==='POST'){
    if(!requireAdmin(req,res,qs))return;
    return auth.readBody(req,function(err,body){
      if(err){return jsonRes(res,413,{ok:false,error:'payload_too_large'},req,true);}
      try{
        var data=JSON.parse(body||'{}');
        var cfgD=auth.loadConfig();
        if(!auth.verifyPassword(String(data.password||''),auth.getStoredPasswordHash(cfgD))){return jsonRes(res,401,{ok:false,error:'invalid_credentials'},req,true);}
        if(cfgD.totpEnabled&&!auth.verifyTotp(cfgD.totpSecret,data.code)){return jsonRes(res,401,{ok:false,error:'invalid_2fa'},req,true);}
        cfgD.totpEnabled=false;
        cfgD.totpSecret=null;
        delete cfgD.totpPendingSecret;
        auth.saveConfig(cfgD);
        return jsonRes(res,200,{ok:true},req,true);
      }catch(e){return jsonRes(res,400,{ok:false,error:'bad_request'},req,true);}
    });
  }

  if(url==='/api/checkout-token'&&req.method==='GET'){
    auth.setSecurityHeaders(res);
    var token=pubSec.createCheckoutToken();
    return jsonRes(res,200,{token:token,expiresIn:1800},req,false);
  }
  if(url==='/api/checkout'&&req.method==='POST'){
    return auth.readBody(req,function(err,body){
      if(err){return jsonRes(res,413,{ok:false,error:'payload_too_large'},req,false);}
      var ip=pubSec.getClientIp(req);
      var allowed=pubSec.checkCheckoutAllowed(ip);
      if(!allowed.ok){return jsonRes(res,429,{ok:false,error:'rate_limited',retryAfter:allowed.retryAfter},req,false);}
      try{
        var data=JSON.parse(body||'{}');
        if(data.website){return jsonRes(res,200,{ok:true},req,false);}
        if(!pubSec.consumeCheckoutToken(data.checkoutToken)){
          return jsonRes(res,403,{ok:false,error:'invalid_checkout_token'},req,false);
        }
        var clinicName=pubSec.sanitizeText(data.clinicName,120);
        var ownerEmail=pubSec.sanitizeEmail(data.ownerEmail);
        var phone=pubSec.sanitizeText(data.phone,32);
        var slug=pubSec.sanitizeSlug(data.slug||clinicName);
        var items=Array.isArray(data.items)?data.items.slice(0,5):[];
        var period=data.period==='yearly'?'yearly':'monthly';
        if(!clinicName||!ownerEmail||!items.length){
          return jsonRes(res,400,{ok:false,error:'invalid_order'},req,false);
        }
        var plan='starter';
        items.forEach(function(it){if(it==='pro')plan='pro';});
        var orderId='ord_'+require('crypto').randomBytes(12).toString('hex');
        var order={
          orderId:orderId,
          clinicName:clinicName,
          slug:slug,
          ownerEmail:ownerEmail,
          phone:phone,
          plan:plan,
          period:period,
          items:items,
          consents:{preInfo:!!data.consents&&!!data.consents.preInfo,agree:!!data.consents&&!!data.consents.agree,digital:!!data.consents&&!!data.consents.digital,kvkk:!!data.consents&&!!data.consents.kvkk},
          active:false,
          status:'pending_payment',
          createdAt:new Date().toISOString(),
          sourceIp:ip
        };
        if(!order.consents.preInfo||!order.consents.agree||!order.consents.digital||!order.consents.kvkk){
          return jsonRes(res,400,{ok:false,error:'consents_required'},req,false);
        }
        try{ordersStore.saveOrder(order);}catch(saveErr){
          return jsonRes(res,500,{ok:false,error:'order_save_failed'},req,false);
        }
        console.log('[order] '+orderId+' '+clinicName+' <'+ownerEmail+'> plan='+plan+' ('+(isPortalIntegrationEnabled()?'portal':'manuel')+')');
        if(!isPortalIntegrationEnabled()){
          return jsonRes(res,200,{ok:true,mode:'manual',orderId:orderId,message:'Sipariş alındı. Ödeme bağlantısı e-posta ile iletilecek.'},req,false);
        }
        return provisionClinic(order).then(function(pr){
          if(pr.skipped){
            return jsonRes(res,200,{ok:true,mode:'manual',orderId:orderId,message:'Sipariş alındı. Ödeme onayı sonrası hesabınız açılacak.'},req,false);
          }
          if(!pr.ok){return jsonRes(res,502,{ok:false,error:pr.error||'provision_failed',orderId:orderId},req,false);}
          return jsonRes(res,200,{ok:true,mode:'provisioned',orderId:orderId,clinicId:pr.clinicId,slug:pr.slug},req,false);
        });
      }catch(e){return jsonRes(res,400,{ok:false,error:'bad_request'},req,false);}
    });
  }

  if(url==='/content.json'){
    try{const d=fs.readFileSync(path.join(__dirname,'content.json'));auth.setSecurityHeaders(res);res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-cache'});res.end(d);}
    catch(e){auth.setSecurityHeaders(res);res.writeHead(200,{'Content-Type':'application/json'});res.end('{}');}return;
  }
  if(url==='/demo-data.json'){
    try{const d=fs.readFileSync(path.join(__dirname,'demo-data.json'));auth.setSecurityHeaders(res);res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-cache'});res.end(d);}
    catch(e){auth.setSecurityHeaders(res);res.writeHead(200,{'Content-Type':'application/json'});res.end('{}');}return;
  }
  if(url==='/api/analytics'&&req.method==='GET'){
    if(!requireAdmin(req,res,qs,false))return;
    commitAnalytics();
    try{const d=fs.readFileSync(ANALYTICS_FILE,'utf-8');auth.setSecurityHeaders(res,{admin:true});res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-cache'});res.end(d);}
    catch(e){jsonRes(res,200,{total:0,daily:{},cities:{},provinces:{},devices:{},recent:[]},req,true);}
    return;
  }
  if(url==='/api/orders'&&req.method==='GET'){
    if(!requireAdmin(req,res,qs,false))return;
    var limit=Math.min(100,Math.max(1,parseInt(qs.limit,10)||50));
    return jsonRes(res,200,{ok:true,orders:ordersStore.listOrders(limit),integrationEnabled:isPortalIntegrationEnabled()},req,true);
  }
  if(url==='/api/rebuild-legal'&&req.method==='POST'){
    if(!requireAdmin(req,res,qs))return;
    rebuildLegalPages(function(ok,err){
      jsonRes(res,200,{ok:ok,error:err||null},req,true);
    });return;
  }
  if(url==='/api/save-demo-image'&&req.method==='POST'){
    if(!requireAdmin(req,res,qs))return;
    auth.readBody(req,function(err,body){
      if(err){return jsonRes(res,413,{ok:false,error:'payload_too_large'},req,true);}
      try{var data=JSON.parse(body);
      saveDemoImage(data.id,data.image,function(ok,err){
        jsonRes(res,200,{ok:ok,error:err||null},req,true);
      });}catch(e){jsonRes(res,400,{ok:false,error:e.message},req,true);}
    });return;
  }
  if(url==='/api/capture-demo'&&req.method==='POST'){
    if(!requireAdmin(req,res,qs))return;
    captureDemoScreens(function(ok,err){
      jsonRes(res,200,{ok:ok,error:err||null},req,true);
    });return;
  }
  if(url==='/api/update-password'&&req.method==='POST'){
    if(!requireAdmin(req,res,qs))return;
    auth.readBody(req,function(err,body){
      if(err){return jsonRes(res,413,{ok:false,error:'payload_too_large'},req,true);}
      try{
        const data=JSON.parse(body||'{}');
        var cfgP=auth.loadConfig();
        if(!auth.verifyPassword(String(data.currentPassword||''),auth.getStoredPasswordHash(cfgP))){
          return jsonRes(res,401,{ok:false,error:'invalid_credentials'},req,true);
        }
        if(cfgP.totpEnabled&&!auth.verifyTotp(cfgP.totpSecret,data.totp)){
          return jsonRes(res,401,{ok:false,error:'invalid_2fa'},req,true);
        }
        if(!data.newKey||String(data.newKey).length<auth.MIN_PASSWORD_LEN){
          return jsonRes(res,400,{ok:false,error:'password_too_short',min:auth.MIN_PASSWORD_LEN},req,true);
        }
        cfgP.passwordHash=auth.hashPassword(String(data.newKey));
        auth.saveConfig(cfgP);
        jsonRes(res,200,{ok:true},req,true);
      }catch(e){jsonRes(res,400,{ok:false,error:e.message},req,true);}
    });return;
  }
  if(url==='/api/file'&&req.method==='GET'){
    if(!requireAdmin(req,res,qs,false))return;
    const name=qs.get('name');
    if(!EDITABLE.includes(name)){res.writeHead(403);res.end('Not allowed');return;}
    try{let c=fs.readFileSync(path.join(__dirname,name),'utf-8');
    if(name==='index.html'){c=c.replace(/data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+/g,'[BASE64_IMAGE]');}
    if(name==='legal-seller.json'){try{c=JSON.stringify(JSON.parse(c),null,2);}catch(e){}}
    if(name==='demo-data.json'){try{c=JSON.stringify(JSON.parse(c),null,2);}catch(e){}}
    res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8'});auth.setSecurityHeaders(res,{admin:true});res.end(c);}
    catch(e){res.writeHead(404);auth.setSecurityHeaders(res,{admin:true});res.end('Not found');}return;
  }
  if(url==='/api/save'&&req.method==='POST'){
    if(!requireAdmin(req,res,qs))return;
    auth.readBody(req,function(err,body){
      if(err){return jsonRes(res,413,{ok:false,error:'payload_too_large'},req,true);}
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
        commit(data.filename,content,function(ok){jsonRes(res,200,{ok:true,github:ok},req,true);});
      }else{
        var merged=mergeContent(JSON.parse(body));
        fs.writeFileSync(path.join(__dirname,'content.json'),merged);
        if(GITHUB_TOKEN){githubPut('content.json',merged,'Admin: content.json',function(ok){jsonRes(res,200,{ok:true,github:ok},req,true);});}
        else{jsonRes(res,200,{ok:true,github:false},req,true);}
      }}catch(e){jsonRes(res,400,{ok:false,error:e.message},req,true);}
    });return;
  }
  if(url==='/api/claim-slot'&&req.method==='POST'){
    return auth.readBody(req,function(err,body){
      if(err){return jsonRes(res,413,{ok:false,error:'payload_too_large'},req,false);}
      var ip=pubSec.getClientIp(req);
      var allowed=pubSec.checkClaimAllowed(ip);
      if(!allowed.ok){return jsonRes(res,429,{ok:false,error:'rate_limited',retryAfter:allowed.retryAfter},req,false);}
      try{
        var data=JSON.parse(body||'{}');
        if(!pubSec.consumeCheckoutToken(data.checkoutToken)){
          return jsonRes(res,403,{ok:false,error:'invalid_token'},req,false);
        }
        var cd=JSON.parse(fs.readFileSync(path.join(__dirname,'content.json'),'utf-8'));
        if(!cd.founding)cd.founding={slots_remaining:0,discount:50};
        if(cd.founding.slots_remaining>0){
          cd.founding.slots_remaining--;
          var upd=JSON.stringify(cd);
          commit('content.json',upd,function(ok){
            jsonRes(res,200,{ok:true,remaining:cd.founding.slots_remaining},req,false);
          });
        }else{
          jsonRes(res,200,{ok:false,remaining:0},req,false);
        }
      }catch(e){jsonRes(res,400,{ok:false,error:'bad_request'},req,false);}
    });return;
  }
  if(url==='/cart.js'){
    try{const d=fs.readFileSync(path.join(__dirname,'cart.js'));res.writeHead(200,{'Content-Type':'application/javascript; charset=utf-8'});res.end(d);}
    catch(e){res.writeHead(404);res.end('');}return;
  }
  if(url.indexOf('/demo/')===0){
    const rel=url.replace(/^\/demo\//,'').split('?')[0].replace(/^\/+/,'');
    if(!rel||rel.indexOf('..')>=0){res.writeHead(403);res.end('');return;}
    const fp=path.join(__dirname,'demo',rel);
    const ext=path.extname(fp).toLowerCase();
    const ct={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'}[ext];
    if(!ct){res.writeHead(403);res.end('');return;}
    fs.readFile(fp,function(err,data){
      if(err){res.writeHead(404);res.end('');return;}
      res.writeHead(200,{'Content-Type':ct,'Cache-Control':'public, max-age=3600'});res.end(data);
    });return;
  }
  if(url==='/admin/login'){
    return fs.readFile(path.join(__dirname,'admin-login.html'),function(err,data){
      if(err){res.writeHead(404);res.end('Not found');return;}
      htmlRes(res,200,data,req,true);
    });
  }
  const file=PAGES[url]||null;
  if(!file){auth.setSecurityHeaders(res);res.writeHead(404);res.end('Not found');return;}
  if(url==='/admin'){
    var cfgA=auth.loadConfig();
    var adminSess=auth.findSession(cfgA,auth.parseCookies(req)[auth.SESSION_COOKIE]);
    if(!adminSess){
      res.writeHead(302,{'Location':'/admin/login'});
      res.end();
      return;
    }
  }
  fs.readFile(path.join(__dirname,file),function(err,data){
    if(err){auth.setSecurityHeaders(res);res.writeHead(404);res.end('Not found');return;}
    htmlRes(res,200,data,req,url==='/admin');
  });
}).listen(PORT,function(){
  console.log('Port: '+PORT);
  if(isPortalIntegrationEnabled()){
    console.log('[deploy] Portal entegrasyonu AÇIK — clinic-portal provisioning aktif');
  }else{
    console.log('[deploy] Mod: landing-only — portal/iyzico entegrasyonu kapalı');
    console.log('[deploy] Siparişler orders/ klasörüne kaydedilir; admin panelden görüntülenir');
  }
});