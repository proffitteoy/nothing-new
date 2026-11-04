"""Capture the eight existing pages without mocking their data or changing routes.

Requires Python Playwright; see docs/project/navigation-renewal.md.
"""

import argparse
import math
from pathlib import Path
from urllib.parse import unquote, urlparse

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--url", default="http://127.0.0.1:3100")
parser.add_argument("--stage", choices=["before", "after"], required=True)
parser.add_argument("--browser", help="Optional existing Chromium executable")
parser.add_argument("--check-only", action="store_true", help="Check navigation interactions instead of all-page captures")
args = parser.parse_args()
output = Path(__file__).resolve().parents[1] / "docs/images/navigation-renewal" / args.stage
output.mkdir(parents=True, exist_ok=True)
routes = ["/", "/projects", "/music", "/anime", "/chatter", "/blog", "/friends", "/about"]
names = ["首页", "项目", "音乐", "番剧", "杂谈", "笔记", "友链", "关于"]


def visit(page, route):
    response = page.goto(args.url + route, wait_until="domcontentloaded", timeout=60000)
    assert response and response.ok, f"{route}: {response.status if response else 'no response'}"
    page.wait_for_function("document.documentElement.classList.contains('splash-seen')")


def theme_script(theme):
    return f"""
        localStorage.setItem('blog-theme', '{theme}');
        localStorage.setItem('blog-theme-override-until', String(Date.now() + 86400000));
    """


def check_navigation(browser):
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    context.add_init_script(theme_script("light"))
    page = context.new_page()
    visit(page, "/about")
    nav = page.get_by_role("navigation", name="主导航", exact=True)
    assert nav.get_by_role("link").all_text_contents() == names
    hrefs = nav.get_by_role("link").evaluate_all("links => links.map(a => a.getAttribute('href'))")
    assert hrefs[:5] == routes[:5] and hrefs[5].startswith("/blog") and hrefs[6:] == routes[6:]
    for width in [768, 960, 1280, 1440]:
        page.set_viewport_size({"width": width, "height": 900})
        bounds = [link.bounding_box() for link in nav.get_by_role("link").all()]
        assert all(b and b["x"] >= 0 and b["x"] + b["width"] <= width and b["height"] >= 44 for b in bounds)
        assert len({round(b["y"]) for b in bounds}) == 1
        brand = page.locator("header > div > a").bounding_box()
        assert brand["x"] + brand["width"] < bounds[0]["x"], "Brand overlaps navigation"
        page.screenshot(path=str(output / f"navigation-desktop-{width}.jpg"), type="jpeg", quality=85,
                        clip={"x": 0, "y": 0, "width": width, "height": 88})
    for name, href in zip(names, hrefs):
        nav.get_by_role("link", name=name, exact=True).click()
        page.wait_for_url(lambda url: unquote(urlparse(url).path) == unquote(href), timeout=30000)
        assert nav.locator('[aria-current="page"]').all_text_contents() == [name]
    nav.get_by_role("link", name="首页", exact=True).focus()
    page.keyboard.press("Tab")
    assert nav.get_by_role("link", name="项目", exact=True).evaluate("a => a === document.activeElement")
    page.keyboard.press("Enter")
    page.wait_for_url("**/projects")
    page.set_viewport_size({"width": 1440, "height": 900})
    page.evaluate("document.documentElement.classList.add('dark')")
    page.screenshot(path=str(output / "navigation-desktop-dark.jpg"), type="jpeg", quality=85,
                    clip={"x": 0, "y": 0, "width": 1440, "height": 88})
    context.close()
    print("PASS desktop: 768/960/1280/1440, eight destinations, current section, keyboard, dark theme", flush=True)

    for width, theme, reduced in [(320, "light", "reduce"), (390, "light", "no-preference"), (390, "dark", "reduce")]:
        context = browser.new_context(viewport={"width": width, "height": 844}, has_touch=True,
                                      is_mobile=True, reduced_motion=reduced)
        context.add_init_script(theme_script(theme))
        page = context.new_page()
        visit(page, "/about")
        trigger = page.get_by_role("button", name="打开导航", exact=True)
        dialog = page.get_by_role("dialog", name="移动导航")

        def open_menu():
            trigger.tap()
            dialog.wait_for(state="visible")
            page.wait_for_timeout(400)

        open_menu()
        bounds = dialog.bounding_box()
        assert bounds["x"] >= 8 and bounds["x"] + bounds["width"] <= width - 8
        for link in dialog.get_by_role("link").all():
            b = link.bounding_box()
            assert b["x"] >= 0 and b["x"] + b["width"] <= width and b["width"] >= 44 and b["height"] >= 44
        assert dialog.get_by_role("link").all_text_contents() == names
        assert dialog.locator('[aria-current="page"]').all_text_contents() == ["关于"]
        assert dialog.get_by_role("button", name="关闭导航").evaluate("b => b === document.activeElement")
        page.screenshot(path=str(output / f"navigation-mobile-{width}-{theme}.jpg"), type="jpeg", quality=85)
        page.keyboard.press("Shift+Tab")
        assert dialog.get_by_role("link", name="关于").evaluate("a => a === document.activeElement")
        page.keyboard.press("Tab")
        assert dialog.get_by_role("button", name="关闭导航").evaluate("b => b === document.activeElement")
        page.keyboard.press("Escape")
        dialog.wait_for(state="hidden")
        assert trigger.evaluate("b => b === document.activeElement")
        assert page.evaluate("document.body.style.overflow") != "hidden"
        open_menu()
        page.touchscreen.tap(10, 100)
        dialog.wait_for(state="hidden")
        open_menu()
        dialog.get_by_role("button", name="关闭导航").tap()
        dialog.wait_for(state="hidden")

        # Real touch events exercise Framer Motion's drag/pan recognition.
        cdp = context.new_cdp_session(page)
        b = trigger.bounding_box()
        x, y = b["x"] + b["width"] / 2, b["y"] + b["height"] / 2
        cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x, "y": y}]})
        for offset in range(10, 101, 10):
            cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": x, "y": y + offset}]})
            page.wait_for_timeout(16)
        cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
        page.wait_for_timeout(100)
        assert trigger.bounding_box()["y"] > b["y"] + 60
        assert trigger.get_attribute("aria-expanded") == "false", "Dragging opened the menu"

        open_menu()
        wheel = dialog.locator("div").first
        b = wheel.bounding_box()
        cx, cy, radius = b["x"] + b["width"] / 2, b["y"] + b["height"] / 2, b["width"] * 0.35
        original_url = page.url
        cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": cx, "y": cy - radius}]})
        for step in range(1, 21):
            angle = -math.pi / 2 + step * math.pi / 40
            cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": cx + radius * math.cos(angle), "y": cy + radius * math.sin(angle)}]})
            page.wait_for_timeout(16)
        cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
        page.wait_for_timeout(450)
        assert dialog.is_visible() and page.url == original_url, "Rotating accidentally navigated"
        assert wheel.evaluate("el => getComputedStyle(el).transform") != "none"
        dialog.get_by_role("link", name="友链", exact=True).tap()
        page.wait_for_url("**/friends")
        dialog.wait_for(state="hidden")
        for name, href in zip(names, hrefs):
            open_menu()
            dialog.get_by_role("link", name=name, exact=True).tap()
            page.wait_for_url(lambda url: unquote(urlparse(url).path) == unquote(href), timeout=30000)
            dialog.wait_for(state="hidden")
        page.go_back()
        page.wait_for_url("**/friends")
        assert not dialog.is_visible()
        open_menu()
        page.set_viewport_size({"width": 1280, "height": 900})
        dialog.wait_for(state="hidden")
        assert page.evaluate("document.body.style.overflow") != "hidden"
        context.close()
        print(f"PASS mobile {width}/{theme}/{reduced}: bounds, focus, close, touch drag/rotate, eight links, back, resize", flush=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=args.browser)
    if args.check_only:
        check_navigation(browser)
    for label, width, height in ([] if args.check_only else [("desktop", 1440, 900), ("mobile", 390, 844)]):
        context = browser.new_context(viewport={"width": width, "height": height},
                                      reduced_motion="reduce", device_scale_factor=1)
        context.add_init_script(theme_script("light"))
        page = context.new_page()
        for route in routes:
            response = page.goto(args.url + route, wait_until="domcontentloaded", timeout=60000)
            assert response and response.ok, f"{route}: {response.status if response else 'no response'}"
            page.wait_for_function("document.documentElement.classList.contains('splash-seen')")
            try:
                page.wait_for_load_state("networkidle", timeout=10000)
            except PlaywrightTimeoutError:
                # Live music/cover providers can remain busy; do not replace their data.
                pass
            page.wait_for_timeout(700)
            name = "home" if route == "/" else route[1:]
            page.screenshot(path=str(output / f"{name}-{label}.jpg"), type="jpeg", quality=75)
            print(f"Captured {args.stage}/{name}-{label}", flush=True)
        if label == "mobile":
            page.get_by_role("button", name="打开导航", exact=True).click()
            page.get_by_role("dialog", name="移动导航").wait_for()
            page.wait_for_timeout(600)
            page.screenshot(path=str(output / "navigation-mobile.jpg"), type="jpeg", quality=85)
        context.close()
    browser.close()
