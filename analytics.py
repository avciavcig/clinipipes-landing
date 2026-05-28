content = open('index.html').read()
gtag = '<script async src="https://www.googletagmanager.com/gtag/js?id=G-1HLMF90KS3"></script>\n<script>\nwindow.dataLayer=window.dataLayer||[];\nfunction gtag(){dataLayer.push(arguments);}\ngtag("js",new Date());\ngtag("config","G-1HLMF90KS3");\n</script>\n'
open('index.html', 'w').write(content.replace('<head>', '<head>\n' + gtag))
print('OK')
