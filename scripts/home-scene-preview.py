"""Unified homepage acceptance. Evidence goes to --output (ignored by Git by default).

The default navigation mode checks the current sidebars and bottom music dock.
The snapshots mode updates public/page-previews/ from local pages. It may read
the public production anime data when local data is unavailable, while keeping
the current local renderer and styles. Synthetic fixtures are never published.

Requires Python Playwright and Pillow. The music fixture is local test audio;
it validates the real MusicProvider, not availability of an external music API.
"""
import argparse
import io
import json
import math
from pathlib import Path
import struct
import subprocess
import time
import wave
from urllib.parse import urljoin, urlparse, parse_qs
from playwright.sync_api import sync_playwright, expect

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--url', default='http://127.0.0.1:3161')
parser.add_argument('--output', default='.sync/tmp-home-scene-evidence')
parser.add_argument('--browser', default='C:/Program Files/Google/Chrome/Application/chrome.exe')
parser.add_argument('--mode', choices=['matrix', 'stills', 'interactions', 'performance', 'accelerated', 'realtime', 'navigation', 'snapshots', 'preview', 'preload', 'night-window', 'night-compare'], default='navigation')
args = parser.parse_args()
out = Path(args.output).resolve()
out.mkdir(parents=True, exist_ok=True)
results = []
errors = []

def check(name, detail=True):
    results.append({'check': name, 'detail': detail})
    (out / f'{args.mode}-report.json').write_text(json.dumps({'checks': results, 'pageErrors': errors}, ensure_ascii=False, indent=2), encoding='utf-8')
    print(name, detail, flush=True)

audio = io.BytesIO()
with wave.open(audio, 'wb') as wav:
    wav.setnchannels(1); wav.setsampwidth(2); wav.setframerate(8000)
    wav.writeframes(b''.join(struct.pack('<h', int(500 * math.sin(i * math.tau * 220 / 8000))) for i in range(8000 * 90)))

def fixture(context):
    songs = [{'id': i, 'name': f'场景测试曲 {i}', 'artist': '本地音频夹具', 'url': args.url + '/__scene-test.wav',
              'cover': '/avatar.jpg', 'lrc': '[00:00.00]此刻，风从花间经过\n[00:05.00]把一首歌留在这里\n[00:30.00]轨迹仍在继续'} for i in [1,2]]
    context.route('**/api/music?*', lambda r: r.fulfill(json=songs))
    context.route('**/__scene-test.wav', lambda r: r.fulfill(body=audio.getvalue(), content_type='audio/wav'))

def context_for(browser, width=1440, height=900, dark=False, reduced=False, video=False, dpr=1, **kwargs):
    context = browser.new_context(viewport={'width': width, 'height': height}, device_scale_factor=dpr,
        reduced_motion='reduce' if reduced else 'no-preference', timezone_id='Asia/Shanghai',
        **({'record_video_dir': str(out / 'video'), 'record_video_size': {'width': width, 'height': height}} if video else {}), **kwargs)
    context.add_init_script(f"localStorage.setItem('blog-theme','{'dark' if dark else 'light'}');localStorage.setItem('blog-theme-override-until',String(Date.now()+86400000))")
    fixture(context)
    return context

def visit(context):
    page = context.new_page()
    page.on('pageerror', lambda e: errors.append(str(e)))
    response = page.goto(args.url, wait_until='domcontentloaded', timeout=120000)
    assert response and response.ok
    page.wait_for_function("document.documentElement.classList.contains('splash-seen')")
    page.wait_for_selector('[data-home-scene]')
    page.wait_for_selector('[data-home-artwork=ready]', timeout=60000)
    return page

def state(page):
    return page.locator('[data-home-scene]').evaluate('e=>({...e.dataset})')

def capture(page, name):
    page.screenshot(path=str(out / (name + '.png')))

def move_out(page):
    page.mouse.move(720, 680)
    page.wait_for_timeout(650)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=args.browser, args=['--mute-audio'])
    if args.mode == 'night-compare':
        repo = Path(__file__).resolve().parents[1]
        # Run this script with Node 22 first on PATH so the test-only bundle
        # uses the same installed toolchain. It never enters public/ or app/.
        bundle = out / 'three-spike.js'
        subprocess.run(['node', str(repo / 'node_modules/esbuild/bin/esbuild'),
            str(repo / 'scripts/home-window-three-spike.mjs'), '--bundle', '--format=iife',
            '--outfile=' + str(bundle)], check=True, cwd=repo)
        context = context_for(browser)
        page = visit(context)
        page.wait_for_function("Number(document.querySelector('[data-home-scene]').dataset.homeFrames) > 10")
        b = page.locator('[data-home-viewport]').bounding_box()
        page.evaluate("window.__realRead=window.__homeVisitClock.read;const t=window.__realRead(performance.now());window.__homeVisitClock.read=()=>t")
        for renderer in ['css', 'three']:
            if renderer == 'three':
                page.add_script_tag(path=str(bundle))
                check('three: fixed projector initialized', page.evaluate('window.startNightWindowComparison()'))
            for name, x in [('center', .5), ('left', .2), ('right', .8)]:
                page.mouse.move(b['x'] + b['width'] * x, b['y'] + b['height'] * .5)
                page.wait_for_timeout(1400)
                capture(page, renderer + '-' + name)
        page.evaluate("window.__nightWindowComparison.destroy();window.__homeVisitClock.read=window.__realRead")
        for renderer in ['css', 'three']:
            if renderer == 'three':
                page.evaluate('window.startNightWindowComparison()')
            page.mouse.move(b['x'] + b['width'] / 2, b['y'] + b['height'] / 2)
            page.wait_for_timeout(2000)
            before = state(page)
            started = time.monotonic()
            if renderer == 'three':
                page.evaluate('Object.assign(window.__nightWindowComparison.stats,{frames:0,totalMs:0,maxMs:0})')
            for i in range(12):
                page.mouse.move(b['x'] + b['width'] * (.3 if i % 2 else .7), b['y'] + b['height'] * .5)
                page.wait_for_timeout(500)
            elapsed = time.monotonic() - started
            after = state(page)
            frames = int(after['homeFrames']) - int(before['homeFrames'])
            cost = (float(after['homeDrawTotalMs']) - float(before['homeDrawTotalMs'])) / max(1, frames)
            detail = {'actualSeconds': elapsed, 'drawFps': frames / elapsed,
                'fieldCpuMsPerFrame': cost, 'quality': after['homeQuality'],
                'canvasBufferBytes': int(after['homeBufferBytes'])}
            if renderer == 'three':
                detail['webgl'] = page.evaluate('({...window.__nightWindowComparison.stats})')
                detail['combinedCpuMsPerFrame'] = cost + detail['webgl']['totalMs'] / max(1, detail['webgl']['frames'])
                page.evaluate('window.__nightWindowComparison.destroy()')
            check(renderer + ': real-time pointer measurement (CPU dispatch, not GPU timing)', detail)
        assert page.locator('[data-home-three-spike]').count() == 0
        assert not errors, errors
        context.close()
    elif args.mode == 'night-window':
        for width, height in [(1440,900), (1920,1080), (1366,768), (1280,720)]:
            context = context_for(browser, width, height)
            context.add_init_script("""window.__homeLongTasks=[];window.__homeBuffers=[];
                new PerformanceObserver(list=>window.__homeLongTasks.push(...list.getEntries().map(e=>({start:e.startTime,duration:e.duration})))).observe({type:'longtask',buffered:true});
                const getContext=HTMLCanvasElement.prototype.getContext;
                HTMLCanvasElement.prototype.getContext=function(kind,...options){if(kind==='2d'&&!window.__homeBuffers.includes(this))window.__homeBuffers.push(this);return getContext.call(this,kind,...options)};""")
            page = visit(context)
            page.wait_for_function("Number(document.querySelector('[data-home-scene]').dataset.homeFrames) > 5")
            opening = page.locator('[data-home-viewport]')
            b = opening.bounding_box()
            assert .74 < b['width'] / width < .85
            canvas = page.locator('[data-home-canvas]').bounding_box()
            assert abs(canvas['width'] - b['width']) < 1 and abs(canvas['height'] - b['height']) < 1
            fixed = page.locator('[data-home-window]').bounding_box()
            capture(page, f'{width}x{height}-first')
            for name, x in [('left', .1), ('right', .9)]:
                page.mouse.move(b['x'] + b['width'] * x, b['y'] + b['height'] * .45)
                page.wait_for_timeout(1300)
                look = opening.evaluate("e=>Number(e.style.getPropertyValue('--look-x'))")
                assert look < -.5 if x < .5 else look > .5, look
                assert page.locator('[data-home-window]').bounding_box() == fixed
                capture(page, f'{width}x{height}-{name}')
            page.mouse.move(width / 2, 10)
            page.wait_for_timeout(2400)
            assert abs(opening.evaluate("e=>Number(e.style.getPropertyValue('--look-x'))")) < .02
            before = state(page)
            started = time.monotonic()
            page.wait_for_timeout(4000)
            after = state(page)
            duration = time.monotonic() - started
            frames = int(after['homeFrames']) - int(before['homeFrames'])
            sample_budget = .3 / (12 if after['homeQuality'] == 'high' else 6) + .001
            assert 0 <= float(after['homeFieldTime']) - float(after['homeGridTime']) < sample_budget
            check(f'{width}x{height}: scene, pointer and shared clock', {
                'drawFps': frames / duration, 'state': after,
                'longTasks': page.evaluate('window.__homeLongTasks'),
                'heapBytes': page.evaluate('performance.memory?.usedJSHeapSize ?? null')})
            if width == 1440:
                # Headless Chromium visibility is not a real-device claim.
                before_time = page.evaluate('window.__homeVisitClock.read(performance.now())')
                before_frames = state(page)['homeFrames']
                page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))")
                page.wait_for_timeout(1500)
                assert state(page)['homeFrames'] == before_frames
                after_time = page.evaluate('window.__homeVisitClock.read(performance.now())')
                assert abs(after_time - before_time) < 150
                page.evaluate("delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))")
                page.wait_for_timeout(500)
                assert int(state(page)['homeFrames']) > int(before_frames)
                check('synthetic visibility: clock/RAF pause and resume', {'hiddenMs':1500, 'clockDeltaMs':after_time-before_time})
                page.emulate_media(reduced_motion='reduce')
                page.wait_for_timeout(300)
                still_frames = state(page)['homeFrames']
                page.mouse.move(b['x'] + 10, b['y'] + 10)
                page.wait_for_timeout(500)
                assert state(page)['homeFrames'] == still_frames
                assert state(page)['homeQuality'] == 'static' and state(page)['homeBufferBytes'] == '0'
                capture(page, 'reduced-motion')
                page.emulate_media(reduced_motion='no-preference')
                page.wait_for_timeout(500)
                assert int(state(page)['homeFrames']) > int(still_frames)
                buffers = page.evaluate('window.__homeBuffers.length')
                assert buffers == 3, buffers
                page.evaluate('window.__oldBuffers=window.__homeBuffers.slice()')
                page.locator('[data-edge-trigger=about]').focus()
                page.locator('#home-about-panel a').click()
                page.wait_for_url('**/about')
                assert page.locator('[data-home-canvas]').count() == 0
                assert page.evaluate('window.__oldBuffers.every(c=>c.width===0&&c.height===0)')
                page.goto(args.url, wait_until='domcontentloaded')
                page.wait_for_selector('[data-home-canvas]')
                page.wait_for_function("Number(document.querySelector('[data-home-scene]').dataset.homeFrames)>5")
                assert page.locator('audio').count() == 1
                check('unmount/remount: all three buffers released, one audio retained')
            context.close()
        for width, height in [(1440,900), (1920,1080)]:
            context = context_for(browser, width, height, reduced=True)
            page = visit(context)
            assert state(page)['homeQuality'] == 'static'
            capture(page, f'{width}x{height}-static-composition')
            context.close()
        context = context_for(browser, 1280, 720, dpr=2)
        page = visit(context)
        page.wait_for_function("Number(document.querySelector('[data-home-scene]').dataset.homeFrames)>5")
        page.evaluate('window.__sameSurface=document.querySelector("[data-home-canvas]")')
        before_time = float(state(page)['homeElapsed'])
        page.set_viewport_size({'width':1440,'height':900})
        page.wait_for_timeout(500)
        assert float(state(page)['homeElapsed']) >= before_time
        assert page.evaluate('window.__sameSurface===document.querySelector("[data-home-canvas]")')
        assert page.evaluate('document.querySelector("[data-home-canvas]").width <= Math.ceil(document.querySelector("[data-home-viewport]").clientWidth*1.5)')
        check('DPR2 and resize: capped resolution, same surface, continuous visit clock', state(page))
        context.close()
        context = browser.new_context(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True,
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1')
        page = context.new_page()
        page.goto(args.url, wait_until='domcontentloaded')
        page.wait_for_url('**/blog/**')
        assert page.locator('[data-home-scene]').count() == 0
        check('mobile UA: existing blog redirect, no desktop scene')
        context.close()
        for failure in ['no-webgl', 'no-canvas', 'image-error', 'music-error']:
            context = context_for(browser)
            if failure in ['no-webgl', 'no-canvas']:
                blocked = "kind==='2d'" if failure == 'no-canvas' else "kind==='webgl'||kind==='webgl2'||kind==='experimental-webgl'"
                context.add_init_script("const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...rest){return (" + blocked + ")?null:original.call(this,kind,...rest)}")
            if failure == 'image-error':
                context.route('**/*convict-lake-night*', lambda r:r.abort())
            if failure == 'music-error':
                context.route('**/api/music?*', lambda r:r.fulfill(status=503,json={'error':'test failure'}))
            page = context.new_page()
            page.on('pageerror', lambda e:errors.append(str(e)))
            page.goto(args.url, wait_until='domcontentloaded')
            page.wait_for_function("document.documentElement.classList.contains('splash-seen')")
            page.wait_for_selector('[data-home-scene]')
            page.wait_for_function("['ready','error'].includes(document.querySelector('[data-home-artwork]').dataset.homeArtwork)")
            assert page.locator('[data-edge-trigger]').count() == 8
            assert page.locator('audio').count() == 1
            page.locator('[data-edge-trigger=projects]').hover()
            expect(page.locator('[data-edge-trigger=projects]')).to_have_attribute('aria-expanded','true')
            if failure in ['no-canvas','image-error']:
                page.wait_for_function("document.querySelector('[data-home-scene]').dataset.homeQuality==='static'")
            if failure == 'music-error':
                assert page.get_by_role('region',name='音乐控制').get_by_role('button').count() > 0
            capture(page, failure)
            check(failure + ': artwork/nav/music remain available', state(page))
            context.close()
        # Actual CPU pressure exercises the automatic quality governor; no
        # production query switches or forced quality properties are used.
        context = context_for(browser)
        page = visit(context)
        page.wait_for_function("Number(document.querySelector('[data-home-scene]').dataset.homeFrames)>5")
        cdp = context.new_cdp_session(page)
        cdp.send('Emulation.setCPUThrottlingRate', {'rate':16})
        page.wait_for_function("document.querySelector('[data-home-scene]').dataset.homeQuality==='static'",timeout=30000)
        cdp.send('Emulation.setCPUThrottlingRate', {'rate':1})
        assert state(page)['homeBufferBytes'] == '0'
        capture(page, 'cpu-static-fallback')
        play = page.get_by_role('button',name='播放',exact=True)
        play.click(); expect(page.get_by_role('button',name='暂停',exact=True)).to_be_visible()
        check('CPU x16: graceful static fallback and working audio controls', state(page))
        context.close()
        assert not errors, errors
    elif args.mode == 'snapshots':
        from PIL import Image
        snapshots = Path(__file__).resolve().parents[1] / 'public/page-previews'
        snapshots.mkdir(parents=True, exist_ok=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 960}, reduced_motion='reduce')
        page = context.new_page()
        for route in ['projects', 'anime', 'chatter', 'blog', 'friends', 'about']:
            response = page.goto(args.url + '/' + route, wait_until='domcontentloaded', timeout=120000)
            assert response and response.ok
            page.wait_for_function("document.documentElement.classList.contains('splash-seen')")
            try:
                page.wait_for_load_state('networkidle', timeout=15000)
            except Exception:
                pass  # A slow external image must not prevent the local page capture.
            if route == 'anime' and page.get_by_role('heading', name='番剧数据暂时不可用').count():
                # Read real public data, never an old production screenshot or a test fixture.
                latest = context.request.get('https://nothing-new.cn/anime/latest.json')
                assert latest.ok, 'Public anime pointer unavailable; do not publish a fixture preview'
                pointer = latest.json()
                snapshot_response = context.request.get(urljoin('https://nothing-new.cn', pointer['snapshot']))
                assert snapshot_response.ok, 'Public anime snapshot unavailable'
                snapshot = snapshot_response.json()
                assert snapshot.get('version') == 1 and snapshot.get('items'), 'Invalid public anime snapshot'
                context.route('**/anime/latest.json', lambda r: r.fulfill(json={
                    **pointer, 'snapshot': '/__preview-real-anime.json'}))
                context.route('**/__preview-real-anime.json', lambda r: r.fulfill(json=snapshot))

                def public_anime_cover(r):
                    parsed = urlparse(r.request.url)
                    source = parse_qs(parsed.query).get('url', [''])[0]
                    if not source.startswith('/anime/blob/covers/'):
                        r.continue_()
                        return
                    cover = context.request.get('https://nothing-new.cn' + parsed.path + '?' + parsed.query)
                    r.fulfill(response=cover)

                context.route('**/_next/image?*', public_anime_cover)
                page.reload(wait_until='domcontentloaded', timeout=120000)
                page.get_by_role('heading', name='番剧', exact=True).wait_for(timeout=30000)
                check('anime: public real data with local renderer', {'source': pointer['snapshot'], 'count': len(snapshot['items'])})
            try:
                page.wait_for_function("""() => [...document.images].filter(img => {
                    const b = img.getBoundingClientRect();
                    return b.width && b.height && b.top < innerHeight && b.bottom > 0;
                }).every(img => img.complete && img.naturalWidth > 0)""", timeout=20000)
            except Exception:
                pass  # Keep a real page capture if an external cover cannot load.
            page.wait_for_timeout(1500)
            page.add_style_tag(content='nextjs-portal { display: none !important; }')
            Image.open(io.BytesIO(page.screenshot())).resize((888, 666)).save(snapshots / f'{route}.webp', quality=82)
            check(f'{route}: real page snapshot', {'url': page.url, 'headings': page.locator('h1').all_text_contents()})
        context.close()
    elif args.mode == 'preview':
        context = browser.new_context(viewport={'width': 1440, 'height': 900})
        page = visit(context)
        page.wait_for_timeout(3000)
        capture(page, 'home-preview')
        for entry in ['projects', 'papers', 'contact']:
            trigger = page.locator(f'[data-edge-trigger={entry}]')
            trigger.hover()
            page.wait_for_timeout(700)
            expect(trigger).to_have_attribute('aria-expanded', 'true')
            capture(page, 'home-preview-' + entry)
        check('real homepage preview', {'music': page.get_by_role('region', name='音乐控制').inner_text(), 'pageErrors': errors})
        assert not errors, errors
        context.close()
    elif args.mode == 'preload':
        for name, reduced, dpr, constrained in [('normal', False, 1, False), ('reduced-dpr2', True, 2, False), ('save-data', False, 1, True)]:
            context = context_for(browser, reduced=reduced, dpr=dpr)
            if constrained:
                context.add_init_script("Object.defineProperty(navigator, 'connection', {value: Object.assign(new EventTarget(), {saveData: true, effectiveType: '2g'})})")
            context.add_init_script("""window.addEventListener('site-startup-phase', () => {
                if (document.documentElement.dataset.startupPhase === 'ready')
                    window.__previewsAtReveal = [...document.querySelectorAll('[data-home-preview] img')]
                        .map(img => ({src: img.currentSrc, complete: img.complete && img.naturalWidth > 0}));
            })""")
            pending, requests = [], []

            def hold_preview(route):
                source = parse_qs(urlparse(route.request.url).query).get('url', [''])[0]
                preview = source.startswith('/_next/static/media/') and any(
                    Path(source).name.startswith(entry + '.') for entry in ['projects', 'anime', 'chatter', 'blog', 'friends', 'about'])
                if preview or source == '/profile-studio.png':
                    requests.append(route.request.url)
                    pending.append(route)
                else:
                    route.continue_()

            context.route('**/_next/image?*', hold_preview)
            page = context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            response = page.goto(args.url, wait_until='domcontentloaded', timeout=120000)
            assert response and response.ok
            page.wait_for_function("document.querySelectorAll('[data-home-preview] img[loading=eager]').length === 7")
            deadline = time.monotonic() + 5
            while len(pending) < 7 and time.monotonic() < deadline:
                page.wait_for_timeout(25)
            assert len(pending) == 7, (name, requests)
            assert page.locator('[data-edge-trigger][aria-expanded=true]').count() == 0
            assert not page.evaluate("document.documentElement.classList.contains('splash-seen')"), name
            # Simulate a delayed response while every sidebar remains closed.
            page.wait_for_timeout(250)
            for route in pending:
                route.continue_()
            page.wait_for_function("document.documentElement.classList.contains('splash-seen')")
            ready = page.evaluate('window.__previewsAtReveal')
            assert ready and len(ready) == 7 and all(image['complete'] for image in ready), (name, ready)
            assert len(set(requests)) == 7
            for entry in ['projects', 'anime', 'chatter', 'blog', 'papers', 'friends', 'about']:
                trigger = page.locator(f'[data-edge-trigger={entry}]')
                trigger.hover()
                expect(trigger).to_have_attribute('aria-expanded', 'true')
                image = page.locator(f'#home-{entry}-panel img')
                expect(image).to_be_visible()
                assert image.evaluate('img => img.complete && img.naturalWidth > 0')
                page.mouse.move(720, 750)
                expect(trigger).to_have_attribute('aria-expanded', 'false')
            assert len(requests) == 7, (name, requests)
            check(name + ': seven images requested before reveal, first open ready, no hover fetch', ready)
            context.close()
        assert not errors, errors
    elif args.mode == 'navigation':
        for width, height in [(1440, 900), (1920, 1080), (1366, 768), (1280, 720), (1280, 800), (1024, 768), (640, 720), (1024, 480)]:
            context = context_for(browser, width, height, reduced=width != 1440)
            page = visit(context)
            left = page.locator('[data-home-rail=left] [data-edge-trigger]')
            right = page.locator('[data-home-rail=right] [data-edge-trigger]')
            assert left.all_text_contents() == ['项目', '番剧', '杂谈', '笔记']
            assert right.all_text_contents() == ['论文', '友链', '关于', '联系']
            assert page.locator('[data-edge-trigger=music]').count() == 0
            assert page.locator('[data-home-preview]:not(#home-papers-panel):not(#home-contact-panel) img[loading=eager]').count() == 6
            assert page.locator('[data-home-preview] img').evaluate_all('images => images.every(img => img.complete && img.naturalWidth > 0)')
            assert page.locator('audio').count() == 1
            assert page.locator('[data-home-canvas]').count() == 1
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            for rail in [left, right]:
                bounds = [trigger.bounding_box() for trigger in rail.all()]
                assert all(b and b['y'] >= 0 and b['y'] + b['height'] <= height and b['width'] >= 44 and b['height'] >= 44 for b in bounds)
                assert all(a['y'] + a['height'] < b['y'] for a, b in zip(bounds, bounds[1:]))
            # Moving directly between entries must retain the original hover behavior.
            for entry in ['projects', 'papers', 'about']:
                trigger = page.locator(f'[data-edge-trigger={entry}]')
                trigger.hover()
                expect(trigger).to_have_attribute('aria-expanded', 'true')
                page.wait_for_timeout(200)
                expect(trigger).to_have_attribute('aria-expanded', 'true')
                assert page.locator('[data-edge-trigger][aria-expanded=true]').count() == 1
                for other in page.locator('[data-edge-trigger][aria-expanded=false]').all():
                    other_box = other.bounding_box()
                    assert other_box['x'] >= -1 and other_box['x'] + other_box['width'] <= width + 1
            page.mouse.move(width / 2, 20)
            expect(trigger).to_have_attribute('aria-expanded', 'false')
            for entry in ['projects', 'anime', 'chatter', 'blog', 'papers', 'friends', 'about', 'contact']:
                trigger = page.locator(f'[data-edge-trigger={entry}]')
                closed_tab = trigger.bounding_box()
                trigger.hover()
                if width == 1440:
                    page.wait_for_timeout(150)
                    expect(trigger).to_have_attribute('aria-expanded', 'false')
                expect(trigger).to_have_attribute('aria-expanded', 'true')
                assert page.locator('[data-edge-trigger][aria-expanded=true]').count() == 1
                panel = page.locator(f'#home-{entry}-panel')
                if entry not in ['papers', 'contact']:
                    image = panel.locator('img')
                    expect(image).to_be_visible()
                    image.evaluate('img => img.decode()')
                    href = panel.locator('a').get_attribute('href')
                    assert href.startswith('/blog') if entry == 'blog' else href == '/' + entry
                panel.hover()
                page.wait_for_timeout(200)
                expect(trigger).to_have_attribute('aria-expanded', 'true')
                b = panel.bounding_box()
                assert b and b['x'] >= -1 and b['x'] + b['width'] <= width + 1 and b['y'] >= -1 and b['y'] + b['height'] <= height + 1, (entry, b)
                tab = trigger.bounding_box()
                expected_width = min(264, max(184, width * 0.183))
                assert abs(b['width'] - expected_width) < 1
                assert abs(b['y'] - tab['y']) < 1
                if entry in ['projects', 'anime', 'chatter', 'blog']:
                    assert abs(b['x']) < 1
                    assert abs(tab['x'] - b['width']) < 1
                else:
                    assert abs(b['x'] + b['width'] - width) < 1
                    assert abs(tab['x'] + tab['width'] - b['x']) < 1
                closed_inset = (min(150, max(72, width * .09)) - 56) / 2
                assert abs(abs(tab['x'] - closed_tab['x']) - (b['width'] - closed_inset)) < 1
                if width == 1440:
                    capture(page, 'sidebar-' + entry)
                # The unused strip beneath the moved tab must stay click-through.
                if b['height'] > tab['height'] + 8:
                    empty = {'x': tab['x'] + tab['width'] / 2, 'y': tab['y'] + tab['height'] + 4}
                    assert page.evaluate("p => !document.elementFromPoint(p.x,p.y).closest('[data-home-edge]')", empty)
                    page.mouse.move(empty['x'], empty['y'])
                    expect(trigger).to_have_attribute('aria-expanded', 'false')
                    trigger.hover()
                    expect(trigger).to_have_attribute('aria-expanded', 'true')
                page.mouse.move(width / 2, height - 150)
                expect(trigger).to_have_attribute('aria-expanded', 'false')
                assert abs(trigger.bounding_box()['x'] - closed_tab['x']) < 1
                # Match the original paper flow: hover open, then click the moved tab to pin.
                trigger.hover()
                expect(trigger).to_have_attribute('aria-expanded', 'true')
                trigger.click()
                page.mouse.move(width / 2, height - 150)
                page.wait_for_timeout(200)
                expect(trigger).to_have_attribute('aria-expanded', 'true')
                page.mouse.click(width / 2, 20)
                expect(trigger).to_have_attribute('aria-expanded', 'false')
                page.keyboard.press('Tab')
                trigger.focus()
                page.keyboard.press('Tab')
                assert panel.evaluate('e => e.contains(document.activeElement)')
                page.keyboard.press('Escape')
                expect(trigger).to_be_focused()
                expect(trigger).to_have_attribute('aria-expanded', 'false')
            page.locator('[data-edge-trigger=contact]').focus()
            page.keyboard.press('Tab')
            for _ in range(5):
                page.keyboard.press('Tab')
            expect(page.locator('[data-edge-trigger=contact]')).to_have_attribute('aria-expanded', 'false')
            dock = page.locator('[data-home-music]')
            paper_trigger = page.locator('[data-edge-trigger=papers]')
            paper_trigger.hover()
            expect(paper_trigger).to_have_attribute('aria-expanded', 'true')
            paper_trigger.click()
            page.mouse.move(width / 2, 20)
            dock.locator('h2').click()
            expect(page.locator('[data-edge-trigger=papers]')).to_have_attribute('aria-expanded', 'false')
            play = dock.get_by_role('button', name='播放', exact=True)
            expect(play).to_be_visible()
            b = dock.bounding_box()
            assert b and b['y'] > height / 2 and b['y'] + b['height'] <= height
            play.click()
            page.wait_for_function("document.querySelector('audio').currentTime > 0")
            dock.get_by_role('button', name='下一首', exact=True).click()
            assert '场景测试曲 2' in dock.inner_text()
            dock.get_by_role('button', name='上一首', exact=True).click()
            seek = dock.get_by_role('slider', name='播放进度')
            expect(seek).to_be_enabled()
            seek.focus()
            page.keyboard.press('ArrowRight')
            expect(seek).not_to_have_value('0')
            expect(page.get_by_role('region', name='当前歌词')).to_be_visible()
            # Native two-level reading preserves focus and hover dismissal.
            trigger = page.locator('[data-edge-trigger=papers]')
            trigger.hover()
            page.locator('[data-paper-summary]').click()
            expect(page.locator('#tda-issue-dialog')).to_be_visible()
            page.locator('#tda-issue-dialog ol button').first.click()
            expect(page.locator('#tda-paper-dialog')).to_be_visible()
            page.keyboard.press('Escape')
            page.keyboard.press('Escape')
            page.mouse.move(width / 2, 20)
            expect(trigger).to_have_attribute('aria-expanded', 'false')
            trigger.focus()
            page.keyboard.press('Tab')
            page.keyboard.press('Enter')
            expect(page.locator('#tda-issue-dialog')).to_be_visible()
            page.keyboard.press('Escape')
            expect(page.locator('[data-paper-summary]')).to_be_focused()
            page.wait_for_timeout(200)
            expect(trigger).to_have_attribute('aria-expanded', 'true')
            page.keyboard.press('Tab')
            expect(trigger).to_have_attribute('aria-expanded', 'false')
            page.mouse.click(width / 2, 20)
            capture(page, f'home-sidebar-{width}x{height}')
            # Verify a preview uses soft navigation and keeps the root audio playing.
            page.locator('[data-edge-trigger=friends]').hover()
            before = page.locator('audio').evaluate('e => ({time:e.currentTime, src:e.currentSrc})')
            page.get_by_role('link', name='进入友链', exact=True).click()
            page.wait_for_url('**/friends')
            after = page.locator('audio').evaluate('e => ({time:e.currentTime, src:e.currentSrc})')
            assert before['src'] == after['src'] and after['time'] >= before['time']
            check(f'{width}x{height}: four per side, all previews, pointer/keyboard dismissal, bottom music, two-level reader, soft navigation')
            context.close()
        assert not errors, errors
    elif args.mode == 'matrix':
        for width,height in [(1440,900),(1280,800),(1024,768)]:
            context = context_for(browser,width,height)
            page = visit(context)
            assert page.get_by_role('navigation', name='首页主导航').get_by_role('link').count() == 6
            assert page.locator('[data-home-canvas]').count() == 1
            assert page.locator('img[src*="background"]').count() == 0
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            for side in ['music','papers']:
                trigger = page.locator(f'[data-edge-trigger={side}]')
                box = trigger.bounding_box()
                assert box and box['width'] == 56 and box['height'] == 132
            capture(page,f'{width}-day-default')
            for side in ['music','papers']:
                trigger = page.locator(f'[data-edge-trigger={side}]')
                trigger.hover(); page.wait_for_timeout(430)
                expect(trigger).to_have_attribute('aria-expanded','true')
                page.wait_for_timeout(350)  # let the panel transform settle before measuring
                panel = page.locator(f'#home-{side}-panel')
                box=panel.bounding_box(); assert box
                if side=='papers':
                    assert panel.locator('[data-paper-summary]').inner_text()==''
                    assert panel.locator('[data-paper-summary] img').count()==1
                page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2)
                page.wait_for_timeout(650)
                expect(trigger).to_have_attribute('aria-expanded','true')
                capture(page,f'{width}-day-{side}')
                move_out(page)
                expect(trigger).to_have_attribute('aria-expanded','false')
            page.locator('[data-edge-trigger=music]').focus()
            page.get_by_role('button',name='播放',exact=True).click()
            page.wait_for_timeout(1200)
            assert page.locator('audio').evaluate('e=>!e.paused && e.currentTime>0')
            expect(page.get_by_role('region',name='当前歌词')).to_be_visible()
            elapsed=float(state(page)['homeElapsed'])
            page.locator('[data-home-celestial]').click(); page.wait_for_timeout(1200)
            assert float(state(page)['homeElapsed']) >= elapsed
            capture(page,f'{width}-night-default')
            page.locator('[data-edge-trigger=papers]').focus()
            page.get_by_role('button',name='打开 TDA 论文周报',exact=True).click()
            expect(page.locator('#tda-issue-dialog')).to_be_visible()
            page.locator('#tda-issue-dialog ol button').first.click()
            expect(page.locator('#tda-paper-dialog')).to_be_visible()
            capture(page,f'{width}-night-reader')
            page.keyboard.press('Escape'); expect(page.locator('#tda-paper-dialog')).not_to_be_visible()
            page.keyboard.press('Escape'); expect(page.locator('#tda-issue-dialog')).not_to_be_visible()
            page.keyboard.press('Escape')
            expect(page.locator('[data-edge-trigger=papers]')).to_have_attribute('aria-expanded','false')
            for dismiss in ['button','escape','pinned']:
                trigger=page.locator('[data-edge-trigger=papers]')
                trigger.hover()
                expect(trigger).to_have_attribute('aria-expanded','true')
                if dismiss=='pinned': trigger.click()
                page.locator('[data-paper-summary]').click()
                expect(page.locator('#tda-issue-dialog')).to_be_visible()
                if dismiss!='escape':
                    page.get_by_role('button',name='关闭周报',exact=True).click()
                else:
                    page.keyboard.press('Escape')
                move_out(page)
                expect(trigger).to_have_attribute('aria-expanded','false')
            trigger.hover()
            expect(trigger).to_have_attribute('aria-expanded','true')
            tab=trigger.bounding_box()
            page.mouse.move(tab['x']+tab['width']/2,tab['y']+tab['height']+8)
            expect(trigger).to_have_attribute('aria-expanded','false')
            trigger.focus()
            page.keyboard.press('Tab')
            expect(page.locator('[data-paper-summary]')).to_be_focused()
            page.keyboard.press('Enter')
            expect(page.locator('#tda-issue-dialog')).to_be_visible()
            page.keyboard.press('Escape')
            expect(page.locator('[data-paper-summary]')).to_be_focused()
            page.wait_for_timeout(250)
            expect(trigger).to_have_attribute('aria-expanded','true')
            page.keyboard.press('Tab')
            expect(trigger).to_have_attribute('aria-expanded','false')
            before=page.locator('audio').evaluate('e=>({time:e.currentTime,src:e.currentSrc})')
            page.get_by_role('navigation',name='首页主导航').get_by_role('link',name='友链',exact=True).click()
            page.wait_for_url('**/friends'); page.wait_for_timeout(500)
            assert page.locator('[data-home-canvas]').count() == 0
            after=page.locator('audio').evaluate('e=>({time:e.currentTime,src:e.currentSrc})')
            assert after['src'] == before['src'] and after['time'] >= before['time']
            capture(page,f'{width}-inner-friends')
            page.locator('header[data-site-ui] a[href="/"]').click()
            page.wait_for_selector('[data-home-scene]')
            assert float(state(page)['homeElapsed']) < 5
            check(f'{width}: hover/focus/Escape, reader, theme continuity, music across routes, re-entry',state(page))
            context.close()

        # A narrow window with desktop pointers is still a desktop.
        context=context_for(browser,640,720,reduced=True)
        page=visit(context); assert page.url.rstrip('/') == args.url.rstrip('/')
        assert state(page)['homeQuality'] == 'static'
        page.locator('[data-home-celestial]').count()  # narrow desktops retain display settings
        capture(page,'desktop-narrow-reduced')
        check('narrow desktop is not redirected; reduced motion is static')
        context.close()

        for name,ua in [
          ('iphone','Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1'),
          ('android','Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36'),
          ('ipad','Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'),
          ('tablet','Mozilla/5.0 (Linux; Android 14; Pixel Tablet) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36'),
          ('ipad-desktop','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15'),
        ]:
            context=context_for(browser,390,844,user_agent=ua,is_mobile=True,has_touch=True)
            page=context.new_page(); requests=[]
            page.on('request',lambda r:requests.append(r.url))
            page.goto(args.url,wait_until='networkidle',timeout=120000)
            page.wait_for_url('**/blog/**',timeout=60000)
            assert page.locator('[data-home-scene]').count()==0
            forbidden=[u for u in requests if 'background.png' in u or u.endswith('.glb') or '/__scene-test.wav' in u]
            assert not forbidden,forbidden
            expect(page.locator('.katex').first).to_be_visible()
            page.get_by_role('button',name='打开导航',exact=True).click()
            expect(page.get_by_role('dialog',name='移动导航')).to_be_visible()
            mobile_nav=page.get_by_role('dialog',name='移动导航')
            assert mobile_nav.get_by_role('link').count()==6
            assert mobile_nav.get_by_role('link',name='笔记',exact=True).get_attribute('href').startswith('/blog/')
            assert mobile_nav.locator('a[href="/"]').count()==0
            page.keyboard.press('Escape')
            capture(page,'mobile-'+name)
            response=context.request.get(args.url,headers={'User-Agent':ua},max_redirects=0)
            if name!='ipad-desktop':
                assert response.status==307
                assert 'no-store' in response.headers.get('cache-control','')
            check(name+': root to actual note, no stage image/audio/3D',{'url':page.url,'status':response.status})
            context.close()
        context=context_for(browser)
        page=context.new_page()
        page.on('pageerror',lambda e:errors.append(str(e)))
        for route in ['/projects','/anime','/chatter','/blog','/friends','/about']:
            response=page.goto(args.url+route,wait_until='networkidle',timeout=120000)
            assert response and response.ok
            page.wait_for_function("document.documentElement.classList.contains('splash-seen')")
            assert page.locator('[data-home-canvas]').count()==0
            capture(page,'inner-'+route.strip('/'))
        assert context.request.get(args.url+'/music').status==404
        context.close()
        check('six current inner pages and removed /music route')
        assert not errors,errors
        check('uncaught browser errors',errors)

    elif args.mode=='interactions':
        context=context_for(browser,video=True)
        page=visit(context)
        for side in ['music','papers']:
            page.locator(f'[data-edge-trigger={side}]').hover()
            page.wait_for_timeout(800)
            box=page.locator(f'#home-{side}-panel').bounding_box()
            page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2)
            page.wait_for_timeout(1000)
            move_out(page)
            page.locator(f'[data-edge-trigger={side}]').focus()
            page.wait_for_timeout(500)
            page.keyboard.press('Escape')
        page.locator('[data-home-celestial]').click()
        page.wait_for_timeout(1500)
        context.close()
        check('pointer and keyboard edge transitions recorded')

    elif args.mode=='performance':
        context=context_for(browser,dpr=2)
        page=visit(context)
        page.wait_for_timeout(3000)
        assert state(page)['homeQuality'] in ['high', 'adaptive-low']
        check('unified high-performance baseline',state(page))
        elapsed=float(state(page)['homeElapsed'])
        page.evaluate("localStorage.setItem('blog-performance-mode','normal');window.dispatchEvent(new Event('field-mode-change'))")
        page.wait_for_timeout(5000)
        assert float(state(page)['homeElapsed'])>elapsed
        assert state(page)['homeQuality'] in ['high', 'adaptive-low']
        check('legacy normal setting cannot lower the baseline or restart the clock',state(page))
        # Deterministically force sustained main-thread contention, exercising
        # the real RAF quality fallback without changing the visit clock.
        before=float(state(page)['homeElapsed'])
        page.evaluate("window.__testLoad=setInterval(()=>{const until=performance.now()+95;while(performance.now()<until){}},120)")
        page.wait_for_timeout(20000)
        page.evaluate('clearInterval(window.__testLoad);delete window.__testLoad')
        after=float(state(page)['homeElapsed'])
        assert after-before>18
        assert state(page)['homeQuality']=='adaptive-low'
        page.locator('[data-edge-trigger=music]').focus()
        page.get_by_role('button',name='播放',exact=True).click()
        page.wait_for_timeout(800)
        assert page.locator('audio').evaluate('e=>!e.paused')
        check('20s contention: adaptive quality and real elapsed time; controls usable',state(page))
        check('browser heap (not GPU memory)',page.evaluate('performance.memory?{used:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize}:null'))
        context.close()

    elif args.mode=='stills':
        for dark in [False,True]:
            context=context_for(browser,dark=dark)
            page=visit(context)
            page.wait_for_timeout(1500)
            for target in [0,30,90,150,210,240,255,275,290,300,310]:
                page.evaluate('(t)=>{window.__homeVisitClock.read=()=>t*1000}',target)
                page.wait_for_timeout(250)
                capture(page,f'{"night" if dark else "day"}-{target:03d}s')
            check(f'{"night" if dark else "day"}: high-performance fixed-clock samples',state(page))
            context.close()
        context=context_for(browser,dark=True,reduced=True)
        page=visit(context)
        page.evaluate('window.__homeVisitClock.read=()=>255000')
        page.wait_for_timeout(1200)
        assert page.locator('[data-home-scene]').evaluate("e=>Number(e.style.getPropertyValue('--home-break'))")==0
        capture(page,'reduced-motion-255s')
        check('reduced motion: no fracture at 255s',state(page))
        context.close()

    else:
        context=context_for(browser,video=True)
        page=visit(context)
        if args.mode=='accelerated': page.clock.install()
        targets=[30,90,150,200,210,240,255,275,290,300,310,510,540,555,575,590,600,610]
        capture(page,args.mode+'-initial')
        for target in targets:
            if args.mode=='accelerated':
                while float(state(page)['homeElapsed']) < target:
                    # Stage samples exercise the real visibility clock and RAF;
                    # skip intermediate frames rather than encoding ten minutes.
                    page.clock.fast_forward(1000)
                    page.wait_for_timeout(80)
            else:
                page.wait_for_function('(t)=>Number(document.querySelector("[data-home-scene]").dataset.homeElapsed)>=t',arg=target,timeout=320000)
            if target==200:
                before=float(state(page)['homeElapsed']); page.locator('[data-home-celestial]').click()
                assert float(state(page)['homeElapsed'])>=before
            if target == 240:
                page.locator('[data-edge-trigger=music]').focus()
                page.get_by_role('button',name='播放',exact=True).click()
                page.keyboard.press('Escape')
            capture(page,f'{args.mode}-{target:03d}s')
            check(f'{args.mode} {target}s',state(page))
        if args.mode=='realtime':
            # Headless Chrome exposes all tabs as visible. Explicitly exercise the
            # Page Visibility handler for 60 real seconds; this is a synthetic state,
            # not evidence from a physical background tab or minimised OS window.
            before=float(state(page)['homeElapsed'])
            page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))")
            page.wait_for_timeout(60000)
            assert float(state(page)['homeElapsed'])==before
            page.evaluate("delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))")
            page.wait_for_timeout(1100)
            after=float(state(page)['homeElapsed'])
            assert 0 < after-before < 2
            check('synthetic hidden state: 60s wall time excluded; resumed',{'before':before,'after':after})
        assert not errors,errors
        context.close()
    browser.close()
