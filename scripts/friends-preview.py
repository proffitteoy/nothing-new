"""Check the real /friends page and capture local acceptance evidence.

Requires Python Playwright and Chromium; see docs/project/friends-directory.md.
Only writes screenshots and a report under --output; no external forms are submitted.
"""

import argparse
import json
import subprocess
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError


ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--url", default="http://127.0.0.1:3158")
parser.add_argument("--browser", help="Optional installed Chromium executable")
parser.add_argument("--output", default=".sync/tmp-friends-evidence")
parser.add_argument("--capture-homepages", action="store_true", help="Refresh public homepage snapshots; writes public/friends-previews and its manifest")
args = parser.parse_args()
output = ROOT / args.output
output.mkdir(parents=True, exist_ok=True)
expected = json.loads(subprocess.check_output([
    "node", "--import", "tsx", "--input-type=module", "-e",
    "import {friendsData} from './data/friends.ts'; "
    "import {siteConfig} from './siteConfig.ts'; "
    "console.log(JSON.stringify({friends:friendsData,format:siteConfig.friendLinkApplyFormat,"
    "issue:siteConfig.friendLinkIssueUrl,avatar:siteConfig.avatarUrl}))",
], cwd=ROOT, text=True, encoding="utf-8"))
report = {"checks": [], "page_errors": [], "console_errors": []}

if args.capture_homepages:
    import asyncio
    from datetime import datetime, timezone
    from playwright.async_api import async_playwright

    async def capture_homepages():
        destination = ROOT / "public/friends-previews"
        destination.mkdir(parents=True, exist_ok=True)
        manifest = {"capturedAt": datetime.now(timezone.utc).isoformat(), "sites": []}
        limit = asyncio.Semaphore(3)
        async with async_playwright() as playwright:
            options = {"headless": True}
            if args.browser:
                options["executable_path"] = args.browser
            browser = await playwright.chromium.launch(**options)

            async def capture(friend):
                async with limit:
                    context = await browser.new_context(viewport={"width": 1200, "height": 900},
                                                        reduced_motion="reduce", device_scale_factor=1)
                    page = await context.new_page()
                    entry = {"id": friend["id"], "url": friend["url"]}
                    try:
                        response = await page.goto(friend["url"], wait_until="domcontentloaded", timeout=45000)
                        assert response and response.ok, f"HTTP {response.status if response else 'no response'}"
                        try:
                            await page.wait_for_load_state("networkidle", timeout=8000)
                        except PlaywrightTimeoutError:
                            pass
                        # Existing friend sites include client-side intros and deferred content.
                        await page.wait_for_timeout(10000)
                        title = await page.title()
                        assert not any(marker in title.lower() for marker in ["just a moment", "access denied", "error 403"]), title
                        await page.screenshot(path=str(destination / (friend["id"] + ".jpg")), type="jpeg", quality=72)
                        entry.update({"status": "captured", "title": title, "finalUrl": page.url})
                        print("CAPTURED " + friend["name"], flush=True)
                    except Exception as error:
                        entry.update({"status": "unavailable", "error": str(error)})
                        print("UNAVAILABLE " + friend["name"] + ": " + str(error)[:180], flush=True)
                    finally:
                        manifest["sites"].append(entry)
                        await context.close()

            await asyncio.gather(*(capture(friend) for friend in expected["friends"]))
            await browser.close()
        (destination / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
        return all(site["status"] == "captured" for site in manifest["sites"])

    raise SystemExit(0 if asyncio.run(capture_homepages()) else 1)


def passed(message):
    report["checks"].append(message)
    print("PASS " + message, flush=True)


def normalize_url(url):
    parsed = urlparse(url)
    return parsed._replace(netloc=parsed.netloc.lower()).geturl().rstrip("/")


def visit(context):
    page = context.new_page()
    page.on("pageerror", lambda error: report["page_errors"].append(str(error)))
    page.on("console", lambda message: report["console_errors"].append(message.text)
            if message.type == "error" else None)
    response = page.goto(args.url + "/friends", wait_until="domcontentloaded", timeout=60000)
    assert response and response.ok
    page.wait_for_function("document.documentElement.classList.contains('splash-seen')")
    page.get_by_role("heading", name="友链名录", exact=False).wait_for()
    try:
        page.wait_for_load_state("networkidle", timeout=15000)
    except PlaywrightTimeoutError:
        report.setdefault("notes", []).append("External assets did not reach network idle within 15s")
    return page


def screenshot(page, name):
    page.screenshot(path=str(output / name), type="jpeg", quality=85)


def check_copy(page):
    button = page.get_by_role("button", name="复制申请格式", exact=True)
    button.click()
    page.get_by_role("button", name="已复制", exact=True).wait_for()
    assert page.evaluate("navigator.clipboard.readText()").replace("\r\n", "\n") == expected["format"]
    page.evaluate("""window.originalClipboard = navigator.clipboard;
        Object.defineProperty(navigator, 'clipboard', {configurable: true, value: {
          writeText: () => new Promise(resolve => { window.finishCopy = resolve; })
        }});""")
    page.get_by_role("button", name="已复制", exact=True).click()
    pending = page.get_by_role("button", name="复制中…", exact=True)
    assert pending.is_disabled()
    assert "已复制" not in page.get_by_role("status").inner_text()
    page.evaluate("window.finishCopy()")
    page.get_by_role("button", name="已复制", exact=True).wait_for()
    for clipboard in ["{writeText: () => Promise.reject(new Error('denied'))}", "undefined"]:
        page.evaluate("Object.defineProperty(navigator, 'clipboard', {configurable: true, value: " + clipboard + "})")
        page.get_by_role("button", name="已复制" if "reject" in clipboard else "复制申请格式", exact=True).click()
        page.get_by_role("status").filter(has_text="请手动复制").wait_for()
        assert page.locator("#friend-apply-format").evaluate("el => el === document.activeElement && el.selectionStart === 0 && el.selectionEnd === el.value.length")
    page.evaluate("Object.defineProperty(navigator, 'clipboard', {configurable: true, value: window.originalClipboard})")
    passed("clipboard: real content, pending state, denied permission and missing API with manual selection")


def check_homepage_previews(browser):
    for width, theme in [(1440, "light"), (1440, "dark"), (390, "light"), (320, "dark")]:
        context = browser.new_context(viewport={"width": width, "height": 900 if width > 767 else 844},
                                      is_mobile=width < 768, has_touch=width < 768)
        context.add_init_script("localStorage.setItem('blog-theme', '" + theme + "');"
                                "localStorage.setItem('blog-theme-override-until', String(Date.now() + 86400000));")
        requests = []
        context.on("request", lambda request: requests.append(request.url) if "/friends-previews/" in request.url else None)
        page = visit(context)
        assert not requests, "Homepage snapshots must not load on initial navigation"
        rows = page.locator("main ol > li")
        dialog = page.locator("#friend-homepage-preview")
        if width > 767:
            rows.first.hover()
            page.wait_for_timeout(80)
            page.mouse.move(4, 100)
            page.wait_for_timeout(300)
            assert not requests, "Passing over a friend must not start its snapshot"
            rows.first.hover()
        else:
            rows.first.get_by_role("button").tap()
        dialog.wait_for()
        page.wait_for_function("el => {const img=el.querySelector('img');return img && img.complete && img.naturalWidth===1200}", arg=dialog.element_handle())
        assert len(requests) == 1
        bounds = dialog.bounding_box()
        card_bounds = rows.first.bounding_box()
        insets = [bounds["x"] - card_bounds["x"], bounds["y"] - card_bounds["y"],
                  card_bounds["x"] + card_bounds["width"] - bounds["x"] - bounds["width"],
                  card_bounds["y"] + card_bounds["height"] - bounds["y"] - bounds["height"]]
        assert all(1 <= inset <= 2 for inset in insets), "Preview must remain 1–2px inside its own card"
        assert dialog.get_by_role("link", name="打开网站", exact=False).get_attribute("href") == expected["friends"][0]["url"]
        screenshot(page, f"homepage-preview-{width}-{theme}.jpg")
        if width > 767:
            dialog.hover()
            page.wait_for_timeout(350)
            assert dialog.is_visible(), "Moving into the preview must keep it open"
        dialog.get_by_role("button", name="关闭首页预览").click()
        dialog.wait_for(state="detached")
        page.wait_for_timeout(300)
        assert dialog.count() == 0, "Returning focus after close must not reopen the window"
        if width > 767:
            rows.nth(1).locator("a").focus()
            dialog.wait_for()
            page.keyboard.press("ArrowDown")
            assert dialog.get_by_role("button", name="关闭首页预览").evaluate("el => el===document.activeElement")
            page.keyboard.press("Escape")
            dialog.wait_for(state="detached")
            assert rows.nth(1).locator("a").evaluate("el=>el===document.activeElement")
            page.wait_for_timeout(300)
            assert not dialog.count()
            rows.nth(1).get_by_role("button", name="预览", exact=False).focus()
            page.keyboard.press("Enter")
            dialog.wait_for()
            assert dialog.get_by_role("button", name="关闭首页预览").evaluate("el=>el===document.activeElement")
            page.mouse.click(4, 100)
            dialog.wait_for(state="detached")
            for row, friend in zip(rows.all(), expected["friends"]):
                row.hover()
                dialog.wait_for()
                page.wait_for_function("([el,id]) => {const img=el.querySelector('img');return img && decodeURIComponent(img.src).includes('/'+id+'.jpg') && img.complete && img.naturalWidth===1200}",
                                       arg=[dialog.element_handle(), friend["id"]])
                assert friend["name"] in dialog.inner_text()
                card_bounds = row.bounding_box()
                bounds = dialog.bounding_box()
                insets = [bounds["x"] - card_bounds["x"], bounds["y"] - card_bounds["y"],
                          card_bounds["x"] + card_bounds["width"] - bounds["x"] - bounds["width"],
                          card_bounds["y"] + card_bounds["height"] - bounds["y"] - bounds["height"]]
                assert all(1 <= inset <= 2 for inset in insets)
                page.mouse.move(4, 100)
                dialog.wait_for(state="detached")
            rows.last.hover()
            dialog.wait_for()
            page.set_viewport_size({"width": 1280, "height": 800})
            dialog.wait_for(state="detached")
        else:
            rows.nth(1).get_by_role("button").tap()
            dialog.wait_for()
            page.evaluate("window.scrollBy(0,100)")
            dialog.wait_for(state="detached")
        passed(f"homepage preview {width}px {theme}: lazy request, actual snapshot, 1–2px inset overlay, close, touch/keyboard and dismissal")
        context.close()

    context = browser.new_context(viewport={"width": 1440, "height": 900})
    pending = []
    context.route("**/friends-previews/**", lambda route: pending.append(route))
    page = visit(context)
    page.locator("main ol > li").first.hover()
    dialog = page.locator("#friend-homepage-preview")
    dialog.wait_for()
    dialog.get_by_role("status").filter(has_text="正在加载").wait_for()
    screenshot(page, "homepage-preview-loading.jpg")
    assert pending
    pending.pop().fulfill(status=503, content_type="text/plain", body="unavailable")
    dialog.get_by_role("status").filter(has_text="暂时无法加载").wait_for()
    screenshot(page, "homepage-preview-error.jpg")
    context.unroute("**/friends-previews/**")
    dialog.get_by_role("button", name="重试", exact=True).click()
    page.wait_for_function("el=>{const img=el.querySelector('img');return img.complete && img.naturalWidth===1200}", arg=dialog.element_handle())
    dialog.get_by_role("button", name="关闭首页预览").click()
    context.route("**/friends-previews/**", lambda route: pending.append(route))
    page.locator("main ol > li").nth(1).hover()
    dialog.wait_for()
    dialog.get_by_role("status").filter(has_text="暂时无法加载").wait_for(timeout=15000)
    for route in pending:
        route.abort()
    passed("homepage preview: loading, failed image, retry recovery and 12s timeout preserve the original link")
    context.close()


with sync_playwright() as playwright:
    launch = {"headless": True}
    if args.browser:
        launch["executable_path"] = args.browser
    browser = playwright.chromium.launch(**launch)
    check_homepage_previews(browser)
    for width, theme, reduced in [(1440, "light", "no-preference"), (1440, "dark", "reduce"),
                                  (960, "light", "reduce"), (768, "light", "reduce"),
                                  (390, "light", "no-preference"), (390, "dark", "reduce"),
                                  (320, "light", "reduce")]:
        context = browser.new_context(viewport={"width": width, "height": 900 if width > 767 else 844},
                                      is_mobile=width < 768, has_touch=width < 768,
                                      reduced_motion=reduced, permissions=["clipboard-read", "clipboard-write"])
        context.add_init_script("localStorage.setItem('blog-theme', '" + theme + "');"
                                "localStorage.setItem('blog-theme-override-until', String(Date.now() + 86400000));")
        page = visit(context)
        links = page.locator("main ol > li > a")
        assert links.count() == len(expected["friends"])
        for link, friend in zip(links.all(), expected["friends"]):
            assert link.get_attribute("href") == friend["url"]
            assert link.get_attribute("target") == "_blank"
            assert set(link.get_attribute("rel").split()) >= {"noopener", "noreferrer"}
            assert link.locator("h3").inner_text() == friend["name"]
            assert link.locator("p").inner_text() == friend["description"]
            bounds = link.bounding_box()
            assert bounds["x"] >= 0 and bounds["x"] + bounds["width"] <= width
        assert page.locator("#friend-apply-format").input_value() == expected["format"]
        assert page.locator("main").evaluate("el => el.scrollWidth <= el.clientWidth")
        assert page.locator("#friend-apply-format").evaluate("el => el.scrollWidth <= el.clientWidth")
        columns = page.locator("main ol").evaluate("el => getComputedStyle(el).gridTemplateColumns.split(' ').length")
        assert columns == (1 if width < 768 else 2 if width < 1100 else 3)
        screenshot(page, f"{'desktop' if width > 767 else 'mobile'}-{width}-{theme}.jpg")
        links.first.focus()
        assert links.first.evaluate("el => getComputedStyle(el).outlineStyle == 'solid'")
        if reduced == "reduce":
            assert links.first.evaluate("el => parseFloat(getComputedStyle(el).transitionDuration) <= 0.00001")
        page.keyboard.press("Escape")
        page.keyboard.press("Tab")
        assert page.locator("main ol > li").first.get_by_role("button", name="预览", exact=False).evaluate("el => el === document.activeElement")
        page.keyboard.press("Tab")
        assert links.nth(1).evaluate("el => el === document.activeElement")
        page.get_by_role("link", name="交换友链", exact=True).click()
        page.wait_for_timeout(250)
        application_top = page.locator("#friend-application").bounding_box()["y"]
        assert application_top >= (72 if width > 767 else 0)
        assert application_top < page.viewport_size["height"] - 200
        if width in (1440, 390) and theme == "light":
            screenshot(page, f"application-{'desktop' if width > 767 else 'mobile'}.jpg")
            check_copy(page)
        if width == 1440 and theme == "light":
            # Fulfil only popup navigations. This checks each actual anchor without
            # submitting anything or depending on availability of third-party sites.
            destinations = {normalize_url(friend["url"]) for friend in expected["friends"]} | {normalize_url(expected["issue"])}
            context.route("**/*", lambda route: route.fulfill(status=200, content_type="text/html", body="<title>Link target</title>")
                          if route.request.is_navigation_request() and normalize_url(route.request.url) in destinations
                          else route.continue_())
            for link in links.all() + [page.get_by_role("link", name="提交友链申请", exact=False)]:
                target = link.get_attribute("href")
                with page.expect_popup() as popup_info:
                    link.click()
                popup = popup_info.value
                popup.wait_for_load_state("domcontentloaded")
                assert normalize_url(popup.url) == normalize_url(target)
                popup.close()
            passed("all 16 friend anchors and GitHub application open the configured URLs in new tabs")
            assert page.locator('nav[aria-label="主导航"] [aria-current="page"]').inner_text() == "友链"
        if width == 390:
            page.get_by_role("button", name="打开导航", exact=True).click()
            dialog = page.get_by_role("dialog", name="移动导航")
            dialog.wait_for()
            assert dialog.locator('[aria-current="page"]').inner_text() == "友链"
            page.keyboard.press("Escape")
            dialog.wait_for(state="hidden")
        passed(f"{width}px {theme}: all data, columns, no horizontal overflow, keyboard focus, application anchor, reduced motion={reduced}")
        context.close()

    for text_fallback in [False, True]:
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        context.route("**/*", lambda route: route.abort()
                      if route.request.resource_type == "image" and
                      (urlparse(route.request.url).netloc != urlparse(args.url).netloc or
                       (text_fallback and urlparse(route.request.url).path in [expected["avatar"], "/avatar.jpg"]))
                      else route.continue_())
        page = visit(context)
        links = page.locator("main ol > li > a")
        for link in links.all():
            link.scroll_into_view_if_needed()
            if text_fallback:
                link.locator("img").wait_for(state="detached")
                assert link.locator("span[aria-hidden=true]").first.inner_text().strip()
            else:
                page.wait_for_function("el => { const img = el.querySelector('img'); return img && img.getAttribute('src') === '" + expected["avatar"] + "' && img.complete && img.naturalWidth > 0 }", arg=link.element_handle())
        screenshot(page, "avatar-text-fallback.jpg" if text_fallback else "avatar-site-fallback.jpg")
        passed("all 16 avatars: " + ("text fallback when both sources fail" if text_fallback else "site avatar fallback when external sources fail"))
        context.close()
    browser.close()

report["page_errors"] = sorted(set(report["page_errors"]))
report["console_errors"] = sorted(set(report["console_errors"]))
(output / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
assert not report["page_errors"], report["page_errors"]
print(f"Evidence: {output}", flush=True)
