"""Exercise the real /projects room and capture #52 acceptance evidence locally."""
import argparse
import io
import json
import math
import re
import struct
import wave
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--url', default='http://127.0.0.1:3152')
parser.add_argument('--output', type=Path, default=Path('.sync/tmp-projects-52-evidence'))
parser.add_argument('--case', help='Run a single WIDTHxHEIGHT case')
parser.add_argument('--browser', help='Existing Chromium executable; otherwise Playwright Chromium')
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
ids = ['rumor', 'topp', 'iris', 'competitions', 'gudhi', 'animeko']
names = ['early-rumor-propagation-tda', 'topp', 'Iris-Terminal',
         'ai-data-competitions-ui', 'GUDHI/gudhi-devel', 'open-ani/animeko']
errors = []
results = []
audio = io.BytesIO()
with wave.open(audio, 'wb') as wav:
    wav.setnchannels(1)
    wav.setsampwidth(2)
    wav.setframerate(8000)
    wav.writeframes(b''.join(struct.pack('<h', int(800 * math.sin(i * math.tau * 220 / 8000)))
                             for i in range(8000 * 12)))


def music_route(route):
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
    page.wait_for_timeout(1100)  # Include the completed reveal and shared theme transition.
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


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=args.browser)
    matrix = [(1440,1000,False), (960,800,False), (768,1024,True),
              (390,844,True), (320,568,True), (844,390,True)]
    for width, height, touch in matrix:
        if args.case and args.case != f'{width}x{height}':
            continue
        for theme in ['light', 'dark']:
            label = f'{width}x{height}-{theme}'
            context = browser.new_context(viewport={'width': width, 'height': height},
                is_mobile=touch, has_touch=touch, device_scale_factor=1,
                reduced_motion='reduce' if width == 320 else 'no-preference')
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
            if theme == 'dark':
                expect(page.locator('html')).to_have_class(re.compile(r'.*dark.*'))
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), label
            assert page.locator('[data-room-hotspot]:visible').count() == 9, label
            canvas = page.locator('canvas[aria-hidden="true"]').last
            assert int(canvas.get_attribute('data-triangles')) > 50000
            shot(page, label)
            heading = page.get_by_role('heading', name='研究小屋', exact=True).bounding_box()
            banner = page.get_by_role('banner')
            if banner.is_visible():
                nav = banner.bounding_box()
                assert heading['y'] >= nav['y'] + nav['height'], label
            unobscured(page.get_by_role('button', name='回到桌前'))
            project_checks(page)
            # Theme remains shared with the whole site and updates the baked room.
            page.get_by_role('button', name='切换到日间' if theme == 'dark' else '切换到夜间').click()
            expect(page.get_by_role('button', name='切换到夜间' if theme == 'dark' else '切换到日间')).to_be_visible()
            page.get_by_role('button', name='切换到夜间' if theme == 'dark' else '切换到日间').click()
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
    'music': 'Browser-only fixture; real Provider and HTMLAudioElement; external service not verified',
    'fallback': 'GLB request failure, context loss, retry passed'},ensure_ascii=False,indent=2),encoding='utf-8')
assert not errors, errors
print('PASS all matrix cases, GLB failure, context loss and retries', flush=True)
