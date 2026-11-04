"""Capture and check the real homepage profile. See docs/project/profile-renewal.md."""

import argparse
import json
import re
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import expect, sync_playwright, TimeoutError as PlaywrightTimeoutError


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--url", default="http://127.0.0.1:3147")
parser.add_argument("--stage", choices=["before", "after"], required=True)
parser.add_argument("--output", required=True, type=Path, help="Local acceptance directory, outside Git")
parser.add_argument("--browser", help="Optional existing Chromium executable")
parser.add_argument("--check-only", action="store_true", help="Run interaction and failure checks without captures")
args = parser.parse_args()
output = args.output.resolve() / args.stage
output.mkdir(parents=True, exist_ok=True)
root = Path(__file__).resolve().parents[1]
config = (root / "siteConfig.ts").read_text(encoding="utf-8")
settings = {key: re.search(rf'{key}: "([^"]*)"', config).group(1)
            for key in ["authorName", "bio", "github", "email", "qq", "wechat"]}
routes = json.loads((root / ".quartz-cache/next/manifest.json").read_text(encoding="utf-8"))["artifacts"]
expected_counts = [str(sum(route.startswith(prefix) for route in routes)) for prefix in ["/blog/", "/chatter/"]]
expected_counts.append(str(len(re.findall(r'"\d+"', re.search(r'cloudMusicIds: \[(.*?)\]', config, re.S).group(1)))))
messages = []


def new_context(browser, theme="light", width=1440, reduced="reduce", touch=False):
    context = browser.new_context(viewport={"width": width, "height": 900 if width >= 768 else 844},
                                  reduced_motion=reduced, has_touch=touch)
    origin = urlsplit(args.url)
    context.add_init_script(f"""
        if (location.origin === {json.dumps(origin.scheme + '://' + origin.netloc)}) {{
            localStorage.setItem('blog-theme', '{theme}');
            localStorage.setItem('blog-theme-override-until', String(Date.now() + 86400000));
        }}
    """)
    context.on("page", lambda page: page.on("pageerror", lambda error: messages.append({"url": page.url, "message": str(error)})))
    return context


def visit(page):
    response = page.goto(args.url, wait_until="domcontentloaded", timeout=60000)
    assert response and response.ok
    page.wait_for_function("document.documentElement.classList.contains('splash-seen')")
    try:
        page.wait_for_load_state("networkidle", timeout=10000)
    except PlaywrightTimeoutError:
        # The unchanged music and anime providers may keep the real page busy.
        pass
    page.wait_for_timeout(400)


def check_layout(page, width):
    profile = page.get_by_role("region", name="个人介绍", exact=True)
    assert profile.get_attribute("data-field-obstacle") is not None
    assert profile.locator("h1").inner_text() == settings["authorName"]
    assert profile.locator("p").nth(0).inner_text() == "PERSONAL JOURNAL / 00"
    assert profile.locator("p").nth(1).inner_text() == settings["bio"]
    assert profile.locator("dt").all_text_contents() == ["笔记", "杂谈", "音乐", "番剧"]
    assert profile.locator("dd").all_text_contents()[:3] == expected_counts
    assert profile.locator("a button, a a, [role=button]").count() == 0
    assert profile.locator("button").count() == 3
    assert profile.locator('a[href="/about"]').count() == 1
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    bounds = profile.bounding_box()
    assert bounds["x"] >= 0 and bounds["x"] + bounds["width"] <= width
    for element in profile.locator("h1, img, p, dt, dd, button").all():
        box = element.bounding_box()
        assert box and box["x"] >= bounds["x"] - 1
        assert box["x"] + box["width"] <= bounds["x"] + bounds["width"] + 1
        assert element.evaluate("""el => {
            const style = getComputedStyle(el);
            return (el.scrollWidth <= el.clientWidth + 1 || style.overflowX === 'visible') &&
                   (el.scrollHeight <= el.clientHeight + 1 || style.overflowY === 'visible');
        }"""), f"Clipped content: {element.evaluate('el => el.outerHTML')}"
    name, avatar = [profile.locator(selector).bounding_box() for selector in ["h1", "img"]]
    assert name["x"] + name["width"] < avatar["x"]
    assert avatar["width"] == avatar["height"]
    for control in profile.locator('button, a[target="_blank"]').all():
        box = control.bounding_box()
        assert box["width"] >= 44 and box["height"] >= 44
    if width >= 1024:
        player = profile.locator("xpath=../following-sibling::div").bounding_box()
        assert bounds["x"] + bounds["width"] < player["x"]


def check_interactions(browser):
    for width, theme, reduced in [(1440, "light", "reduce"), (390, "dark", "no-preference")]:
        context = new_context(browser, theme, width, reduced, touch=width < 768)
        context.grant_permissions(["clipboard-read", "clipboard-write"], origin=args.url)
        context.route(settings["github"], lambda route: route.fulfill(body="GitHub destination check"))
        page = context.new_page()
        visit(page)
        profile = page.get_by_role("region", name="个人介绍", exact=True)
        check_layout(page, width)
        link = profile.locator('a[href="/about"]')
        link.focus()
        page.keyboard.press("Tab")
        github = profile.get_by_role("link", name="在新窗口打开 GitHub")
        assert github.evaluate("el => el === document.activeElement")
        assert github.evaluate("el => getComputedStyle(el).outlineStyle") == "solid"
        assert github.get_attribute("rel") == "noopener noreferrer"
        with page.expect_popup() as popup:
            page.keyboard.press("Enter")
        popup.value.wait_for_load_state()
        assert popup.value.url == settings["github"]
        popup.value.close()
        for label, key, activation in [("复制邮箱", "email", "Space"), ("复制 QQ 号", "qq", "Enter"), ("复制微信号", "wechat", "tap")]:
            button = profile.get_by_role("button", name=label, exact=True)
            if activation == "tap" and width < 768:
                button.tap()
            else:
                button.focus()
                page.keyboard.press("Space" if activation == "tap" else activation)
            page.get_by_text(f"已复制到剪贴板: {settings[key]}", exact=False).wait_for()
            assert page.evaluate("navigator.clipboard.readText()") == settings[key]
            assert page.url.rstrip("/") == args.url.rstrip("/")
        page.evaluate("""Object.defineProperty(navigator.clipboard, 'writeText', {
            configurable: true, value: () => Promise.reject(new Error('Clipboard denied for regression'))
        })""")
        profile.get_by_role("button", name="复制邮箱", exact=True).click()
        page.get_by_text("邮箱复制失败，请稍后重试", exact=True).wait_for()
        assert page.get_by_text("已复制到剪贴板", exact=False).count() == 0
        page.evaluate("Object.defineProperty(navigator, 'clipboard', {configurable: true, value: undefined})")
        profile.get_by_role("button", name="复制 QQ 号", exact=True).click()
        page.get_by_text("QQ号复制失败，请稍后重试", exact=True).wait_for()
        if reduced == "reduce":
            assert github.evaluate("el => getComputedStyle(el).transitionProperty") == "none"
            assert profile.locator("h1").evaluate("el => getComputedStyle(el).transitionProperty") == "none"
        bio = profile.locator("p").nth(1)
        bio.evaluate("el => el.textContent = el.textContent.repeat(6)")
        assert bio.evaluate("el => el.scrollHeight <= el.clientHeight + 1")
        assert profile.locator("dl").bounding_box()["y"] >= bio.bounding_box()["y"] + bio.bounding_box()["height"]
        for selector in ["img", "h1", "p"]:
            profile.locator(selector).first.click()
            page.wait_for_url("**/about")
            page.go_back(wait_until="domcontentloaded")
            profile.wait_for()
        link.focus()
        page.keyboard.press("Enter")
        page.wait_for_url("**/about")
        context.close()
        print(f"PASS interactions {width}/{theme}/{reduced}: links, native clipboard, errors, focus, touch, long bio", flush=True)

    # Fixtures are restricted to regression checks; all acceptance screenshots use real data.
    context = new_context(browser)
    pending = []
    context.route("**/anime/latest.json", lambda route: pending.append(route))
    context.route("**/anime/profile-check.json", lambda route: route.fulfill(json={
        "version": 1, "username": "profile-check", "items": [{}, {}, {}]
    }))
    page = context.new_page()
    page.goto(args.url, wait_until="domcontentloaded")
    count = page.get_by_role("region", name="个人介绍").locator("dd").last
    count.wait_for(state="attached")
    assert count.inner_text() == "—"
    for _ in range(50):
        if pending:
            break
        page.wait_for_timeout(100)
    assert pending, "Snapshot request did not start"
    pending[0].fulfill(json={"snapshot": "/anime/profile-check.json"})
    expect(count).to_have_text("3")
    context.close()

    context = new_context(browser, width=320)
    context.route("**/anime/latest.json", lambda route: route.fulfill(status=503, body="unavailable"))
    context.route("**/api/anime", lambda route: route.fulfill(status=503, body="unavailable"))
    context.route("**/_next/image*", lambda route: route.abort() if "url=%2Favatar" in route.request.url else route.continue_())
    page = context.new_page()
    visit(page)
    profile = page.get_by_role("region", name="个人介绍")
    assert profile.locator("dd").last.inner_text() == "—"
    assert profile.locator("img").evaluate("el => el.complete && el.naturalWidth === 0")
    check_layout(page, 320)
    context.close()
    print("PASS failures: anime pending/success/failure and missing avatar", flush=True)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=args.browser)
    for theme in ([] if args.check_only else ["light", "dark"]):
        context = new_context(browser, theme)
        page = context.new_page()
        visit(page)
        for width in [1440, 1280, 768, 390, 320]:
            page.set_viewport_size({"width": width, "height": 900 if width >= 768 else 844})
            page.wait_for_timeout(300)
            if args.stage == "after":
                check_layout(page, width)
            page.screenshot(path=str(output / f"home-{width}-{theme}.jpg"), type="jpeg", quality=85)
            profile = page.locator('[data-field-obstacle]').filter(has=page.locator('h1')).first
            profile.screenshot(path=str(output / f"profile-{width}-{theme}.png"))
            print(f"PASS capture {args.stage}/{width}/{theme}", flush=True)
        context.close()
    if args.stage == "after":
        check_interactions(browser)
    browser.close()
    (output / "browser-errors.json").write_text(json.dumps(messages, ensure_ascii=False, indent=2), encoding="utf-8")
