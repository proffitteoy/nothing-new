"""Check #47's profile removal and isolated contact actions; no edge geometry is simulated."""

import argparse
import json
import re
import subprocess
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import expect, sync_playwright, TimeoutError as PlaywrightTimeoutError

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--url", default="http://127.0.0.1:3147")
parser.add_argument("--output", required=True, type=Path, help="Local acceptance output, outside Git")
parser.add_argument("--browser", help="Existing Chromium executable")
parser.add_argument("--serve-actions", action="store_true", help="Serve only the isolated component fixture until Ctrl+C")
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
output = args.output.resolve()
output.mkdir(parents=True, exist_ok=True)
fixture = output / "actions-fixture"
fixture.mkdir(exist_ok=True)
config = (root / "siteConfig.ts").read_text(encoding="utf-8")
settings = {key: re.search(rf'{key}: "([^"]*)"', config).group(1)
            for key in ["bio", "github", "email", "qq", "wechat"]}
entry = """
import React from 'react';
import { createRoot } from 'react-dom/client';
import ProfileActions from './components/ProfileActions';
import { ToastProvider } from './components/ToastProvider';
createRoot(document.getElementById('fixture-root')).render(
  <ToastProvider><ProfileActions /></ToastProvider>
);
"""
options = {"stdin": {"contents": entry, "resolveDir": str(root), "loader": "tsx"},
           "bundle": True, "format": "iife", "jsx": "automatic", "minify": True,
           "outfile": str(fixture / "actions.js"), "loader": {".css": "local-css"}}
subprocess.run(["node", "--input-type=module", "-e",
                "import { build } from 'esbuild'; await build(" + json.dumps(options) + ");"],
               cwd=root, check=True)
(fixture / "index.html").write_text("""<!doctype html><html lang="zh-CN"><meta charset="utf-8">
<title>#47 独立联系操作功能夹具</title><link rel="stylesheet" href="/actions.css">
<style>body{margin:32px;color:CanvasText;background:Canvas;font:16px/1.7 system-ui}
#fixture-root{margin:24px 0}button{font:inherit}</style>
<p>独立组件功能夹具：不代表 #67 的人物安全区、入口热区或展开边界。</p>
<div id="fixture-root"></div><button id="outside">组件外部焦点</button>
<script src="/actions.js"></script></html>""", encoding="utf-8")


class FixtureHandler(SimpleHTTPRequestHandler):
    def __init__(self, *params, **kwargs):
        super().__init__(*params, directory=str(fixture), **kwargs)

    def log_message(self, *_):
        pass

    def do_GET(self):
        if self.path == "/about":
            self.send_response(302)
            self.send_header("Location", args.url.rstrip("/") + "/about")
            self.end_headers()
        else:
            super().do_GET()


server = ThreadingHTTPServer(("127.0.0.1", 0), FixtureHandler)
fixture_url = f"http://127.0.0.1:{server.server_port}"
if args.serve_actions:
    print(f"Isolated actions fixture: {fixture_url} (not an edge-layout preview)", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    raise SystemExit
threading.Thread(target=server.serve_forever, daemon=True).start()
errors = []


def visit(page):
    response = page.goto(args.url, wait_until="domcontentloaded", timeout=60000)
    assert response and response.ok
    page.wait_for_function("document.documentElement.classList.contains('splash-seen')")
    try:
        page.wait_for_load_state("networkidle", timeout=10000)
    except PlaywrightTimeoutError:
        # Existing remote music and anime services can remain busy.
        pass


def check_home(browser):
    for theme in ["light", "dark"]:
        context = browser.new_context(reduced_motion="reduce")
        origin = urlsplit(args.url)
        context.add_init_script(f"""
            if (location.origin === {json.dumps(origin.scheme + '://' + origin.netloc)}) {{
                localStorage.setItem('blog-theme', '{theme}');
                localStorage.setItem('blog-theme-override-until', String(Date.now() + 86400000));
            }}
        """)
        page = context.new_page()
        page.on("pageerror", lambda error: errors.append(str(error)))
        visit(page)
        for width, height in [(1440, 900), (1280, 800), (1024, 768)]:
            page.set_viewport_size({"width": width, "height": height})
            page.wait_for_timeout(200)
            main = page.locator("main").first
            assert main.locator("h1, dl").count() == 0
            assert main.get_by_role("region", name="个人介绍", exact=True).count() == 0
            assert main.get_by_role("group", name="关于与联系", exact=True).count() == 0
            assert main.get_by_text(settings["bio"], exact=True).count() == 0
            assert page.locator('[class*="ProfileCard"]').count() == 0
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
            about = page.get_by_role("navigation", name="主导航", exact=True).get_by_role("link", name="关于", exact=True)
            assert about.get_attribute("href") == "/about"
            prefix = f"home-{width}x{height}-{theme}"
            page.mouse.move(0, height - 1)
            page.screenshot(path=str(output / f"{prefix}-default.jpg"), type="jpeg", quality=85)
            about.hover()
            page.screenshot(path=str(output / f"{prefix}-about-hover.jpg"), type="jpeg", quality=85)
            about.focus()
            assert about.evaluate("el => getComputedStyle(el).outlineStyle") == "solid"
            page.screenshot(path=str(output / f"{prefix}-about-focus.jpg"), type="jpeg", quality=85)
            page.keyboard.press("Escape")
            about.evaluate("el => el.blur()")
            page.mouse.move(0, height - 1)
            page.screenshot(path=str(output / f"{prefix}-restored.jpg"), type="jpeg", quality=85)
            print(f"PASS home {width}x{height}/{theme}: no profile, existing about link, hover/focus/restored", flush=True)
        about.focus()
        page.keyboard.press("Enter")
        page.wait_for_url("**/about")
        expect(page.locator("main")).to_be_visible()
        context.close()


def check_actions(browser):
    for reduced in ["reduce", "no-preference"]:
        context = browser.new_context(viewport={"width": 1024, "height": 768}, reduced_motion=reduced)
        context.grant_permissions(["clipboard-read", "clipboard-write"], origin=fixture_url)
        context.route(settings["github"], lambda route: route.fulfill(body="GitHub destination check"))
        page = context.new_page()
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(fixture_url)
        actions = page.get_by_role("group", name="关于与联系", exact=True)
        expect(actions).to_be_visible()
        assert actions.locator("a a, a button, button a").count() == 0
        assert actions.locator("img, h1, dl, canvas").count() == 0
        for control in actions.locator("a, button").all():
            box = control.bounding_box()
            assert box["width"] >= 44 and box["height"] >= 44
        page.screenshot(path=str(output / f"actions-{reduced}-default.jpg"), type="jpeg", quality=85)
        about = actions.get_by_role("link", name="关于我", exact=True)
        about.focus()
        for control in actions.locator("a, button").all()[1:]:
            page.keyboard.press("Tab")
            assert control.evaluate("el => el === document.activeElement")
            assert control.evaluate("el => getComputedStyle(el).outlineStyle") == "solid"
        page.keyboard.press("Tab")
        assert page.locator("#outside").evaluate("el => el === document.activeElement"), "Keyboard trap"
        github = actions.get_by_role("link", name="在新窗口打开 GitHub", exact=True)
        assert github.get_attribute("rel") == "noopener noreferrer"
        github.focus()
        with page.expect_popup() as popup:
            page.keyboard.press("Enter")
        popup.value.wait_for_load_state()
        assert popup.value.url == settings["github"]
        popup.value.close()
        for label, key, activation in [("邮箱", "email", "Space"), ("QQ号", "qq", "Enter"), ("微信号", "wechat", "click")]:
            button = actions.get_by_role("button", name=f"复制{label}", exact=True)
            button.hover()
            page.screenshot(path=str(output / f"actions-{reduced}-{key}-hover.jpg"), type="jpeg", quality=85)
            if activation == "click":
                button.click()
            else:
                button.focus()
                page.keyboard.press(activation)
            expect(page.get_by_text(f"已复制到剪贴板: {settings[key]}", exact=False)).to_be_visible()
            assert page.evaluate("navigator.clipboard.readText()") == settings[key]
            assert page.url.rstrip("/") == fixture_url
        email = actions.get_by_role("button", name="复制邮箱", exact=True)
        email.focus()
        page.keyboard.press("Tab")
        page.keyboard.press("Shift+Tab")
        assert email.evaluate("el => getComputedStyle(el).outlineStyle") == "solid"
        page.screenshot(path=str(output / f"actions-{reduced}-focus.jpg"), type="jpeg", quality=85)
        page.evaluate("Object.defineProperty(navigator.clipboard, 'writeText', {value: () => Promise.reject(new Error('denied'))})")
        email.click()
        expect(page.get_by_text("邮箱复制失败，请稍后重试", exact=True)).to_be_visible()
        assert page.get_by_text("已复制到剪贴板", exact=False).count() == 0
        page.screenshot(path=str(output / f"actions-{reduced}-failure.jpg"), type="jpeg", quality=85)
        page.evaluate("Object.defineProperty(navigator, 'clipboard', {value: undefined})")
        actions.get_by_role("button", name="复制QQ号", exact=True).click()
        expect(page.get_by_text("QQ号复制失败，请稍后重试", exact=True)).to_be_visible()
        about.click()
        page.wait_for_url(args.url.rstrip("/") + "/about")
        context.close()
        print(f"PASS standalone actions/{reduced}: links, native clipboard, errors, tab order, no trap", flush=True)


try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, executable_path=args.browser)
        check_home(browser)
        check_actions(browser)
        browser.close()
    (output / "browser-errors.json").write_text(json.dumps(errors, ensure_ascii=False, indent=2), encoding="utf-8")
    assert not errors, f"Browser errors: {errors}"
finally:
    server.shutdown()
    server.server_close()
