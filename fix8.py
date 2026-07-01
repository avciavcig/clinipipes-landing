with open('server.js', 'r', encoding='utf-8') as f:
    s = f.read()

old = "https.get({hostname:'ip-api.com',path:'/json/'+ip+'?fields=city,regionName,country,countryCode,status'},function(r){"
new = "https.get({hostname:'ipinfo.io',path:'/'+ip+'/json'},function(r){"
assert old in s, "old not found"
s = s.replace(old, new)

old2 = """      try{const g=JSON.parse(d);if(g.status==='success'){geoCache[ip]=g;cb(g);}else cb(null);}catch(e){cb(null);}"""
new2 = """      try{const g=JSON.parse(d);if(g.city){const norm={city:g.city,regionName:g.region,country:g.country==='TR'?'Turkey':g.country};geoCache[ip]=norm;cb(norm);}else cb(null);}catch(e){cb(null);}"""
assert old2 in s, "old2 not found"
s = s.replace(old2, new2)

with open('server.js', 'w', encoding='utf-8') as f:
    f.write(s)

print("OK - switched to ipinfo.io")
