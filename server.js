const http=require('http');const fs=require('fs');const path=require('path');const os=require('os');const https=require('https');const{execSync}=require('child_process');
const{createAdminAuth}=require('./lib/admin-auth');
const mailer=require('./lib/admin-mailer');
const pubSec=require('./lib/public-security');
const ordersStore=require('./lib/orders-store');
const{provisionClinic,isPortalIntegrationEnabled,getProvisioningMode}=require('./lib/portal-bridge');
const{getPlatformSyncInfo}=require('./lib/platform-sync');
const{fetchPortalPlatformInfo}=require('./lib/portal-release');
const demoCaptureEnv=require('./lib/demo-capture-env');
(function loadEnvFile(){
  var envPath=path.join(__dirname,'.env');
  if(!fs.existsSync(envPath))return;
  fs.readFileSync(envPath,'utf8').split('\n').forEach(function(line){
    var m=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)?\s*$/);
    if(!m||process.env[m[1]])return;
    var val=(m[2]||'').trim();
    if((val.charAt(0)==='"'&&val.charAt(val.length-1)==='"')||(val.charAt(0)==="'"&&val.charAt(val.length-1)==="'"))val=val.slice(1,-1);
    process.env[m[1]]=val;
  });
})();
const PORT=process.env.PORT||8080;
const ADMIN_KEY=process.env.ADMIN_KEY||'admin123';
const GITHUB_TOKEN=process.env.GITHUB_TOKEN||'';
const GITHUB_REPO='avciavcig/clinipipes-landing';
const GITHUB_BRANCH='main';
const PAGES={'/':'index.html','/hakkimizda':'hakkimizda.html','/hakkimizda.html':'hakkimizda.html','/gizlilik':'gizlilik.html','/gizlilik.html':'gizlilik.html','/veri-rolu':'veri-rolu.html','/veri-rolu.html':'veri-rolu.html','/cerez-politikasi':'cerez-politikasi.html','/cerez-politikasi.html':'cerez-politikasi.html','/teslimat':'teslimat.html','/teslimat.html':'teslimat.html','/mesafeli-satis':'mesafeli-satis.html','/mesafeli-satis.html':'mesafeli-satis.html','/on-bilgilendirme':'on-bilgilendirme.html','/on-bilgilendirme.html':'on-bilgilendirme.html','/sss':'sss.html','/sss.html':'sss.html','/kullanim-kosullari':'kullanim-kosullari.html','/kullanim-kosullari.html':'kullanim-kosullari.html','/etk':'etk.html','/etk.html':'etk.html','/admin':'admin.html'};
const EDITABLE=['index.html','hakkimizda.html','gizlilik.html','veri-rolu.html','cerez-politikasi.html','teslimat.html','mesafeli-satis.html','on-bilgilendirme.html','sss.html','kullanim-kosullari.html','etk.html','content.json','legal-seller.json','scripts/legal-content.mjs','demo-data.json','demo/shared.css','demo/treatment-proposal.css','demo/dashboard.html','demo/sales.html','demo/form.html','demo/doctor.html','demo/pdf.html'];
const DEMO_IDS=['dashboard','sales','form','pdf','doctor'];
const LEGAL_PAGES=['hakkimizda.html','gizlilik.html','veri-rolu.html','cerez-politikasi.html','teslimat.html','mesafeli-satis.html','on-bilgilendirme.html','sss.html','kullanim-kosullari.html','etk.html'];
const DATA_DIR=process.env.ADMIN_DATA_DIR||process.env.RAILWAY_VOLUME_MOUNT_PATH||__dirname;
const ANALYTICS_FILE=path.join(DATA_DIR,'analytics.json');
const LOCAL_ADMIN=path.join(DATA_DIR,'admin_local.json');
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
function require2faEnabled(res,req,cfg){
  if(cfg.totpEnabled)return true;
  jsonRes(res,403,{ok:false,error:'2fa_required',message:'Güvenlik için önce 2FA kurulumu gerekli. Profil sekmesine gidin.'},req,true);
  return false;
}
function requireAdminWith2fa(req,res,qs,csrf){
  var data=requireAdmin(req,res,qs,csrf);
  if(!data)return null;
  if(!require2faEnabled(res,req,data.cfg))return null;
  return data;
}
function setSessionCookies(res,req,session){
  auth.setCookie(res,auth.SESSION_COOKIE,session.token,8*3600,req);
}
function mailNotConfigured(res,req){
  return jsonRes(res,503,{ok:false,error:'mail_not_configured',message:mailer.configError()},req,true);
}
function getAnalytics(){try{return JSON.parse(fs.readFileSync(ANALYTICS_FILE,'utf-8'));}catch(e){return{total:0,daily:{},cities:{},provinces:{},devices:{},recent:[]};}}
function saveAnalytics(d){fs.writeFileSync(ANALYTICS_FILE,JSON.stringify(d),'utf-8');}

function githubPut(fn,content,msg,cb){
  const p='/repos/'+GITHUB_REPO+'/contents/'+fn.split('/').map(encodeURIComponent).join('/');
  const hdr={
    'Authorization':'Bearer '+GITHUB_TOKEN,
    'User-Agent':'clinipipes-admin',
    'Accept':'application/vnd.github+json',
    'X-GitHub-Api-Version':'2022-11-28'
  };
  https.get({hostname:'api.github.com',path:p+'?ref='+GITHUB_BRANCH,headers:hdr},function(r){
    let d='';r.on('data',function(c){d+=c;});r.on('end',function(){
      let sha=null;
      if(r.statusCode===200){try{sha=JSON.parse(d).sha;}catch(e){}}
      const body=JSON.stringify({message:msg,content:Buffer.from(content).toString('base64'),sha:sha,branch:GITHUB_BRANCH});
      const req=https.request({hostname:'api.github.com',path:p,method:'PUT',headers:Object.assign({'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)},hdr)},
        function(r2){let d2='';r2.on('data',function(c){d2+=c;});r2.on('end',function(){
          var ok=r2.statusCode===200||r2.statusCode===201;
          var err=null;
          if(!ok){try{err=JSON.parse(d2).message||('HTTP '+r2.statusCode);}catch(e){err='HTTP '+r2.statusCode;}}
          cb(ok,err);
        });});
      req.on('error',function(){cb(false,'network_error');});req.write(body);req.end();
    });
  }).on('error',function(){cb(false,'network_error');});
}
function syncLegalOutput(outDir){
  if(outDir===__dirname)return true;
  var ok=true;
  LEGAL_PAGES.forEach(function(fn){
    try{fs.writeFileSync(path.join(__dirname,fn),fs.readFileSync(path.join(outDir,fn),'utf-8'),'utf-8');}
    catch(e){ok=false;}
  });
  return ok;
}
function pushLegalPagesToGithub(outDir,idx,errors,cb){
  if(idx>=LEGAL_PAGES.length)return cb(errors);
  var fn=LEGAL_PAGES[idx];
  try{
    var content=fs.readFileSync(path.join(outDir,fn),'utf-8');
    githubPut(fn,content,'Admin: rebuild legal pages',function(gok,err){
      if(!gok)errors.push(fn+(err?(': '+err):''));
      pushLegalPagesToGithub(outDir,idx+1,errors,cb);
    });
  }catch(e){
    errors.push(fn+': '+e.message);
    pushLegalPagesToGithub(outDir,idx+1,errors,cb);
  }
}
function canWriteDir(dir){
  try{var t=path.join(dir,'.wtest-'+Date.now());fs.writeFileSync(t,'1');fs.unlinkSync(t);return true;}catch(e){return false;}
}
function commit(fn,content,cb){
  var text=typeof content==='string'?content:JSON.stringify(content,null,2);
  var localOk=false;
  try{fs.writeFileSync(path.join(__dirname,fn),text,'utf-8');localOk=true;}catch(e){
    if(!GITHUB_TOKEN)return cb(false,e.message);
  }
  if(GITHUB_TOKEN){githubPut(fn,text,'Admin: '+fn,function(gok){cb(!!(localOk||gok),localOk?'local':'github');});}
  else{cb(localOk);}
}
function rebuildLegalPages(cb){
  var outDir=canWriteDir(__dirname)?__dirname:path.join(os.tmpdir(),'clinipipes-legal');
  try{
    if(outDir!==__dirname)fs.mkdirSync(outDir,{recursive:true});
    execSync('node scripts/build-legal-pages.mjs',{cwd:__dirname,env:Object.assign({},process.env,{LEGAL_OUT_DIR:outDir}),stdio:'pipe'});
  }catch(e){
    var msg=e.message||'build_failed';
    if(e.stderr)msg+=' — '+String(e.stderr).trim();
    cb({ok:false,error:msg,local:false,github:false});return;
  }
  var localOk=syncLegalOutput(outDir);
  if(!GITHUB_TOKEN){
    cb({ok:localOk,error:localOk?null:'write_failed',local:localOk,github:false});
    return;
  }
  pushLegalPagesToGithub(outDir,0,[],function(errors){
    var githubOk=!errors.length;
    if(localOk){
      cb({
        ok:true,
        error:null,
        local:true,
        github:githubOk,
        warning:githubOk?null:('GitHub push başarısız: '+errors[0]+(errors.length>1?' (+'+(errors.length-1)+' dosya)':''))
      });
      return;
    }
    if(githubOk){
      cb({ok:true,error:null,local:false,github:true});
      return;
    }
    cb({ok:false,error:errors[0]||'github_push_failed',local:false,github:false,details:errors});
  });
}

function mergeContent(inc){
  var ex={};
  try{ex=JSON.parse(fs.readFileSync(path.join(__dirname,'content.json'),'utf-8'));}catch(e){}
  if(inc.pricing){
    ex.pricing=ex.pricing||{};
    if(inc.pricing.starter)ex.pricing.starter=Object.assign(ex.pricing.starter||{},inc.pricing.starter);
    if(inc.pricing.professional)ex.pricing.professional=Object.assign(ex.pricing.professional||{},inc.pricing.professional);
    if(inc.pricing.setup)ex.pricing.setup=Object.assign(ex.pricing.setup||{},inc.pricing.setup);
    if(inc.pricing.bundleDiscount!=null)ex.pricing.bundleDiscount=inc.pricing.bundleDiscount;
  }
  if(inc.introductoryCampaign)ex.introductoryCampaign=Object.assign(ex.introductoryCampaign||{},inc.introductoryCampaign);
  if(inc.prices)ex.prices=inc.prices;
  if(inc.promo)ex.promo=Object.assign(ex.promo||{},inc.promo);
  if(inc.founding&&!inc.promo){
    ex.promo=Object.assign(ex.promo||{},{active:inc.founding.program_active!==false,strip_tr:inc.founding.strip_sub_tr||inc.founding.strip_tr,strip_en:inc.founding.strip_sub_en||inc.founding.strip_en});
  }
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
  function finishCapture(source){
    try{
      var c=JSON.parse(fs.readFileSync(path.join(__dirname,'content.json'),'utf-8'));
      c.demo=c.demo||{};c.demo.version=(c.demo.version||1)+1;
      fs.writeFileSync(path.join(__dirname,'content.json'),JSON.stringify(c));
      if(!GITHUB_TOKEN){cb(true,{source:source});return;}
      var files=DEMO_IDS.map(function(id){return'demo/'+id+'.png';}).concat(['content.json']);
      var pending=files.length,done=0,ok=true;
      files.forEach(function(fn){
        try{
          var content=fn==='content.json'?JSON.stringify(c):fs.readFileSync(path.join(__dirname,fn));
          githubPut(fn,content,'Admin: capture demo',function(g){if(!g)ok=false;done++;if(done===pending)cb(ok,{source:source});});
        }catch(e){ok=false;done++;if(done===pending)cb(ok,e.message);}
      });
    }catch(e){cb(false,e.message);}
  }
  try{
    execSync('node scripts/capture-production-demo.mjs',{cwd:__dirname,stdio:'pipe',timeout:240000,env:process.env});
    finishCapture('production');
  }catch(e){
    var errMsg=e.stderr?e.stderr.toString():e.message;
    console.warn('[capture] Production capture failed:',errMsg.slice(0,300));
    if(process.env.NODE_ENV==='production'){
      cb(false,errMsg.slice(0,300)||'capture_failed');
      return;
    }
    console.warn('[capture] Dev fallback: local demo HTML');
    try{
      execSync('node scripts/capture-demo.mjs',{cwd:__dirname,stdio:'pipe',timeout:120000,env:Object.assign({},process.env,{PORT:process.env.PORT||8080})});
      finishCapture('local');
    }catch(e2){cb(false,e2.stderr?e2.stderr.toString():e2.message);}
  }
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
    var method=auth.getTwoFactorMethod(cfg);
    return jsonRes(res,200,{
      twoFactorRequired:!!cfg.totpEnabled,
      twoFactorMethod:method||'email',
      emailMask:mailer.maskEmail(mailer.getAdmin2faEmail()),
      mailConfigured:mailer.isConfigured()
    },req,true);
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
        var method=auth.getTwoFactorMethod(cfg);
        if(!password){return jsonRes(res,400,{ok:false,error:'password_required'},req,true);}
        if(!auth.verifyPassword(password,auth.getStoredPasswordHash(cfg))){
          var retry=auth.recordFailedLogin(cfg,ip);
          return jsonRes(res,401,{ok:false,error:'invalid_credentials',retryAfter:retry||undefined},req,true);
        }
        if(cfg.totpEnabled){
          if(!totp){
            if(method==='email'){
              if(!mailer.isConfigured())return mailNotConfigured(res,req);
              var loginCode=auth.createEmailOtp('login:'+ip);
              var pTokenE=auth.createPending2fa(ip,loginCode);
              return mailer.sendAdminCode(loginCode,'login').then(function(sent){
                if(!sent.ok){
                  auth.clearEmailOtp('login:'+ip);
                  auth.finishPending2fa(pTokenE);
                  return jsonRes(res,503,{ok:false,error:sent.error||'send_failed',message:sent.error||sent.message||'Doğrulama e-postası gönderilemedi.'},req,true);
                }
                return jsonRes(res,200,{ok:false,needs2fa:true,pending:pTokenE,twoFactorMethod:'email',emailMask:mailer.maskEmail(mailer.getAdmin2faEmail()),message:'Doğrulama kodu e-postanıza gönderildi.'},req,true);
              });
            }
            var pToken=auth.createPending2fa(ip);
            return jsonRes(res,200,{ok:false,needs2fa:true,pending:pToken,twoFactorMethod:'totp'},req,true);
          }
          if(method==='email'){
            if(!pending||!auth.verifyPendingEmailCode(pending,ip,totp)){
              var retryE=auth.recordFailedLogin(cfg,ip);
              return jsonRes(res,401,{ok:false,error:'invalid_2fa',retryAfter:retryE||undefined,message:'E-posta kodu hatalı veya süresi doldu. Şifre ile tekrar deneyin.'},req,true);
            }
            auth.finishPending2fa(pending);
            auth.clearEmailOtp('login:'+ip);
          }else{
            if(pending&&!auth.peekPending2fa(pending,ip)){
              return jsonRes(res,401,{ok:false,error:'session_expired'},req,true);
            }
            if(!auth.verifyTotp(cfg.totpSecret,totp)){
              var retry2=auth.recordFailedLogin(cfg,ip);
              return jsonRes(res,401,{ok:false,error:'invalid_2fa',retryAfter:retry2||undefined},req,true);
            }
            if(pending)auth.finishPending2fa(pending);
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
    return jsonRes(res,200,{ok:true,csrf:sess.csrf,totpEnabled:!!cfgM.totpEnabled,twoFactorMethod:auth.getTwoFactorMethod(cfgM)||'email',emailMask:mailer.maskEmail(mailer.getAdmin2faEmail()),require2faSetup:!cfgM.totpEnabled,mailConfigured:mailer.isConfigured(),mailProvider:mailer.getMailProvider(),mailError:mailer.isConfigured()?null:mailer.configError()},req,true);
  }
  if(url==='/api/admin/2fa/send-code'&&req.method==='POST'){
    if(!requireAdmin(req,res,qs))return;
    return auth.readBody(req,function(err,body){
      if(err){return jsonRes(res,413,{ok:false,error:'payload_too_large'},req,true);}
      try{
        var data=JSON.parse(body||'{}');
        var purpose=String(data.purpose||'setup');
        var cfgC=auth.loadConfig();
        var sessC=auth.findSession(cfgC,auth.parseCookies(req)[auth.SESSION_COOKIE]);
        if(!sessC){return jsonRes(res,401,{ok:false,error:'unauthorized'},req,true);}
        if(!mailer.isConfigured())return mailNotConfigured(res,req);
        if(purpose==='setup'&&cfgC.totpEnabled){return jsonRes(res,400,{ok:false,error:'already_enabled'},req,true);}
        if((purpose==='disable'||purpose==='password')&&!cfgC.totpEnabled){return jsonRes(res,400,{ok:false,error:'not_enabled'},req,true);}
        var otpKey=purpose+':'+sessC.token;
        var code=auth.createEmailOtp(otpKey);
        return mailer.sendAdminCode(code,purpose).then(function(sent){
          if(!sent.ok){
            auth.clearEmailOtp(otpKey);
            return jsonRes(res,503,{ok:false,error:sent.error||'send_failed',message:sent.error||'E-posta gönderilemedi.'},req,true);
          }
          return jsonRes(res,200,{ok:true,emailMask:mailer.maskEmail(mailer.getAdmin2faEmail()),message:'Doğrulama kodu gönderildi.'},req,true);
        });
      }catch(e){return jsonRes(res,400,{ok:false,error:'bad_request'},req,true);}
    });
  }
  if(url==='/api/admin/2fa/enable'&&req.method==='POST'){
    if(!requireAdmin(req,res,qs))return;
    return auth.readBody(req,function(err,body){
      if(err){return jsonRes(res,413,{ok:false,error:'payload_too_large'},req,true);}
      try{
        var data=JSON.parse(body||'{}');
        var cfgE=auth.loadConfig();
        var sessE=auth.findSession(cfgE,auth.parseCookies(req)[auth.SESSION_COOKIE]);
        if(!sessE){return jsonRes(res,401,{ok:false,error:'unauthorized'},req,true);}
        var code=auth.normalizeOtpCode(data.code);
        if(!/^\d{6}$/.test(code)){return jsonRes(res,400,{ok:false,error:'invalid_format',message:'6 haneli sayısal kod girin.'},req,true);}
        if(data.method==='email'||!data.setupSecret){
          if(!auth.verifyEmailOtp('setup:'+sessE.token,code)){
            return jsonRes(res,401,{ok:false,error:'invalid_2fa',message:'E-posta kodu hatalı veya süresi doldu. Yeni kod isteyin.'},req,true);
          }
          cfgE.totpEnabled=true;
          cfgE.twoFactorMethod='email';
          cfgE.totpSecret=null;
          cfgE.admin2faEmail=mailer.getAdmin2faEmail();
          cfgE.totpDisabledExplicitly=false;
          auth.clearPendingTotpSecret(cfgE,sessE.token);
          auth.saveConfig(cfgE);
          return jsonRes(res,200,{ok:true,twoFactorMethod:'email'},req,true);
        }
        var clientSecret=auth.normalizeTotpSecret(data.setupSecret);
        if(!clientSecret){return jsonRes(res,400,{ok:false,error:'missing_setup_secret',message:'Kurulumu yeniden başlatın.'},req,true);}
        if(!auth.verifyTotp(clientSecret,code)){
          return jsonRes(res,401,{ok:false,error:'invalid_2fa',message:'Kod eşleşmedi.',serverCode:auth.currentTotpCode(clientSecret)},req,true);
        }
        cfgE.totpSecret=clientSecret;
        cfgE.totpEnabled=true;
        cfgE.twoFactorMethod='totp';
        cfgE.totpDisabledExplicitly=false;
        auth.clearPendingTotpSecret(cfgE,sessE.token);
        auth.saveConfig(cfgE);
        return jsonRes(res,200,{ok:true,twoFactorMethod:cfgE.twoFactorMethod},req,true);
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
        var sessD=auth.findSession(cfgD,auth.parseCookies(req)[auth.SESSION_COOKIE]);
        if(!sessD){return jsonRes(res,401,{ok:false,error:'unauthorized'},req,true);}
        if(!auth.verifyPassword(String(data.password||''),auth.getStoredPasswordHash(cfgD))){return jsonRes(res,401,{ok:false,error:'invalid_credentials'},req,true);}
        if(cfgD.totpEnabled){
          var methodD=auth.getTwoFactorMethod(cfgD);
          if(methodD==='email'){
            if(!auth.verifyEmailOtp('disable:'+sessD.token,data.code)){return jsonRes(res,401,{ok:false,error:'invalid_2fa',message:'E-posta kodu hatalı veya süresi doldu.'},req,true);}
          }else if(!auth.verifyTotp(cfgD.totpSecret,data.code)){
            return jsonRes(res,401,{ok:false,error:'invalid_2fa'},req,true);
          }
        }
        cfgD.totpEnabled=false;
        cfgD.totpSecret=null;
        cfgD.twoFactorMethod=null;
        cfgD.totpDisabledExplicitly=true;
        auth.clearPendingTotpSecret(cfgD,null);
        auth.saveConfig(cfgD);
        return jsonRes(res,200,{ok:true},req,true);
      }catch(e){return jsonRes(res,400,{ok:false,error:'bad_request'},req,true);}
    });
  }
  if(url==='/api/admin/2fa/reset-with-password'&&req.method==='POST'){
    return auth.readBody(req,function(err,body){
      if(err){return jsonRes(res,413,{ok:false,error:'payload_too_large'},req,true);}
      var ip=auth.getClientIp(req);
      var cfgR=auth.loadConfig();
      var allowed=auth.checkLoginAllowed(cfgR,ip);
      if(!allowed.ok){return jsonRes(res,429,{ok:false,error:'locked',retryAfter:allowed.retryAfter},req,true);}
      try{
        var dataR=JSON.parse(body||'{}');
        var passwordR=String(dataR.password||'');
        if(!passwordR){return jsonRes(res,400,{ok:false,error:'password_required'},req,true);}
        if(!auth.verifyPassword(passwordR,auth.getStoredPasswordHash(cfgR))){
          var retryR=auth.recordFailedLogin(cfgR,ip);
          return jsonRes(res,401,{ok:false,error:'invalid_credentials',retryAfter:retryR||undefined},req,true);
        }
        auth.clearFailedLogin(cfgR,ip);
        auth.resetTotpSetup(cfgR);
        return jsonRes(res,200,{ok:true,message:'2FA sıfırlandı. Şifre ile giriş yapıp kurulumu yeniden başlatın.'},req,true);
      }catch(e){return jsonRes(res,400,{ok:false,error:'bad_request'},req,true);}
    });
  }


  if(url==='/api/admin/mail-test'&&req.method==='POST'){
    if(!requireAdmin(req,res,qs))return;
    if(!mailer.isConfigured())return mailNotConfigured(res,req);
    return mailer.sendTestEmail().then(function(sent){
      if(!sent.ok){
        return jsonRes(res,503,{ok:false,error:sent.error||'send_failed',message:sent.error||'Test e-postası gönderilemedi.'},req,true);
      }
      return jsonRes(res,200,{ok:true,message:'Test e-postası gönderildi: '+mailer.maskEmail(mailer.getAdmin2faEmail())},req,true);
    });
  }

  if(url==='/api/checkout-token'&&req.method==='GET'){
    auth.setSecurityHeaders(res);
    var token=pubSec.createCheckoutToken();
    var iyzicoEnabled=process.env.IYZICO_ENABLED==='true';
    return jsonRes(res,200,{token:token,expiresIn:1800,provisioningMode:getProvisioningMode(),iyzicoEnabled:iyzicoEnabled},req,false);
  }
  if(url==='/api/iyzico-start'&&req.method==='POST'){
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
        var portalBase=(process.env.CLINIC_PORTAL_URL||'').replace(/\/$/,'');
        if(!portalBase){return jsonRes(res,503,{ok:false,error:'portal_not_configured'},req,false);}
        var integration=require('./lib/integration-auth');
        var payload={
          orderId:data.orderId||('ord_'+require('crypto').randomBytes(12).toString('hex')),
          clinicName:pubSec.sanitizeText(data.clinicName,120),
          ownerEmail:pubSec.sanitizeEmail(data.ownerEmail),
          ownerName:pubSec.sanitizeText(data.ownerName||data.clinicName,120),
          phone:pubSec.sanitizeText(data.phone,32),
          plan:data.plan==='pro'?'pro':'starter',
          period:data.period==='yearly'?'yearly':'monthly',
          items:Array.isArray(data.items)?data.items.slice(0,5):[],
          consents:data.consents||{}
        };
        if(!payload.clinicName||!payload.ownerEmail){
          return jsonRes(res,400,{ok:false,error:'invalid_order'},req,false);
        }
        var headers=integration.buildSignedHeaders(payload);
        var httpsLib=require('https'),httpLib=require('http');
        var urlParsed=require('url').parse(portalBase+'/internal/webhooks/clinipipes/iyzico-start');
        var rawBody=JSON.stringify(payload);
        var lib2=urlParsed.protocol==='https:'?httpsLib:httpLib;
        var preq=lib2.request({
          hostname:urlParsed.hostname,port:urlParsed.port||(urlParsed.protocol==='https:'?443:80),
          path:urlParsed.path,method:'POST',
          headers:Object.assign({'Content-Length':Buffer.byteLength(rawBody)},headers),
          timeout:20000
        },function(pres){
          var d='';
          pres.on('data',function(c){d+=c;});
          pres.on('end',function(){
            try{
              auth.setSecurityHeaders(res);
              res.writeHead(pres.statusCode,{'Content-Type':'application/json; charset=utf-8'});
              res.end(d);
            }catch(e){jsonRes(res,502,{ok:false,error:'portal_response_invalid'},req,false);}
          });
        });
        preq.on('error',function(){jsonRes(res,502,{ok:false,error:'portal_unreachable'},req,false);});
        preq.on('timeout',function(){preq.destroy();jsonRes(res,504,{ok:false,error:'portal_timeout'},req,false);});
        preq.write(rawBody);
        preq.end();
      }catch(e){return jsonRes(res,400,{ok:false,error:'bad_request'},req,false);}
    });
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
          consents:{preInfo:!!data.consents&&!!data.consents.preInfo,agree:!!data.consents&&!!data.consents.agree,terms:!!data.consents&&!!data.consents.terms,digital:!!data.consents&&!!data.consents.digital,kvkk:!!data.consents&&!!data.consents.kvkk},
          active:false,
          status:'pending_payment',
          createdAt:new Date().toISOString(),
          sourceIp:ip
        };
        if(!order.consents.preInfo||!order.consents.agree||!order.consents.terms||!order.consents.digital||!order.consents.kvkk){
          return jsonRes(res,400,{ok:false,error:'consents_required'},req,false);
        }
        try{ordersStore.saveOrder(order);}catch(saveErr){
          return jsonRes(res,500,{ok:false,error:'order_save_failed'},req,false);
        }
        console.log('[order] '+orderId+' '+clinicName+' <'+ownerEmail+'> plan='+plan+' ('+getProvisioningMode()+')');
        if(getProvisioningMode()==='manual'){
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
  if(url==='/legal-seller.json'){
    try{const d=fs.readFileSync(path.join(__dirname,'legal-seller.json'));auth.setSecurityHeaders(res);res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-cache'});res.end(d);}
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
    fetchPortalPlatformInfo().then(function(probe){
      var release=(probe&&probe.release)||null;
      return jsonRes(res,200,{ok:true,orders:ordersStore.listOrders(limit),integrationEnabled:getProvisioningMode()==='auto',platformSync:getPlatformSyncInfo({provisioningMode:getProvisioningMode(),portalRelease:release,portalReleaseLive:!!(probe&&probe.ok)}),portalReleaseProbe:probe?{ok:probe.ok,live:!!probe.live,error:probe.error||null}:null},req,true);
    }).catch(function(){
      return jsonRes(res,200,{ok:true,orders:ordersStore.listOrders(limit),integrationEnabled:getProvisioningMode()==='auto',platformSync:getPlatformSyncInfo({provisioningMode:getProvisioningMode()})},req,true);
    });
    return;
  }
  if(url==='/api/rebuild-legal'&&req.method==='POST'){
    if(!requireAdmin(req,res,qs))return;
    rebuildLegalPages(function(result){
      jsonRes(res,200,{
        ok:!!result.ok,
        error:result.error||null,
        local:!!result.local,
        github:!!result.github,
        warning:result.warning||null,
        details:result.details||null
      },req,true);
    });return;
  }
  if(url==='/api/save-demo-image'&&req.method==='POST'){
    if(!requireAdminWith2fa(req,res,qs))return;
    auth.readBody(req,function(err,body){
      if(err){return jsonRes(res,413,{ok:false,error:'payload_too_large'},req,true);}
      try{var data=JSON.parse(body);
      saveDemoImage(data.id,data.image,function(ok,err){
        jsonRes(res,200,{ok:ok,error:err||null},req,true);
      });}catch(e){jsonRes(res,400,{ok:false,error:e.message},req,true);}
    });return;
  }
  if(url==='/api/capture-demo'&&req.method==='POST'){
    if(!requireAdminWith2fa(req,res,qs))return;
    captureDemoScreens(function(ok,err){
      jsonRes(res,200,{ok:ok,error:err||null},req,true);
    });return;
  }
  if(url==='/api/admin/demo-capture-status'&&req.method==='GET'){
    if(!requireAdminWith2fa(req,res,qs))return;
    demoCaptureEnv.getCombinedDemoCaptureStatus().then(function(status){
      jsonRes(res,200,{ok:true,status:status},req,true);
    }).catch(function(e){
      jsonRes(res,500,{ok:false,error:e.message||'status_failed'},req,true);
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
        if(cfgP.totpEnabled){
          var methodP=auth.getTwoFactorMethod(cfgP);
          var sessP=auth.findSession(cfgP,auth.parseCookies(req)[auth.SESSION_COOKIE]);
          if(methodP==='email'){
            if(!sessP||!auth.verifyEmailOtp('password:'+sessP.token,data.totp)){
              return jsonRes(res,401,{ok:false,error:'invalid_2fa',message:'E-posta kodu hatalı veya süresi doldu.'},req,true);
            }
          }else if(!auth.verifyTotp(cfgP.totpSecret,data.totp)){
            return jsonRes(res,401,{ok:false,error:'invalid_2fa'},req,true);
          }
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
    if(!requireAdminWith2fa(req,res,qs))return;
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
        if(data.filename==='legal-seller.json'){try{JSON.parse(content);}catch(e){return jsonRes(res,400,{ok:false,error:'invalid_json',message:'legal-seller.json geçerli JSON değil.'},req,true);}}
        commit(data.filename,content,function(ok,mode){
          if(!ok)return jsonRes(res,500,{ok:false,error:'write_failed',message:'Dosya kaydedilemedi. GITHUB_TOKEN veya yazma izni kontrol edin.'},req,true);
          if(data.filename==='legal-seller.json'){
            return rebuildLegalPages(function(result){
              jsonRes(res,200,{ok:true,github:mode==='github',legal:result},req,true);
            });
          }
          jsonRes(res,200,{ok:true,github:mode==='github'},req,true);
        });
      }else{
        var merged=mergeContent(JSON.parse(body));
        fs.writeFileSync(path.join(__dirname,'content.json'),merged);
        if(GITHUB_TOKEN){githubPut('content.json',merged,'Admin: content.json',function(ok){jsonRes(res,200,{ok:true,github:ok},req,true);});}
        else{jsonRes(res,200,{ok:true,github:false},req,true);}
      }}catch(e){jsonRes(res,400,{ok:false,error:e.message},req,true);}
    });return;
  }
  if(url==='/lib/pricing-config.js'){
    try{const d=fs.readFileSync(path.join(__dirname,'lib/pricing-config.js'));res.writeHead(200,{'Content-Type':'application/javascript; charset=utf-8'});res.end(d);}
    catch(e){res.writeHead(404);res.end('');}return;
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
    const ct={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'}[ext];
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
    if(LEGAL_PAGES.includes(file)||file==='index.html'){
      import('./lib/legal-seller.mjs').then(function(mod){
        try{
          var S=mod.loadLegalSeller(__dirname);
          var raw=data.toString('utf8');
          var html=file==='index.html'?mod.applyIndexContact(raw,S):mod.applyLegalHtml(raw,S);
          htmlRes(res,200,html,req,false);
        }catch(e){
          htmlRes(res,200,data,req,false);
        }
      }).catch(function(){
        htmlRes(res,200,data,req,false);
      });
      return;
    }
    htmlRes(res,200,data,req,url==='/admin');
  });
}).listen(PORT,function(){
  console.log('Port: '+PORT);
  var provMode=getProvisioningMode();
  if(provMode==='auto'){
    console.log('[deploy] Başvuru modu: otomatik — checkout sonrası portal provisioning');
  }else if(isPortalIntegrationEnabled()){
    console.log('[deploy] Başvuru modu: manuel — ENABLE_PORTAL_INTEGRATION açık ama secret/URL eksik');
  }else{
    console.log('[deploy] Mod: landing-only — portal entegrasyonu kapalı');
    console.log('[deploy] Siparişler orders/ klasörüne kaydedilir; admin panelden görüntülenir');
  }
});