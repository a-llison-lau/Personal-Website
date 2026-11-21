# Render probe.html in a headless Firefox (throwaway profile, driven over Marionette) and save what it drew.
# Usage: python3 -I probe.py SITE_DIR OUT.png=probe.html?query [OUT2.png=probe.html?query2 ...]
# Serves SITE_DIR on localhost; probe.html hands back its canvas as a PNG once it has rendered.
import sys, os, json, socket, subprocess, threading, time, base64, tempfile, shutil, functools
import http.server, socketserver

SITE = sys.argv[1]; JOBS = [a.split('=', 1) for a in sys.argv[2:]]  # OUT.png=probe.html?query

# ---- local static server ----
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
Handler = functools.partial(Quiet, directory=SITE)
httpd = socketserver.TCPServer(('127.0.0.1', 0), Handler)
port = httpd.server_address[1]
threading.Thread(target=httpd.serve_forever, daemon=True).start()

# ---- Firefox with a fresh profile and Marionette ----
prof = tempfile.mkdtemp(prefix='ffcheck-')
mport = 2900 + (os.getpid() % 500)
with open(os.path.join(prof, 'user.js'), 'w') as f:
    for k, v in {
        'marionette.port': mport, 'browser.shell.checkDefaultBrowser': False,
        'datareporting.policy.dataSubmissionEnabled': False, 'toolkit.telemetry.reportingpolicy.firstRun': False,
        'browser.startup.homepage_override.mstone': 'ignore', 'browser.aboutwelcome.enabled': False,
        'webgl.force-enabled': True,
    }.items():
        f.write(f'user_pref("{k}", {json.dumps(v)});\n')
ff = subprocess.Popen(['/Applications/Firefox.app/Contents/MacOS/firefox', '--headless', '--marionette', '-no-remote',
                       '-profile', prof, '--width', '1280', '--height', '800'],
                      stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def connect():
    for _ in range(60):
        try:
            return socket.create_connection(('127.0.0.1', mport), timeout=60)
        except OSError:
            time.sleep(0.5)
    raise SystemExit('marionette did not start')
sock = connect()
buf = b''
def recv():
    global buf
    while b':' not in buf:
        buf += sock.recv(65536)
    n, rest = buf.split(b':', 1)
    n = int(n)
    while len(rest) < n:
        rest += sock.recv(1 << 20)
    buf = rest[n:]
    return json.loads(rest[:n])
recv()  # handshake
mid = 0
def cmd(name, params=None):
    global mid
    mid += 1
    data = json.dumps([0, mid, name, params or {}]).encode()
    sock.sendall(str(len(data)).encode() + b':' + data)
    while True:
        msg = recv()
        if msg[0] == 1 and msg[1] == mid:
            if msg[2]:
                raise RuntimeError(f'{name}: {msg[2]}')
            return msg[3]

def js(script):
    return cmd('WebDriver:ExecuteScript', {'script': script, 'args': []}).get('value')

def shot(name):
    png = cmd('WebDriver:TakeScreenshot', {'full': bool(os.environ.get('FULL'))})['value']
    open(os.path.join(OUT, name), 'wb').write(base64.b64decode(png))


try:
    cmd('WebDriver:NewSession', {'capabilities': {}})
    cmd('WebDriver:SetWindowRect', {'width': 1700, 'height': 1000})
    for out, page in JOBS:
        cmd('WebDriver:Navigate', {'url': f'http://127.0.0.1:{port}/{page}'})
        for i in range(90):
            time.sleep(0.5)
            r = js("return window.__probe || null;")
            if r: break
        if not r:
            print('TIMEOUT', page); continue
        open(out, 'wb').write(base64.b64decode(r['png'].split(',', 1)[1]))
        print('wrote', out, 'fov', r['fov'], 'gltf yfov', r['yfovGltf'], 'pos', r.get('pos'), 'quat', r.get('quat'))
finally:
    try: ff.kill()
    except Exception: pass
    shutil.rmtree(prof, ignore_errors=True)
