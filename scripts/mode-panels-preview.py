"""Capture and check the two home mode panels against the real local application.

Requires Python Playwright. Screenshots and reports stay in ignored .sync/tmp-*.
"""

import argparse
from datetime import datetime
import json
from pathlib import Path

from playwright.sync_api import sync_playwright, expect


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--url", default="http://127.0.0.1:3102")
parser.add_argument("--stage", choices=["before", "after"], required=True)
parser.add_argument("--output", default=".sync/tmp-mode-panels")
parser.add_argument("--checks-only", action="store_true", help="Skip the viewport captures when repeating functional checks")
parser.add_argument("--browser", help="Optional existing Chromium executable")
args = parser.parse_args()
output = Path(args.output).resolve() / args.stage
output.mkdir(parents=True, exist_ok=True)
results = []


def visit(page):
    response = page.goto(args.url, wait_until="domcontentloaded", timeout=60000)
    assert response and response.ok
    skip = page.get_by_role("button", name="跳过")
    if skip.is_visible():
        skip.click()
    page.wait_for_function("document.documentElement.classList.contains('splash-seen')")
    page.wait_for_load_state("networkidle")
    return page.get_by_role("region", name="主题与论文周报")


def buttons(page):
    return (page.get_by_role("button", name="昼夜交替"),
            page.get_by_role("button", name="性能交替"))


def set_modes(page, dark, field):
    theme, performance = buttons(page)
    for button, state in [(theme, dark), (performance, field)]:
        if button.get_attribute("aria-pressed") != str(state).lower():
            button.click()
        expect(button).to_have_attribute("aria-pressed", str(state).lower())
    page.wait_for_timeout(1100)


def capture(page, section, name):
    section.scroll_into_view_if_needed()
    section.screenshot(path=str(output / f"{name}.jpg"), type="jpeg", quality=90)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, **({"executable_path": args.browser} if args.browser else {}))
    context = browser.new_context(viewport={"width": 1440, "height": 1000}, timezone_id="Asia/Shanghai")
    context.add_init_script("""if (!localStorage.getItem('blog-theme')) {
        localStorage.setItem('blog-theme', 'light');
        localStorage.setItem('blog-theme-override-until', String(Date.now() + 86400000));
    }""")
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    section = visit(page)
    for width in ([] if args.checks_only else [1440, 1280, 1024, 768, 640, 390, 320]):
        page.set_viewport_size({"width": width, "height": 1000})
        for dark, field in [(False, False), (False, True), (True, False), (True, True)]:
            set_modes(page, dark, field)
            capture(page, section, f"home-{width}-{'night' if dark else 'day'}-{'field' if field else 'normal'}")
            if args.stage == "after":
                assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), f"Overflow at {width}"
                for button in buttons(page):
                    b = button.bounding_box()
                    assert b and b["width"] >= 44 and b["height"] >= 44
                    for label in button.locator("[data-panel-copy] > span").all():
                        assert label.evaluate("el => el.scrollWidth <= el.clientWidth"), f"Truncated text at {width}"
                    assert button.locator('svg[aria-hidden="true"]').count() == 1
                if width >= 1024:
                    assert buttons(page)[0].bounding_box()["height"] < 180, "Panel exceeds desktop height budget"
        print(f"PASS {args.stage} captures: {width}px, four combinations", flush=True)
    if args.stage == "after":
        page.set_viewport_size({"width": 1440, "height": 1000})
        set_modes(page, False, False)
        theme, performance = buttons(page)
        initial_surface = performance.evaluate("el => getComputedStyle(el).backgroundColor")
        performance.click()
        expect(theme).to_have_attribute("aria-pressed", "false")
        page.wait_for_timeout(500)
        assert performance.evaluate("el => getComputedStyle(el).backgroundColor") == initial_surface
        page.reload()
        visit(page)
        expect(buttons(page)[1]).to_have_attribute("aria-pressed", "true")
        expect(buttons(page)[0]).to_have_attribute("aria-pressed", "false")
        other = context.new_page()
        visit(other)
        buttons(other)[1].click()
        expect(buttons(page)[1]).to_have_attribute("aria-pressed", "false")
        page.evaluate("localStorage.setItem('blog-performance-mode', 'field'); window.dispatchEvent(new Event('field-mode-change'))")
        expect(buttons(page)[1]).to_have_attribute("aria-pressed", "true")
        other.close()
        theme.focus()
        page.keyboard.press("Enter")
        expect(theme).to_have_attribute("aria-pressed", "true")
        page.keyboard.press("Tab")
        assert performance.evaluate("el => el === document.activeElement")
        assert performance.evaluate("el => getComputedStyle(el).outlineStyle") != "none"
        page.keyboard.press("Space")
        expect(performance).to_have_attribute("aria-pressed", "false")
        for _ in range(6):
            theme.click()
        expect(theme).to_have_attribute("aria-pressed", "true")
        page.emulate_media(reduced_motion="reduce")
        set_modes(page, False, False)
        assert theme.locator("svg").evaluate("el => el.getAnimations({subtree: true}).every(a => a.playState !== 'running')")
        assert performance.locator("svg").evaluate("el => el.getAnimations({subtree: true}).every(a => a.playState !== 'running')")
        capture(page, section, "reduced-motion-day")
        set_modes(page, True, True)
        capture(page, section, "reduced-motion-night")
        assert page.locator("canvas").count() == 0, "Home unexpectedly mounts a scene"
        results.append("mouse, keyboard, rapid toggles, independent surfaces, refresh, cross-tab, custom event, reduced motion, no home canvas")
        print("PASS mouse/keyboard/persistence/reduced-motion", flush=True)
        page.goto(args.url + "/music", wait_until="networkidle", timeout=60000)
        page.wait_for_function("document.documentElement.dataset.performanceMode === 'field'")
        assert page.locator("canvas").count() >= 4
        page.evaluate("localStorage.setItem('blog-performance-mode', 'normal'); window.dispatchEvent(new Event('field-mode-change'))")
        page.wait_for_function("document.documentElement.dataset.performanceMode === 'normal'")
        page.goto(args.url + "/", wait_until="networkidle", timeout=60000)
        expect(buttons(page)[1]).to_have_attribute("aria-pressed", "false")
        assert page.locator("canvas").count() == 0
        results.append("music adopts field/normal; renderer releases on home")
    context.close()
    if args.stage == "after":
        print("PASS music adopts both modes and releases renderer", flush=True)
        touch = browser.new_context(viewport={"width": 390, "height": 844}, has_touch=True,
                                    is_mobile=True, reduced_motion="reduce", timezone_id="Asia/Shanghai")
        mobile = touch.new_page()
        mobile_section = visit(mobile)
        set_modes(mobile, False, False)
        buttons(mobile)[0].tap()
        expect(buttons(mobile)[0]).to_have_attribute("aria-pressed", "true")
        buttons(mobile)[1].tap()
        expect(buttons(mobile)[1]).to_have_attribute("aria-pressed", "true")
        capture(mobile, mobile_section, "touch-390-night-field")
        touch.close()
        results.append("real touchscreen taps toggle both native buttons")

        print("PASS real touch", flush=True)
        timed = browser.new_context(viewport={"width": 1440, "height": 1000}, timezone_id="Asia/Shanghai")
        clock_page = timed.new_page()
        clock_page.clock.install(time=datetime.fromisoformat("2026-11-05T05:50:00+08:00"))
        visit(clock_page)
        print("Clock page ready", flush=True)
        expect(buttons(clock_page)[0]).to_have_attribute("aria-pressed", "true")
        def advance_to(iso):
            target = int(datetime.fromisoformat(iso).timestamp() * 1000)
            clock_page.clock.fast_forward(target - clock_page.evaluate("Date.now()"))
        print("Checking 06:00 boundary", flush=True)
        advance_to("2026-11-05T06:00:00.200+08:00")
        expect(buttons(clock_page)[0]).to_have_attribute("aria-pressed", "false")
        buttons(clock_page)[0].click()
        clock_page.reload()
        visit(clock_page)
        expect(buttons(clock_page)[0]).to_have_attribute("aria-pressed", "true")
        buttons(clock_page)[0].click()
        expect(buttons(clock_page)[0]).to_have_attribute("aria-pressed", "false")
        print("Checking 18:00 override expiry", flush=True)
        advance_to("2026-11-05T18:00:00.200+08:00")
        expect(buttons(clock_page)[0]).to_have_attribute("aria-pressed", "true")
        assert clock_page.evaluate("localStorage.getItem('blog-theme-override-until')") is None
        timed.close()
        results.append("06:00/18:00 automatic boundaries; manual override survives reload and expires at boundary")
    browser.close()
    (output / "report.json").write_text(json.dumps({"checks": results, "pageErrors": errors}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"checks": results, "pageErrors": errors}, ensure_ascii=False), flush=True)
