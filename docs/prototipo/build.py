"""Gera dist/index.html (arquivo único, com imagens embutidas) a partir de src/.
Uso: python3 build.py"""
import base64, glob, os, re
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src')
OUT = os.path.join(os.path.dirname(SRC), 'dist', 'index.html')
MIME = {'.webp':'image/webp', '.jpg':'image/jpeg', '.png':'image/png', '.svg':'image/svg+xml'}

def data_uri(name):
    p = os.path.join(SRC, 'assets', name)
    return f"data:{MIME[os.path.splitext(name)[1]]};base64," + base64.b64encode(open(p,'rb').read()).decode()

def read(p): return open(p, encoding='utf-8').read()

css = '\n'.join(read(p) for p in sorted(glob.glob(os.path.join(SRC,'css','*.css'))))
assets_js = ("/* 00 · imagens embutidas pelo build */\nconst ASSETS = {\n"
             f"  logoCor: '{data_uri('logo-cor.webp')}',\n"
             f"  ilustracao: '{data_uri('ilustracao-clara.webp')}'\n}};\n")
js = assets_js + '\n'.join(read(p) for p in sorted(glob.glob(os.path.join(SRC,'js','*.js'))))

html = read(os.path.join(SRC, 'index.html'))
html = html.replace('/*@@CSS@@*/', css).replace('/*@@JS@@*/', js)
html = re.sub(r'@@ASSET:([\w.-]+)@@', lambda m: data_uri(m.group(1)), html)
assert '@@' not in html.replace("'@@", ''), 'placeholder sem substituir'
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, 'w', encoding='utf-8').write(html)
print('ok', OUT, f'{len(html)//1024} KB')
