"""Capture the real TDA weekly cover, contents and reader before/after renewal.

Optional Python Playwright and Pillow; see docs/project/tda-paper-monitor.md.
Raw captures and check results stay in the ignored .sync/tmp-paper-monitor/.
"""

import argparse
import json
import subprocess
from pathlib import Path

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--url", default="http://127.0.0.1:3110")
parser.add_argument("--stage", choices=["before", "after"], required=True)
parser.add_argument("--browser", help="Optional Chromium executable")
parser.add_argument("--check-only", action="store_true")
parser.add_argument("--compare", action="store_true", help="Build two compact review sheets from both stages")
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
output = root / ".sync/tmp-paper-monitor" / args.stage
output.mkdir(parents=True, exist_ok=True)
observed_errors = []


def visit(browser, width, theme, reduced="reduce", intercept=None):
    context = browser.new_context(
        viewport={"width": width, "height": 900 if width >= 768 else 844},
        device_scale_factor=1, reduced_motion=reduced,
        is_mobile=width < 768, has_touch=width < 768,
    )
    context.add_init_script(f"""
        localStorage.setItem('blog-theme', '{theme}');
        localStorage.setItem('blog-theme-override-until', String(Date.now() + 86400000));
    """)
    if intercept:
        context.route("**/api/papers", intercept)
    page = context.new_page()
    page.on("pageerror", lambda error: observed_errors.append(str(error)))
    response = page.goto(args.url, wait_until="domcontentloaded", timeout=60000)
    assert response and response.ok, "Home did not load"
    page.wait_for_function("document.documentElement.classList.contains('splash-seen')")
    try:
        page.wait_for_load_state("networkidle", timeout=10000)
    except PlaywrightTimeoutError:
        pass  # Other home components can still be fetching live music/images.
    entry = page.get_by_role("button", name="打开 TDA 论文周报", exact=True)
    entry.scroll_into_view_if_needed()
    page.wait_for_function("""() => {
        const image = document.querySelector('img[src*="profile-studio"]');
        return image?.complete && image.naturalWidth > 0;
    }""")
    return context, page, entry


def fits(page, container):
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "Page overflow"
    assert container.evaluate("el => el.scrollWidth <= el.clientWidth + 1"), "Reading column overflow"


def check(browser):
    # Real reports: no request interception in the viewport matrix or content checks.
    for theme in ["light", "dark"]:
        context, page, entry = visit(browser, 1440, theme, reduced="no-preference")
        issue, reader = page.locator("#tda-issue-dialog"), page.locator("#tda-paper-dialog")
        buttons = issue.locator('button[aria-controls="tda-paper-dialog"]')
        for width in [1440, 1280, 768, 390, 320]:
            page.set_viewport_size({"width": width, "height": 900 if width >= 768 else 844})
            entry.scroll_into_view_if_needed()
            height = entry.bounding_box()["height"]
            assert height == (340 if width >= 1024 else 320 if width >= 640 else 300), height
            page.keyboard.press("Tab")  # Establish keyboard modality before checking :focus-visible.
            entry.focus()
            assert entry.evaluate("el => getComputedStyle(el).outlineStyle") != "none"
            page.keyboard.press("Enter")
            issue.wait_for(state="visible")
            fits(page, issue.locator('[class*="reading"]'))
            assert issue.get_by_role("button", name="关闭周报").evaluate("el => el === document.activeElement")
            bounds = [b.bounding_box() for b in buttons.all()]
            assert len({round(b["x"]) for b in bounds}) == 1, "Contents must be one column"
            assert all(bounds[i]["y"] < bounds[i + 1]["y"] for i in range(len(bounds) - 1))
            assert buttons.first.get_by_text("A minimising principle for interval covers of zigzag persistence modules", exact=True).is_visible()
            buttons.first.click()
            reader.wait_for(state="visible")
            article = reader.locator("article")
            fits(page, article)
            assert page.locator("dialog[open]").count() == 2
            assert reader.get_by_role("button", name="返回本期论文").evaluate("el => el === document.activeElement")
            page.keyboard.press("Shift+Tab")
            # Native dialogs may traverse browser chrome (activeElement becomes body).
            # The invariant is that neither the lower dialog nor the page can take focus.
            assert reader.evaluate("el => el.contains(document.activeElement) || document.activeElement === document.body")
            assert buttons.first.evaluate("el => { el.focus(); return el !== document.activeElement; }"), "Lower dialog took focus"
            reader.get_by_role("button", name="返回本期论文").focus()
            page.keyboard.press("Escape")
            reader.wait_for(state="hidden")
            assert issue.is_visible() and buttons.first.evaluate("el => el === document.activeElement")
            page.screenshot(path=str(output / f"matrix-{width}-{theme}-contents.jpg"), quality=80)
            issue.get_by_role("button", name="关闭周报").click()
            issue.wait_for(state="hidden")
            assert entry.evaluate("el => el === document.activeElement")
            assert page.locator("#app-scroll-root").evaluate("el => el.style.overflowY") != "hidden"
            print(f"PASS {width}/{theme}: cover height, full titles, single column, reader bounds, focus, Escape", flush=True)
        if theme == "light":
            response = page.request.get(args.url + "/api/papers")
            assert response.ok
            reports = response.json()["reports"]
            assert [(r["date"], len(r["papers"])) for r in reports] == [("2026-11-02", 6), ("2026-10-30", 3)]
            entry.click()
            assert issue.get_by_role("combobox").locator("option").evaluate_all("els => els.map(el => el.value)") == [r["date"] for r in reports]
            for report in reports:
                issue.get_by_role("combobox").select_option(report["date"])
                assert buttons.count() == len(report["papers"])
                assert issue.get_by_text(f"本期 {len(report['papers'])} 篇选读", exact=True).count() == 1
                assert issue.locator("details").get_attribute("open") is None
                issue.locator("summary").click()
                actual_overview = issue.locator('[class*="prose"]')
                for index, html in enumerate(filter(None, [report["introduction"], report["conclusion"]])):
                    assert same_html(actual_overview.nth(index), html), "Overview content changed"
                issue.locator("summary").click()
                for index, paper in enumerate(report["papers"]):
                    assert buttons.nth(index).get_by_text(paper["title"], exact=True).count() == 1
                    if paper["priority"]:
                        assert buttons.nth(index).get_by_text(f"阅读优先级 · {paper['priority']}", exact=True).count() == 1
                    buttons.nth(index).click()
                    reader.wait_for(state="visible")
                    assert reader.locator("#tda-paper-title").inner_text() == paper["title"]
                    assert same_html(reader.locator('[class*="prose"]'), paper["html"]), "Paper HTML changed"
                    source = reader.get_by_role("link", name="阅读原文")
                    if paper["url"]:
                        assert source.get_attribute("href") == paper["url"]
                        assert source.get_attribute("target") == "_blank"
                        source.scroll_into_view_if_needed()
                    reader.get_by_role("button", name="返回本期论文").click()
                    reader.wait_for(state="hidden")
                    assert issue.get_by_role("combobox").input_value() == report["date"]
                print(f"PASS {report['date']}: every title, priority, HTML, source URL, overview and return context", flush=True)
            issue.get_by_role("button", name="关闭周报").click()
        context.close()

    # Explicit failure, delayed-update and rich-text fixtures are separate from screenshots.
    context, page, entry = visit(browser, 390, "dark", intercept=lambda route: route.fulfill(status=503, body="Unavailable"))
    entry.tap()
    issue, reader = page.locator("#tda-issue-dialog"), page.locator("#tda-paper-dialog")
    assert "暂时无法检查更新" in issue.get_by_role("status").inner_text()
    assert issue.locator('button[aria-controls="tda-paper-dialog"]').count() == 6
    issue.locator('button[aria-controls="tda-paper-dialog"]').first.tap()
    page.touchscreen.tap(2, 2)
    reader.wait_for(state="hidden")
    assert issue.is_visible()
    page.touchscreen.tap(2, 2)
    issue.wait_for(state="hidden")
    entry.focus()
    page.keyboard.press("Space")
    issue.wait_for(state="visible")
    page.keyboard.press("Escape")
    issue.wait_for(state="hidden")
    context.close()
    print("PASS failed request: saved reports, honest status; touch/backdrop/Space close only top dialog", flush=True)

    pending = []
    context, page, entry = visit(browser, 320, "light", intercept=lambda route: pending.append(route))
    issue, reader = page.locator("#tda-issue-dialog"), page.locator("#tda-paper-dialog")
    entry.click()
    issue.locator('button[aria-controls="tda-paper-dialog"]').first.click()
    assert pending, "Update request not intercepted"
    fixture = json.loads(json.dumps(reports[0]))
    fixture.update(date="2026-11-03", introduction="", conclusion="")
    fixture["papers"] = [dict(reports[0]["papers"][0], priority="", url=None)]
    with page.expect_response("**/api/papers"):
        pending[0].fulfill(json={"reports": [fixture]})
    # Wait for fetch's state update without relying on an arbitrary timer.
    page.evaluate("() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))")
    assert "2026.11.02" in reader.inner_text(), "An update interrupted reading"
    page.keyboard.press("Escape")
    reader.wait_for(state="hidden")
    assert issue.get_by_role("combobox").input_value() == "2026-11-02"
    issue.get_by_role("button", name="关闭周报").click()
    page.wait_for_function("document.querySelector('button[aria-controls=\"tda-issue-dialog\"]').innerText.includes('2026.11.03')")
    entry.click()
    assert issue.locator("details").count() == 0
    assert issue.locator('[class*="priority"]').count() == 0
    issue.locator('button[aria-controls="tda-paper-dialog"]').first.click()
    assert reader.get_by_role("link", name="阅读原文").count() == 0
    # Synthetic DOM additions stress CSS only; no report/parser/source file is edited.
    formula = r"\sum_{i=1}^{N}\frac{\rho_i(V)+\varepsilon_i(\Sigma)}{1+\dim H_i(X)}"
    math_html = subprocess.check_output([
        "node", "-e", "process.stdout.write(require('katex').renderToString(process.argv[1], {displayMode:true,throwOnError:true}))",
        " + ".join([formula] * 8),
    ], cwd=root, encoding="utf-8")
    reader.locator('[class*="prose"]').evaluate("""(el, math) => {
        el.insertAdjacentHTML('afterbegin', math);
        el.insertAdjacentHTML('beforeend', '<h2>Level two</h2><h3>Level three</h3><h4>Level four</h4>' +
            '<pre><code>' + 'wide_code_'.repeat(100) + '</code></pre>' +
            '<table><tr>' + '<td>Cell</td>'.repeat(12) + '</tr></table>' +
            '<p><a href="https://example.com/">https://example.com/' + 'longurl'.repeat(100) + '</a></p>');
    }""", math_html)
    for selector in [".katex-display", "pre", "table"]:
        scroller = reader.locator(selector)
        assert scroller.evaluate("el => el.scrollWidth > el.clientWidth && getComputedStyle(el).overflowX === 'auto'"), selector
        assert scroller.evaluate("el => { el.scrollLeft = 500; return el.scrollLeft > 0; }"), selector
    fits(page, reader.locator("article"))
    sizes = reader.locator('[class*="prose"]').evaluate("el => ['h2','h3','h4'].map(s => parseFloat(getComputedStyle(el.querySelector(s)).fontSize))")
    assert sizes[0] > sizes[1] > sizes[2], sizes
    assert entry.locator("img").evaluate("el => getComputedStyle(el).transitionProperty") == "none"
    page.screenshot(path=str(output / "rich-text-stress-320.jpg"), quality=85)
    context.close()
    print("PASS delayed update, empty optional fields, reduced motion, wide formula/code/table local scroll, heading hierarchy", flush=True)
    (output / "checks.json").write_text(json.dumps({"url": args.url, "matrix": "5 widths x 2 themes", "real_reports": "6 + 3 papers, exact HTML", "errors": observed_errors}, ensure_ascii=False, indent=2), encoding="utf-8")
    assert not observed_errors, observed_errors


def same_html(locator, html):
    return locator.evaluate("""(el, html) => {
        const expected = document.createElement('div'); expected.innerHTML = html;
        return el.innerHTML === expected.innerHTML;
    }""", html)


def capture(browser):
    for label, width in [("desktop", 1440), ("mobile", 390)]:
        for theme in ["light", "dark"]:
            context, page, entry = visit(browser, width, theme)
            prefix = f"{label}-{theme}"
            page.screenshot(path=str(output / f"{prefix}-cover.jpg"), quality=85)
            entry.click()
            issue = page.locator("#tda-issue-dialog")
            issue.wait_for(state="visible")
            page.screenshot(path=str(output / f"{prefix}-contents.jpg"), quality=85)
            issue.locator('button[aria-controls="tda-paper-dialog"]').first.click()
            page.locator("#tda-paper-dialog").wait_for(state="visible")
            page.screenshot(path=str(output / f"{prefix}-reader.jpg"), quality=85)
            context.close()
            print(f"Captured {args.stage}/{prefix}: cover, contents, reader", flush=True)


def compare():
    from PIL import Image, ImageDraw, ImageFont

    destination = root / "docs/images/paper-monitor"
    destination.mkdir(parents=True, exist_ok=True)
    font = ImageFont.load_default(size=18)
    for label, width, height in [("desktop", 720, 450), ("mobile", 390, 844)]:
        gap, caption = 16, 36
        sheet = Image.new("RGB", (width * 2 + gap * 3, (height + caption + gap) * 6 + gap), "#e8e7e3")
        draw = ImageDraw.Draw(sheet)
        for row, (theme, scene) in enumerate((t, s) for t in ["light", "dark"] for s in ["cover", "contents", "reader"]):
            for column, stage in enumerate(["before", "after"]):
                x, y = gap + column * (width + gap), gap + row * (height + caption + gap)
                draw.text((x, y + 5), f"{stage.upper()} / {theme.upper()} / {scene.upper()}", font=font, fill="#252936")
                source = root / ".sync/tmp-paper-monitor" / stage / f"{label}-{theme}-{scene}.jpg"
                with Image.open(source) as screenshot:
                    sheet.paste(screenshot.resize((width, height), Image.Resampling.LANCZOS), (x, y + caption))
        sheet.save(destination / f"{label}-comparison.jpg", quality=85, optimize=True)
        print(f"Review sheet: docs/images/paper-monitor/{label}-comparison.jpg", flush=True)


with sync_playwright() as p:
    if not args.compare:
        browser = p.chromium.launch(headless=True, executable_path=args.browser)
        if not args.check_only:
            capture(browser)
        if args.stage == "after":
            check(browser)
        browser.close()
    if args.compare:
        compare()
