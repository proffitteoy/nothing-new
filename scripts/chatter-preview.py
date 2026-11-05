"""Check desktop chatter interactions and capture the actual asymmetric layout.

Requires optional Python Playwright and a running Next server. No content writes.
"""
import argparse
import json
from pathlib import Path
from urllib.parse import unquote, urlparse

from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--url", default="http://127.0.0.1:3155")
parser.add_argument("--browser", help="Existing Chromium executable")
parser.add_argument("--output", default=".sync/tmp-chatter-55/desktop")
args = parser.parse_args()
output = Path(args.output)
output.mkdir(parents=True, exist_ok=True)
report = {"scope": "desktop", "layouts": [], "searches": [], "destinations": [], "errors": []}


def visit(page):
    response = page.goto(args.url.rstrip("/") + "/chatter", wait_until="networkidle", timeout=60000)
    assert response and response.ok
    page.wait_for_function("document.documentElement.classList.contains('splash-seen')")
    page.get_by_role("heading", name="杂谈", exact=True).wait_for()
    page.wait_for_timeout(300)


def wait_visible_covers(page):
    page.wait_for_function("""Array.from(document.querySelectorAll('main article img'))
      .filter(i => { const r = i.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; })
      .every(i => i.complete && i.naturalWidth > 0)""", timeout=30000)


def entries(page):
    return page.locator("main article").evaluate_all("""cards => cards.map(card => ({
      title: card.querySelector('h2').textContent,
      route: card.querySelector('a').getAttribute('href'), kind: card.dataset.kind
    }))""")


def assert_layout(page, width):
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "Page overflow"
    rects = page.locator("main article").evaluate_all("""cards => cards.map(c => {
      const a = c.querySelector('a'), r = a.getBoundingClientRect();
      const h = c.querySelector('h2'), t = h.getBoundingClientRect();
      return {x:r.x, y:r.y, right:r.right, bottom:r.bottom, height:r.height,
        clipped:h.scrollWidth > h.clientWidth + 1 || h.scrollHeight > h.clientHeight + 1,
        titleInside:t.top >= r.top - 1 && t.bottom <= r.bottom + 1 && t.left >= r.left && t.right <= r.right + 1};
    })""")
    assert all(r["x"] >= 0 and r["right"] <= width + 1 and not r["clipped"] and r["titleInside"] for r in rects), "Title or card overflow: " + json.dumps([r for r in rects if r["x"] < 0 or r["right"] > width + 1 or r["clipped"] or not r["titleInside"]])
    for i, left in enumerate(rects):
        for right in rects[i + 1:]:
            assert (left["right"] <= right["x"] + 1 or right["right"] <= left["x"] + 1
                    or left["bottom"] <= right["y"] + 1 or right["bottom"] <= left["y"] + 1), "Overlapping entries"
    firsts = {}
    for r in rects:
        firsts.setdefault(round(r["x"]), r)
    assert len(firsts) == 3
    assert len({round(r["y"]) for r in firsts.values()}) == 3, "Column starts became aligned"
    assert len({round(r["height"]) for r in firsts.values()}) > 1, "Lead images became equal-height"
    return [{"x": r["x"], "y": r["y"], "height": r["height"]} for r in firsts.values()]


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, **({"executable_path": args.browser} if args.browser else {}))
    context = browser.new_context(viewport={"width": 1440, "height": 1100})
    context.add_init_script("""
      localStorage.setItem('blog-theme', 'light');
      localStorage.setItem('blog-theme-override-until', String(Date.now()+86400000));
    """)
    page = context.new_page()
    page.on("pageerror", lambda error: report["errors"].append(str(error)))
    visit(page)
    assert page.locator("main").evaluate("el => getComputedStyle(el).backgroundColor") == "rgba(0, 0, 0, 0)"
    assert page.locator("main").evaluate("el => getComputedStyle(el, '::before').content") == "none"
    report["background"] = "existing site artwork, no page colour layer"
    original = entries(page)
    assert original and {e["kind"] for e in original} == {"note", "folder"}
    report["entryCount"] = len(original)
    search = page.get_by_role("searchbox", name="搜索杂谈")
    for query in [" ", "ai", " AI ", "数学", original[0]["title"], "不存在的思绪_55_no_result"]:
        search.fill(query)
        expected = [e for e in original if query.strip().lower() in e["title"].lower()]
        assert entries(page) == expected, f"Search mismatch: {query}"
        report["searches"].append({"query": query, "count": len(expected)})
    page.get_by_text("没有找到符合当前搜索的内容。", exact=True).wait_for()
    page.screenshot(path=str(output / "empty.jpg"), type="jpeg", quality=85)
    page.get_by_role("button", name="清空搜索，查看全部记录").click()
    assert entries(page) == original
    search.focus()
    page.keyboard.type("ai")
    page.keyboard.press("Tab")
    assert page.get_by_role("button", name="清空搜索", exact=True).evaluate("el => el === document.activeElement")
    page.keyboard.press("Enter")
    assert entries(page) == original

    for width in [1024, 1280, 1440, 1920]:
        page.set_viewport_size({"width": width, "height": 1100})
        page.wait_for_timeout(300)
        firsts = assert_layout(page, width)
        wait_visible_covers(page)
        page.mouse.move(0, 0)
        report["layouts"].append({"width": width, "leads": firsts})
        page.screenshot(path=str(output / f"desktop-{width}.jpg"), type="jpeg", quality=88)
    page.set_viewport_size({"width": 1440, "height": 1100})
    page.screenshot(path=str(output / "desktop.jpg"), type="jpeg", quality=88)
    for card in page.locator("main article").all():
        card.scroll_into_view_if_needed()
        page.wait_for_timeout(100)
    page.wait_for_timeout(1500)
    report["loadedImages"] = page.locator("main article img").evaluate_all("imgs => imgs.filter(i => i.complete && i.naturalWidth > 0).length")
    assert report["loadedImages"] > 0
    page.locator("main").evaluate("el => { for (let parent = el; parent; parent = parent.parentElement) parent.scrollTop = 0; window.scrollTo(0, 0); }")
    page.wait_for_timeout(150)
    page.evaluate("document.documentElement.classList.add('dark')")
    page.screenshot(path=str(output / "desktop-dark.jpg"), type="jpeg", quality=88)
    page.evaluate("document.documentElement.classList.remove('dark')")
    heading = page.locator("main article h2").first
    old_title = heading.text_content()
    heading.evaluate("el => el.textContent = '很长的标题与连续字符' + 'LongUnbrokenTitle'.repeat(12)")
    page.wait_for_timeout(150)
    assert_layout(page, 1440)
    heading.evaluate("(el, text) => el.textContent = text", old_title)
    for kind in ["note", "folder"]:
        target = next(e for e in original if e["kind"] == kind)
        page.locator(f'main article[data-kind="{kind}"] a').first.click()
        page.wait_for_url(lambda url: unquote(urlparse(url).path) == unquote(target["route"]))
        page.wait_for_load_state("networkidle")
        assert page.locator("h1").count() > 0
        report["destinations"].append(target)
        visit(page)

    failure = context.new_page()
    failure.route("**/_next/image?**", lambda route: route.abort())
    visit(failure)
    failure.get_by_text("封面暂缺 · 内容仍在").first.wait_for()
    assert entries(failure) == original
    failure.screenshot(path=str(output / "image-error.jpg"), type="jpeg", quality=85)
    failure.close()
    page.emulate_media(reduced_motion="reduce")
    visit(page)
    page.locator("main article a").first.hover()
    transitions = page.locator("main article img").first.evaluate("el => getComputedStyle(el).transitionDuration")
    assert all(float(value.strip().removesuffix("s")) <= 0.00001 for value in transitions.split(","))
    assert page.locator("main article img").first.evaluate("el => getComputedStyle(el).transform") == "none"
    report["reducedMotion"] = True
    (output / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    browser.close()
print(json.dumps(report, ensure_ascii=False, indent=2))
