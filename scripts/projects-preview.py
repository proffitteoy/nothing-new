"""Exercise the real /projects room and capture #52 acceptance evidence locally."""
import argparse
import io
import json
import math
import re
import struct
import sys
import wave
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--url', default='http://127.0.0.1:3152')
parser.add_argument('--output', type=Path, default=Path('.sync/tmp-projects-52-evidence'))
parser.add_argument('--case', help='Run a single WIDTHxHEIGHT case')
parser.add_argument('--browser', help='Existing Chromium executable; otherwise Playwright Chromium')
parser.add_argument('--connection-only', action='store_true', help='Check the persistent world, reversible camera, and home/project interactions')
parser.add_argument('--navigation-only', action='store_true', help='Check home text/preview links, keyboard access, and pending page navigation')
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
ids = ['rumor', 'topp', 'iris', 'competitions', 'gudhi', 'animeko']
names = ['early-rumor-propagation-tda', 'topp', 'Iris-Terminal',
         'ai-data-competitions-ui', 'GUDHI/gudhi-devel', 'open-ani/animeko']
errors = []
results = []
music_draw_samples = []
music_requests = 0
audio = io.BytesIO()
with wave.open(audio, 'wb') as wav:
    wav.setnchannels(1)
    wav.setsampwidth(2)
    wav.setframerate(8000)
    wav.writeframes(b''.join(struct.pack('<h', int(800 * math.sin(i * math.tau * 220 / 8000)))
                             for i in range(8000 * 30)))


def music_route(route):
    global music_requests
    music_requests += 1
    route.fulfill(json=[{'id': 'projects-check', 'name': '本地验收音轨', 'artist': 'Test fixture',
                         'url': args.url + '/projects-check.wav', 'lrc': '[00:00.00]本地验收'}])


def audio_route(route):
    data = audio.getvalue()
    range_header = route.request.headers.get('range')
    headers = {'Accept-Ranges': 'bytes'}
    status = 200
    if range_header:
        start, end = range_header.removeprefix('bytes=').split('-')
        start, end = int(start), int(end) if end else len(data) - 1
        end = min(end, len(data) - 1)
        headers['Content-Range'] = f'bytes {start}-{end}/{len(data)}'
        data = data[start:end + 1]
        status = 206
    route.fulfill(status=status, content_type='audio/wav', headers=headers, body=data)


def ready(page):
    expect(page.locator('[data-room-status]')).to_have_attribute('data-room-status', 'ready', timeout=45000)
    expect(page.locator('[data-room-hotspot="rumor"]')).to_be_visible()


def shot(page, name):
    page.wait_for_timeout(1100)  # Include the completed reveal.
    page.screenshot(path=str(args.output / f'{name}.png'), full_page=True)


def unobscured(locator):
    locator.scroll_into_view_if_needed()
    assert locator.evaluate('''el => {
      const r=el.getBoundingClientRect();
      const top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
      return top && (el===top || el.contains(top));
    }'''), f'Obscured control: {locator}'


def project_checks(page):
    for target, name in zip(ids, names):
        button = page.locator(f'[data-room-hotspot="{target}"]')
        unobscured(button)
        button.click()
        dialog = page.get_by_role('dialog')
        expect(dialog.get_by_role('heading', name=name, exact=True)).to_be_visible()
        expect(page.locator('[data-labels]')).to_have_attribute('inert', '')
        link = dialog.get_by_role('link', name='查看上游仓库' if target in ids[4:] else '打开项目仓库')
        link.scroll_into_view_if_needed()
        unobscured(link)
        assert link.get_attribute('href').startswith('https://github.com/')
        page.keyboard.press('Escape')
        expect(dialog).to_have_count(0)
        expect(button).to_be_focused()
    for name in names:
        page.locator('summary').filter(has_text='项目目录').click()
        rows = page.locator('details article')
        assert rows.count() == 6
        row = rows.nth(names.index(name)).get_by_role('button')
        row.click()
        expect(page.get_by_role('dialog').get_by_role('heading', name=name, exact=True)).to_be_visible()
        page.get_by_role('button', name='关闭详情').click()
        expect(page.locator('summary').filter(has_text='项目目录')).to_be_focused()
    # The text directory uses the same music panel as the 3D headphones, including keyboard access.
    page.locator('summary').filter(has_text='项目目录').click()
    music = page.locator('details').get_by_role('button', name='音乐', exact=True)
    music.focus()
    page.keyboard.press('Enter')
    dialog = page.get_by_role('dialog')
    expect(dialog.get_by_role('heading', name='桌边的音乐', exact=True)).to_be_visible()
    expect(dialog).to_be_focused()
    expect(page.locator('a[href="/music"]')).to_have_count(0)
    page.keyboard.press('Escape')
    expect(dialog).to_have_count(0)
    expect(page.locator('summary').filter(has_text='项目目录')).to_be_focused()



def navigation_checks(browser):
    for reduced in [False, True]:
        context = browser.new_context(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce' if reduced else 'no-preference')
        context.route('**/api/music?*', music_route)
        context.route('**/projects-check.wav', audio_route)
        context.route(re.compile(r'.*/(?:anime/latest\.json|api/anime)$'), lambda route: route.fulfill(status=503, json={}))
        page = context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(args.url + '/', wait_until='networkidle')
        page.wait_for_function("document.documentElement.classList.contains('splash-seen')", timeout=30000)
        page.wait_for_selector('[data-world-canvas][data-home-artwork=ready]', state='attached', timeout=60000)
        for method in ['text', 'preview', 'keyboard']:
            for entry in ['projects', 'anime', 'chatter', 'blog', 'friends', 'about']:
                trigger = page.locator(f'[data-edge-trigger="{entry}"]')
                assert trigger.evaluate('el => el.tagName') == 'A'
                destination = trigger.get_attribute('href')
                if method == 'preview':
                    trigger.hover()
                    expect(trigger).to_have_attribute('aria-expanded', 'true')
                    link = page.locator(f'#home-{entry}-panel a')
                    assert link.get_attribute('href') == destination
                    expect(link.locator('img')).to_be_visible()
                    link.click()
                elif method == 'keyboard':
                    trigger.focus()
                    page.keyboard.press('Enter')
                else:
                    trigger.locator('span').click()
                page.wait_for_url(args.url + destination)
                page.wait_for_timeout(350)
                assert page.url == args.url + destination, (method, entry, page.url)
                if entry == 'projects':
                    expect(page.locator('#app-scroll-root')).to_have_attribute('data-home-project-stage', 'room')
                    page.get_by_role('button', name='返回窗前', exact=True).click()
                else:
                    expect(page.locator('[data-home-project-track]')).to_have_count(0)
                    page.locator('header a[href="/"]').click()
                page.wait_for_url(args.url + '/')
                expect(page.locator('#app-scroll-root')).to_have_attribute('data-home-project-stage', 'window')
                page.wait_for_selector('[data-world-canvas][data-home-artwork=ready]', state='attached', timeout=60000)
                results.append(f'{"reduced" if reduced else "motion"}/{method}/{entry}')
        for entry in ['papers', 'contact']:
            trigger = page.locator(f'[data-edge-trigger="{entry}"]')
            assert trigger.evaluate('el => el.tagName') == 'BUTTON'
            trigger.click()
            expect(trigger).to_have_attribute('aria-expanded', 'true')
            page.keyboard.press('Escape')
            expect(trigger).to_have_attribute('aria-expanded', 'false')
            expect(trigger).to_be_focused()
        results.append(f'{"reduced" if reduced else "motion"}/panel-buttons-and-escape')
        context.close()

    # Keep a real Link response pending while the visitor dismisses the preview
    # and scrolls. The scene must not replace that requested page with /projects.
    context = browser.new_context(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce')
    context.route('**/api/music?*', music_route)
    context.route('**/projects-check.wav', audio_route)
    context.route(re.compile(r'.*/(?:anime/latest\.json|api/anime)$'), lambda route: route.fulfill(status=503, json={}))
    pending = []
    context.route(re.compile(r'.*/about\?.*'), lambda route: route.abort() if 'next-router-prefetch' in route.request.headers else pending.append(route))
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(args.url + '/', wait_until='domcontentloaded')
    page.wait_for_function("document.documentElement.classList.contains('splash-seen')", timeout=30000)
    page.wait_for_selector('[data-world-canvas][data-home-artwork=ready]', state='attached', timeout=60000)
    page.locator('[data-edge-trigger="about"]').click()
    page.wait_for_timeout(150)
    assert pending, 'The page response must still be pending for this race check'
    page.keyboard.press('Escape')
    page.mouse.move(720, 400)
    page.mouse.wheel(0, -3000)
    page.wait_for_timeout(500)
    assert page.url == args.url + '/', page.url
    assert page.locator('#app-scroll-root').evaluate('el => el.scrollTop == 2 * el.clientHeight')
    for route in pending:
        route.continue_()
    page.wait_for_url(args.url + '/about')
    page.wait_for_timeout(500)
    assert page.url == args.url + '/about'
    results.append('pending-link/escape/wheel/keeps-requested-page')
    context.close()


def connection_checks(browser):
    context = browser.new_context(viewport={'width': 1440, 'height': 900}, device_scale_factor=1)
    context.add_init_script("""(() => {
        window.worldContexts = new Set();
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(...args) {
            const context = original.apply(this, args);
            if (args[0].startsWith('webgl') && this.hasAttribute('data-world-canvas') && context)
                window.worldContexts.add(context);
            return context;
        };
    })()""")
    context.route('**/api/music?*', music_route)
    context.route('**/projects-check.wav', audio_route)
    context.route(re.compile(r'.*/(?:anime/latest\.json|api/anime)$'), lambda route: route.fulfill(status=503, content_type='application/json', body='{}'))
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    model_requests = []
    page.on('request', lambda request: model_requests.append(request.url) if '/projects-room/study.glb' in request.url else None)
    page.goto(args.url + '/', wait_until='networkidle')
    page.wait_for_function("document.documentElement.classList.contains('splash-seen')", timeout=30000)
    expect(page.locator('[data-home-project-track]')).to_have_count(1)
    page.wait_for_function("document.querySelector('[data-world-canvas]')?.dataset.homeArtwork === 'ready'", timeout=30000)
    world = page.locator('[data-world-canvas]').element_handle()
    expect(page.locator('canvas')).to_have_count(1)
    results.append('single-shared-webgl-scene')
    for value in [-0.46, 0.35, -0.46, 0]:
        page.locator('#app-scroll-root').evaluate('(el,p) => el.scrollTop = (2 + 2*p) * el.clientHeight', value)
        page.wait_for_function('(p) => Math.abs(Number(document.getElementById("app-scroll-root").dataset.homeProjectProgress)-p)<0.00001', arg=value)
        page.wait_for_timeout(250)
        if value == -0.46:
            pose = page.locator('[data-world-canvas]').get_attribute('data-camera-position')
            if 'orbit_pose' in locals(): assert pose == orbit_pose
            orbit_pose = pose
            shot(page, 'unified-orbit')
    results.append('reversible-spline/identical-resampled-pose')
    page.get_by_role('button', name='播放', exact=True).click()
    page.wait_for_function("document.querySelector('audio')?.currentTime > 0.1")
    audio_element = page.locator('audio').element_handle()
    playback_time = audio_element.evaluate('el => el.currentTime')
    home_top = page.locator('#app-scroll-root').evaluate('el => el.scrollTop')
    seek = page.get_by_role('slider', name='播放进度')
    seek.hover()
    page.mouse.down()
    page.mouse.move(720, 400)
    page.mouse.wheel(0, -600)
    page.wait_for_timeout(150)
    assert page.locator('#app-scroll-root').evaluate('el => el.scrollTop') == home_top
    page.mouse.up()

    player = page.locator('[data-home-music]').bounding_box()
    page.mouse.move(player['x'] + 20, player['y'] + 20)
    page.mouse.wheel(0, -2400)
    page.wait_for_timeout(200)
    assert page.locator('#app-scroll-root').evaluate('el => el.scrollTop') == home_top
    page.locator('[data-edge-trigger="projects"]').hover()
    expect(page.locator('[data-edge-trigger="projects"]')).to_have_attribute('aria-expanded', 'true')
    page.mouse.move(720, 400)
    page.mouse.wheel(0, -2400)
    page.wait_for_timeout(200)
    assert page.url == args.url + '/'
    assert page.locator('#app-scroll-root').evaluate('el => el.scrollTop') == home_top
    page.mouse.click(720, 400)
    page.mouse.wheel(0, -2400)
    page.wait_for_url(args.url + '/projects')
    ready(page)
    assert page.locator('[data-room-hotspot]:visible').count() == 9
    assert world.evaluate("c => c.isConnected && c === document.querySelector('[data-world-canvas]')")
    assert page.evaluate('window.worldContexts.size') == 1
    assert len(model_requests) == 1
    assert page.locator('[data-world-canvas]').get_attribute('data-camera-position') == '-0.62000,1.90000,2.72000'
    shot(page, 'unified-desk')
    results.append('same-canvas/desk-camera/player-and-preview-protection')
    page.locator('#app-scroll-root').evaluate('el => el.scrollTop = 2 * el.clientHeight')
    expect(page.locator('[data-world-canvas]')).to_have_attribute('data-camera-position', '-0.99000,1.92000,-0.35000')
    page.locator('#app-scroll-root').evaluate('el => el.scrollTop = 0')
    page.wait_for_url(args.url + '/projects')
    ready(page)
    assert world.evaluate("c => c === document.querySelector('[data-world-canvas]')")
    results.append('route-handoff-preserves-unfinished-scroll-target')

    for target, name in zip(ids, names):
        button = page.locator(f'[data-room-hotspot="{target}"]')
        button.click()
        dialog = page.get_by_role('dialog')
        expect(dialog.get_by_role('heading', name=name, exact=True)).to_be_visible()
        assert dialog.get_by_role('link').get_attribute('href').startswith('https://github.com/')
        dialog.hover()
        page.mouse.wheel(0, 1200)
        page.wait_for_timeout(100)
        assert page.url == args.url + '/projects'
        page.keyboard.press('Escape')
        expect(button).to_be_focused()
    results.append('six-project-details/links/escape/scroll-protection')
    initial = page.locator('[data-room-hotspot="rumor"]').bounding_box()
    page.get_by_role('button', name='自由查看', exact=True).click()
    page.mouse.move(720, 500)
    page.mouse.wheel(0, 500)
    page.wait_for_timeout(300)
    assert page.url == args.url + '/projects'
    assert page.locator('#app-scroll-root').evaluate('el => el.scrollTop') == 0
    zoomed = page.locator('[data-room-hotspot="rumor"]').bounding_box()
    assert zoomed is None or abs(zoomed['x'] - initial['x']) + abs(zoomed['y'] - initial['y']) > 2
    page.get_by_role('button', name='结束自由查看', exact=True).click()
    page.wait_for_url(args.url + '/')
    expect(page.locator('#app-scroll-root')).to_have_attribute('data-home-project-stage', 'window')
    page.goto(args.url + '/projects', wait_until='networkidle')
    ready(page)
    page.get_by_role('button', name='自由查看', exact=True).click()
    page.locator('[data-room-hotspot="iris"]').click()
    page.keyboard.press('Escape')
    expect(page.get_by_role('dialog')).to_have_count(0)
    assert page.url == args.url + '/projects'
    expect(page.get_by_role('button', name='结束自由查看', exact=True)).to_have_attribute('aria-pressed', 'true')
    page.keyboard.press('Escape')
    page.wait_for_url(args.url + '/')
    expect(page.locator('#app-scroll-root')).to_have_attribute('data-home-project-stage', 'window')
    results.append('free-view-return/button/escape/dialog-priority')
    # A direct reload above creates a new Provider. Start the music continuity
    # assertion within this visit, then verify the same audio across real routes.
    page.get_by_role('button', name='播放', exact=True).click()
    page.wait_for_function("document.querySelector('audio')?.currentTime > 0.1")
    audio_element = page.locator('audio').element_handle()
    playback_time = audio_element.evaluate('el => el.currentTime')
    page.mouse.move(720, 400)
    page.mouse.wheel(0, 2400)
    expect(page.locator('#app-scroll-root')).to_have_attribute('data-home-project-stage', 'landscape')
    expect(page.locator('[data-world-canvas]')).to_have_attribute('data-camera-position', '0.00000,0.32000,-22.00000')
    expect(page.locator('canvas')).to_have_count(1)
    assert page.locator('[data-home-ui]').evaluate('el => el.inert')
    shot(page, 'unified-lake')
    results.append('real-lake-camera/controls-inert')
    assert page.url == args.url + '/'
    page.mouse.wheel(0, -300)
    expect(page.locator('#app-scroll-root')).to_have_attribute('data-home-project-stage', 'transition')
    page.get_by_role('button', name='返回窗前', exact=True).click()
    page.wait_for_timeout(200)
    page.mouse.move(720, 400)
    page.mouse.wheel(0, -100)
    page.wait_for_timeout(1500)
    stopped = page.locator('#app-scroll-root').get_attribute('data-home-project-progress')
    page.wait_for_timeout(300)
    assert page.locator('#app-scroll-root').get_attribute('data-home-project-progress') == stopped
    page.get_by_role('button', name='返回窗前', exact=True).click()
    expect(page.locator('#app-scroll-root')).to_have_attribute('data-home-project-stage', 'window')
    assert audio_element.evaluate("el => el === document.querySelector('audio') && !el.paused")
    assert audio_element.evaluate('el => el.currentTime') > playback_time
    assert not page.locator('[data-home-ui]').evaluate('el => el.inert')
    expect(page.locator('[data-world-canvas]')).to_have_attribute('data-camera-position', '-0.99000,1.92000,-0.35000')
    results.append('three-states/reverse/interruptible-return/same-audio')
    page.locator('#app-scroll-root').evaluate('el => el.scrollTop = 2.5 * el.clientHeight')
    expect(page.locator('#app-scroll-root')).to_have_attribute('data-home-project-progress', '0.25000')
    page.locator('[data-home-project-controls] summary').click()
    page.locator('[data-home-project-controls] a[href="/about"]').click()
    page.wait_for_url(args.url + '/about')
    expect(page.locator('[data-home-project-track]')).to_have_count(0)
    page.go_back(wait_until='domcontentloaded')
    page.wait_for_url(args.url + '/')
    expect(page.locator('#app-scroll-root')).to_have_attribute('data-home-project-progress', '0.25000')
    page.set_viewport_size({'width': 1280, 'height': 800})
    expect(page.locator('#app-scroll-root')).to_have_attribute('data-home-project-progress', '0.25000')
    page.go_forward(wait_until='domcontentloaded')
    page.wait_for_url(args.url + '/about')
    page.go_back(wait_until='domcontentloaded')
    page.wait_for_url(args.url + '/')
    expect(page.locator('#app-scroll-root')).to_have_attribute('data-home-project-progress', '0.25000')

    page.reload(wait_until='domcontentloaded')
    expect(page.locator('#app-scroll-root')).to_have_attribute('data-home-project-progress', '0.25000', timeout=30000)
    page.wait_for_function("document.documentElement.classList.contains('splash-seen')", timeout=30000)
    results.append('back-forward/refresh/normalized-checkpoint/resize')
    page.mouse.move(640, 400)
    page.mouse.wheel(0, -3000)
    page.wait_for_url(args.url + '/projects')
    ready(page)
    page.locator('[data-room-hotspot="notes"]').click()
    page.wait_for_url(re.compile(r'.*/blog(?:/.*)?$'))
    expect(page.locator('[data-home-project-track]')).to_have_count(0)
    assert page.evaluate('scrollY') == 0
    results.append('normal-notes-route')
    print('PASS core three-state/input/return/history checks', flush=True)
    context.close()

    for width, height, reduced in [(1920, 1080, False), (1648, 928, False), (1440, 900, False), (1366, 768, False), (1280, 800, False), (1024, 768, False), (700, 800, False), (844, 480, False), (1440, 900, True)]:
        context = browser.new_context(viewport={'width': width, 'height': height}, reduced_motion='reduce' if reduced else 'no-preference')
        context.route(re.compile(r'.*/(?:anime/latest\.json|api/anime)$'), lambda route: route.fulfill(status=503, content_type='application/json', body='{}'))
        page = context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(args.url + '/projects', wait_until='networkidle')
        ready(page)
        page.wait_for_function("document.documentElement.classList.contains('splash-seen')", timeout=30000)
        expect(page.locator('[data-home-project-track]')).to_have_count(1)
        page.mouse.move(width // 2, height // 2)
        page.mouse.wheel(0, 1200)
        page.wait_for_url(args.url + '/')
        page.wait_for_selector('[data-home-scene]')
        if page.locator('#app-scroll-root').get_attribute('data-home-project-stage') != 'window':
            page.get_by_role('button', name='返回窗前', exact=True).click()
        expect(page.locator('#app-scroll-root')).to_have_attribute('data-home-project-stage', 'window')
        if reduced:
            page.mouse.move(width//2,height//2)
            page.mouse.wheel(0,3000)
            expect(page.locator('#app-scroll-root')).to_have_attribute('data-home-project-stage','landscape')
            expect(page.locator('[data-world-canvas]')).to_have_attribute('data-camera-position', '0.00000,0.32000,-22.00000')
            page.get_by_role('button',name='返回窗前',exact=True).click()
            expect(page.locator('#app-scroll-root')).to_have_attribute('data-home-project-stage','window')
            results.append('reduced-motion/absolute-camera-sampling')
        page.mouse.move(width//2,height//2)
        page.mouse.wheel(0, -2400)
        page.wait_for_url(args.url + '/projects')
        ready(page)
        context.close()
        results.append(f'desktop-wheel-roundtrip/{width}x{height}/reduced-{reduced}')
        print(f'PASS desktop {width}x{height} reduced={reduced}', flush=True)

    context = browser.new_context(viewport={'width': 1440, 'height': 900})
    context.route('**/projects-room/study.glb', lambda route: route.abort())
    context.route(re.compile(r'.*/(?:anime/latest\.json|api/anime)$'), lambda route: route.fulfill(status=503, content_type='application/json', body='{}'))
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(args.url + '/projects', wait_until='networkidle')
    expect(page.locator('[data-room-status]')).to_have_attribute('data-room-status', 'error', timeout=45000)
    expect(page.locator('details article')).to_have_count(6)
    expect(page.locator('summary').filter(has_text='项目目录')).to_be_visible()
    results.append('model-failure/readable-six-projects')
    context.close()
    context = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True,
        user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1')
    context.route(re.compile(r'.*/(?:anime/latest\.json|api/anime)$'), lambda route: route.fulfill(status=503, content_type='application/json', body='{}'))
    page = context.new_page()
    page.goto(args.url + '/', wait_until='networkidle')
    page.wait_for_url(re.compile(r'.*/blog(?:/.*)?$'))
    expect(page.locator('[data-home-project-track]')).to_have_count(0)
    context.close()
    results.append('mobile-home-redirect')


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=args.browser)
    if args.navigation_only:
        navigation_checks(browser)
        browser.close()
        (args.output / 'navigation-report.json').write_text(json.dumps({'checks': results, 'pageErrors': errors}, indent=2), encoding='utf-8')
        assert not errors, errors
        print('PASS', ', '.join(results), flush=True)
        sys.exit(0)
    if args.connection_only:
        connection_checks(browser)
        browser.close()
        (args.output / 'connection-report.json').write_text(json.dumps({'matrix': results, 'pageErrors': errors,
            'music': 'Local browser fixture; unchanged root Provider and real audio element',
            'scope': 'One persistent Three.js scene and camera across home/projects, reversible cabin/lake trajectories, existing project interactions and root audio'}, indent=2), encoding='utf-8')
        assert not errors, errors
        print('PASS', ', '.join(results), flush=True)
        sys.exit(0)
    matrix = [(1440,1000,False), (960,800,False), (768,1024,True),
              (390,844,True), (320,568,True), (844,390,True)]
    for width, height, touch in matrix:
        if args.case and args.case != f'{width}x{height}':
            continue
        for theme in ['light', 'dark']:
            label = f'{width}x{height}-system-{theme}'
            music_requests_before = music_requests
            context = browser.new_context(viewport={'width': width, 'height': height},
                is_mobile=touch, has_touch=touch, device_scale_factor=1, color_scheme=theme,
                reduced_motion='reduce' if width == 320 else 'no-preference')
            # Legacy saved preferences must not change the fixed site appearance.
            context.add_init_script(f"localStorage.setItem('blog-theme','{theme}');"
                "localStorage.setItem('blog-theme-override-until',String(Date.now()+3600000))")
            # Only external music data is deterministic; run the real Provider and audio element.
            context.route('**/api/music?*', music_route)
            context.route('**/projects-check.wav', audio_route)
            page = context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(args.url + '/projects', wait_until='domcontentloaded', timeout=60000)
            page.wait_for_load_state('networkidle')
            ready(page)
            expect(page.locator('html')).not_to_have_class(re.compile(r'.*\bdark\b.*'))
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), label
            assert page.locator('[data-room-hotspot]:visible').count() == 9, label
            canvas = page.locator('canvas[aria-hidden="true"]').last
            assert int(canvas.get_attribute('data-triangles')) > 50000
            original_buffer_width = canvas.evaluate('el => el.width')
            page.set_viewport_size({'width': width + 120, 'height': height})
            page.wait_for_function("old => document.querySelector('canvas[data-triangles]').width !== old",
                arg=original_buffer_width)
            page.set_viewport_size({'width': width, 'height': height})
            page.wait_for_function("old => document.querySelector('canvas[data-triangles]').width === old",
                arg=original_buffer_width)
            shot(page, label)
            heading = page.get_by_role('heading', name='研究小屋', exact=True).bounding_box()
            banner = page.get_by_role('banner')
            if banner.is_visible():
                nav = banner.bounding_box()
                assert heading['y'] >= nav['y'] + nav['height'], label
            unobscured(page.get_by_role('button', name='回到桌前'))
            assert music_requests == music_requests_before, 'The unopened room must not request music'
            project_checks(page)
            page.wait_for_function("document.querySelector('audio') !== null")
            assert music_requests == music_requests_before + 1, 'First music entry must load once'
            expect(page.get_by_role('button', name=re.compile('切换到日间|切换到夜间'))).to_have_count(0)
            if touch:
                rotate = page.get_by_role('button', name=re.compile(r'^(旋转|结束旋转)$'))
                rotate.click()
                expect(rotate).to_have_attribute('aria-pressed', 'true')
                expect(canvas).to_have_css('touch-action', 'none')
            else:
                page.get_by_role('button', name='显示入口', exact=True).click()
                expect(page.locator('[data-labels]')).to_have_attribute('data-labels', 'true')
                shot(page, label + '-labels')
                page.get_by_role('button', name='收起入口', exact=True).click()
            # A real drag changes the camera; resetting restores every project hotspot.
            canvas.scroll_into_view_if_needed()
            box = canvas.bounding_box()
            drag_y = min(max(box['y'] + box['height'] * .75, 40), height - 30)
            initial = page.locator('[data-room-hotspot="rumor"]').bounding_box()
            page.mouse.move(box['x'] + box['width']*.45, drag_y)
            page.mouse.down(); page.mouse.move(box['x'] + box['width']*.7, drag_y, steps=15); page.mouse.up()
            page.wait_for_timeout(400)
            moved = page.locator('[data-room-hotspot="rumor"]').bounding_box()
            assert moved is None or abs(moved['x']-initial['x']) + abs(moved['y']-initial['y']) > 2
            page.get_by_role('button', name='回到桌前').click()
            if touch:
                page.get_by_role('button', name='结束旋转', exact=True).click()
                expect(canvas).to_have_css('touch-action', 'pan-y')
            ready(page)
            page.locator('[data-room-hotspot="headphones"]').click()
            expect(page.get_by_role('heading', name='桌边的音乐', exact=True)).to_be_visible()
            page.get_by_role('button', name='继续播放', exact=True).click()
            page.wait_for_function("document.querySelector('audio')?.currentTime > 0.1")
            expect(page.locator('audio')).to_have_count(1)
            for sample_state in ['panel', 'idle']:
                if sample_state == 'idle':
                    page.keyboard.press('Escape')
                page.mouse.move(0, 0)
                page.wait_for_timeout(1500)  # Let hover/camera feedback settle before sampling.
                sample = page.evaluate('''async () => {
                    const canvas = document.querySelector('canvas[data-triangles]');
                    const audio = document.querySelector('audio');
                    let draws = 0, timeupdates = 0;
                    const start = audio.currentTime;
                    const tick = () => timeupdates++;
                    const observer = new MutationObserver(records => draws += records.length);
                    observer.observe(canvas, { attributes: true, attributeFilter: ['data-triangles'] });
                    audio.addEventListener('timeupdate', tick);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    observer.disconnect();
                    audio.removeEventListener('timeupdate', tick);
                    return { draws, timeupdates, seconds: audio.currentTime - start, paused: audio.paused };
                }''')
                assert not sample['paused'] and sample['timeupdates'] >= 2 and sample['seconds'] > 0, sample
                assert sample['draws'] == 0, f'Music progress repainted the {sample_state} room: {sample}'
                music_draw_samples.append({'case': label, 'state': sample_state, **sample})
            # Soft navigation must preserve the root audio element and playback.
            audio_element = page.locator('audio').element_handle()
            playback_time = audio_element.evaluate('el => el.currentTime')
            page.keyboard.press('Escape')
            page.locator('summary').filter(has_text='项目目录').click()
            page.locator('details').get_by_role('link', name='笔记', exact=True).click()
            page.wait_for_url(re.compile(r'.*/blog(?:/.*)?$'))
            page.wait_for_function('''({audio, time}) => audio.isConnected &&
                document.querySelector('audio') === audio && !audio.paused && audio.currentTime > time''',
                arg={'audio': audio_element, 'time': playback_time})
            expect(page.locator('audio')).to_have_count(1)
            page.go_back(wait_until='domcontentloaded')
            ready(page)
            assert audio_element.evaluate("el => el === document.querySelector('audio') && !el.paused")
            assert music_requests == music_requests_before + 1, 'Soft navigation must reuse the playlist'
            page.locator('[data-room-hotspot="headphones"]').click()
            page.get_by_role('button', name='暂停播放', exact=True).click()
            page.wait_for_function("document.querySelector('audio')?.paused === true")
            page.keyboard.press('Escape')
            page.locator('[data-room-hotspot="rumor"]').click()
            shot(page, label + '-detail')
            page.keyboard.press('Escape')
            page.get_by_role('button', name='静态浏览', exact=True).click()
            expect(page.locator('[data-room-status]')).to_have_attribute('data-room-status', 'static')
            expect(page.locator('[data-room-hotspot]')).to_have_count(0)
            expect(page.locator('details')).to_have_attribute('open', '')
            expect(page.locator('details article')).to_have_count(6)
            shot(page, label + '-static')
            page.get_by_role('button', name='进入 3D', exact=True).click()
            ready(page)
            results.append(label)
            print('PASS', label, flush=True)
            context.close()
    # Network failure must preserve readable projects and retry into the same real scene.
    context = browser.new_context(viewport={'width':390, 'height':844})
    context.route('**/api/music?*', music_route)
    context.route('**/projects-check.wav', audio_route)
    context.route('**/projects-room/study.glb', lambda route: route.abort())
    page = context.new_page()
    page.goto(args.url + '/projects', wait_until='domcontentloaded')
    expect(page.locator('[data-room-status]')).to_have_attribute('data-room-status','error',timeout=45000)
    expect(page.locator('details article')).to_have_count(6)
    expect(page.locator('details')).to_have_attribute('open','')
    shot(page, 'load-failure')
    context.unroute('**/projects-room/study.glb')
    page.get_by_role('button', name='进入 3D', exact=True).click()
    ready(page)
    page.locator('canvas[aria-hidden="true"]').last.evaluate("c => c.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()")
    expect(page.locator('[data-room-status]')).to_have_attribute('data-room-status','error',timeout=15000)
    page.get_by_role('button', name='进入 3D', exact=True).click()
    ready(page)
    context.close()
    browser.close()
(args.output / 'report.json').write_text(json.dumps({'matrix': results, 'pageErrors': errors,
    'musicDrawSamples': music_draw_samples,
    'music': 'Browser-only fixture; real Provider and HTMLAudioElement; external service not verified',
    'fallback': 'GLB request failure, context loss, retry passed'},ensure_ascii=False,indent=2),encoding='utf-8')
assert not errors, errors
print('PASS all matrix cases, GLB failure, context loss and retries', flush=True)
