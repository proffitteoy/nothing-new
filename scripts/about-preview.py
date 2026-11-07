"""Check the real /about page without changing its background, content, or data.

Writes screenshots to docs/images/about-profile/ and a report to ignored .sync/tmp-about-58/.
Requires a running preview and optional Python Playwright; see docs/project/about-profile.md.
"""
import argparse
import json
from pathlib import Path
import subprocess

from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--url', default='http://127.0.0.1:3168')
parser.add_argument('--browser', help='Existing Chromium executable (otherwise Playwright Chromium)')
parser.add_argument('--node', default='node', help='Node 22 executable for the KaTeX layout sample')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
tmp = root / '.sync/tmp-about-58'
out = root / 'docs/images/about-profile'
tmp.mkdir(parents=True, exist_ok=True)
out.mkdir(parents=True, exist_ok=True)
source = 'live'
report = []

try:
    # Real KaTeX markup tests visual compatibility without changing the actual content file.
    math_html = subprocess.check_output([args.node, '--input-type=module', '-e', "import katex from 'katex'; console.log(katex.renderToString(String.raw`\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}`, {displayMode:true}));"], cwd=root, text=True, encoding='utf-8').strip()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, executable_path=args.browser)
        for width, theme, motion in [(320,'light','reduce'), (390,'light','no-preference'), (390,'dark','reduce'), (768,'light','reduce'), (1024,'dark','reduce'), (1440,'light','no-preference'), (1440,'dark','reduce'), (1920,'light','reduce')]:
            context = browser.new_context(viewport={'width': width, 'height': 1000}, is_mobile=width < 768, has_touch=width < 768, reduced_motion=motion)
            context.add_init_script(f"localStorage.setItem('blog-theme','{theme}');localStorage.setItem('blog-theme-override-until',String(Date.now()+86400000))")
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            response = page.goto(args.url + '/about', wait_until='networkidle', timeout=60000)
            assert response and response.ok
            page.wait_for_function("document.documentElement.classList.contains('splash-seen')")
            assert page.get_by_role('heading', name='关于我', exact=True).is_visible()
            assert page.locator('html').evaluate("el=>el.classList.contains('dark')") == (theme == 'dark')
            article = page.locator('article[aria-labelledby="about-title"]')
            surface = 'rgb(26, 34, 51)' if theme == 'dark' else 'rgb(255, 255, 255)'
            page_surface = page.locator('main').locator('..').locator('..')
            assert page_surface.evaluate('(el)=>getComputedStyle(el).backgroundColor') == 'rgba(0, 0, 0, 0)'
            assert article.locator('[class*="_cover"]').first.evaluate('(el)=>getComputedStyle(el,"::after").content') in ('none', 'normal')
            if width >= 768:
                assert page.get_by_role('navigation',name='主导航',exact=True).evaluate('''(el)=>{const c=document.createElement('canvas').getContext('2d');c.fillStyle=getComputedStyle(el).getPropertyValue('--journal-paper');return c.fillStyle}''') == ('#1a2233' if theme == 'dark' else '#ffffff')
                assert page.get_by_role('navigation',name='主导航',exact=True).evaluate('(el)=>getComputedStyle(el.closest("header")).backgroundColor') == 'rgba(0, 0, 0, 0)'
                assert page.locator('#app-scroll-root').bounding_box()['y'] >= 72
            prose = article.locator('[class*="_prose"]')
            assert prose.locator('h2').count() == 3
            assert prose.locator('li').count() == 8
            assert article.locator('img').evaluate_all('(xs)=>xs.every(x=>x.complete&&x.naturalWidth>0)')
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            assert article.evaluate('(el)=>el.scrollWidth <= el.clientWidth + 1')
            assert prose.evaluate('(el)=>parseFloat(getComputedStyle(el).fontSize) >= 16')
            calendar = page.get_by_role('region', name='可横向滚动的 GitHub 贡献日历')
            title = page.locator('#activity-heatmap-title').inner_text()
            if calendar.count():
                cells = calendar.locator('[role="img"]')
                assert cells.count() >= 365
                calendar.scroll_into_view_if_needed()
                page.wait_for_function("el=>el.scrollWidth-el.clientWidth-el.scrollLeft<3", arg=calendar.element_handle())
                calendar.focus()
                assert calendar.evaluate('(el)=>getComputedStyle(el).outlineStyle') == 'solid'
                if calendar.evaluate('(el)=>el.scrollWidth > el.clientWidth'):
                    start = calendar.evaluate('(el)=>el.scrollLeft')
                    page.keyboard.press('ArrowLeft')
                    page.wait_for_function('(args)=>args.el.scrollLeft<args.start-1', arg={'el':calendar.element_handle(), 'start':start})
                    page.keyboard.press('ArrowRight')
                    page.wait_for_function('el=>el.scrollWidth-el.clientWidth-el.scrollLeft<3', arg=calendar.element_handle())
                calendar.evaluate('(el)=>el.blur()')
                data_state = f'{cells.count()} real days; {title}'
            else:
                assert title == 'GitHub 贡献数据暂时不可用'
                assert article.get_by_text('暂时无法从 GitHub 获取公开贡献记录，请稍后再试。').is_visible()
                data_state = 'upstream unavailable; original fallback'
            github = article.get_by_role('link', name='GitHub 主页 ↗')
            assert github.get_attribute('href') == 'https://github.com/proffitteoy'
            assert github.get_attribute('rel') == 'noopener noreferrer'
            github.focus()
            assert github.evaluate('(el)=>getComputedStyle(el).outlineStyle') == 'solid'
            github.evaluate('(el)=>el.blur()')
            if width in (390, 1440):
                # The fixed original backdrop must remain continuous while the page scrolls.
                # Root transparency is checked above; compare actual gutter pixels without mutating the UI.
                gutter_reference = None
                for position, target in [('top', None), ('middle', prose.locator('h2').nth(1)), ('bottom', page.locator('#activity-heatmap-title'))]:
                    if target is None:
                        page.evaluate("document.getElementById('app-scroll-root').scrollTop=0;window.scrollTo(0,0)")
                    else:
                        target.scroll_into_view_if_needed()
                    clip = {'x': 8, 'y': 800, 'width': 12, 'height': 12}
                    gutter = page.screenshot(clip=clip)
                    if gutter_reference is None:
                        gutter_reference = gutter
                    assert gutter == gutter_reference, f'Backdrop changes across page scroll at {width}/{theme}/{position}'
                    assert prose.locator('h2').first.is_visible()
                    if position == 'middle':
                        page.screenshot(path=str(out / f'{source}-{width}-{theme}-middle.jpg'), type='jpeg', quality=85)
                page.locator('#activity-heatmap-title').scroll_into_view_if_needed()
                page.screenshot(path=str(out / f'{source}-{width}-{theme}-activity.jpg'), type='jpeg', quality=85)
                page.evaluate("document.getElementById('app-scroll-root').scrollTop=0;window.scrollTo(0,0)")
                page.screenshot(path=str(out / f'{source}-{width}-{theme}.jpg'), type='jpeg', quality=85, full_page=width<768)
            if width < 768:
                page.get_by_role('button', name='打开导航', exact=True).tap()
                dialog = page.get_by_role('dialog', name='移动导航')
                dialog.wait_for(state='visible')
                assert dialog.locator('[aria-current="page"]').inner_text() == '关于'
                assert dialog.get_by_role('button',name='关闭导航').evaluate('(el)=>getComputedStyle(el).backgroundColor') == surface
                page.keyboard.press('Escape')
                dialog.wait_for(state='hidden')
            # Exercise scoped styles with rich content in the DOM only, after all real captures.
            original = prose.inner_html()
            prose.evaluate('(el, html)=>el.innerHTML=html', '<h2>排版兼容性检查</h2><p>行内公式 <span class="katex">x + y</span> 与原有正文。</p>' + math_html + '<img src="/about-cover.png" alt="测试图片"><blockquote><p>引用文字</p></blockquote><ol><li>有序列表<ul><li>嵌套条目</li></ul></li></ol><p><del>删除线</del> <code>inline_code</code></p><pre><code>' + 'very_long_code_line_'*40 + '</code></pre><table><tr><th>表头</th><td>' + 'longtablecell'*50 + '</td></tr></table>')
            assert prose.locator('.katex-display').is_visible()
            assert prose.locator('img').is_visible()
            assert prose.evaluate('(el)=>el.scrollWidth <= el.clientWidth+1'), 'Rich content overflows page'
            assert prose.locator('pre').evaluate('(el)=>el.scrollWidth>el.clientWidth&&getComputedStyle(el).overflowX=="auto"')
            assert prose.locator('del').evaluate('(el)=>getComputedStyle(el).textDecorationLine') == 'line-through'
            prose.evaluate('(el, html)=>el.innerHTML=html', original)
            assert not errors, errors
            record = {'width':width,'theme':theme,'motion':motion,'data':data_state,'checks':'transparent page/nav, no cover mask, backdrop pixels at top/middle/bottom, images, content, bounds, keyboard focus/scroll, mobile nav, math/code/image/list/table typography, no page errors'}
            report.append(record)
            print(json.dumps(record, ensure_ascii=False), flush=True)
            context.close()
        browser.close()
finally:
    (tmp / 'report-live.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
