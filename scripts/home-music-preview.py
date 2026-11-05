"""Exercise #48 components in the gated interface preview, using the real root Provider.

Fixture data and HTTP Range audio stay in the browser; no production writes.
The neutral host is not #67 geometry or homepage visual acceptance.
"""

import argparse
import io
import json
import math
import struct
import wave
from datetime import datetime, timezone
from pathlib import Path

from playwright.sync_api import sync_playwright, expect

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--url", default="http://127.0.0.1:3148")
parser.add_argument("--output", default=".sync/tmp-home-music-rework-evidence")
parser.add_argument("--check-only", action="store_true", help="Skip screenshots")
parser.add_argument("--browser", help="Optional Chromium executable")
args = parser.parse_args()
args.url = args.url.rstrip("/")
output = Path(args.output).resolve()
output.mkdir(parents=True, exist_ok=True)
preview_url = args.url + "/preview/home-music"

audio = io.BytesIO()
with wave.open(audio, "wb") as wav:
    wav.setnchannels(1)
    wav.setsampwidth(2)
    wav.setframerate(8000)
    wav.writeframes(b"".join(struct.pack("<h", int(150 * math.sin(i * 2 * math.pi * 220 / 8000)))
                             for i in range(8000 * 60)))

songs = [
    {"id": "preview-1", "name": "春を待つ、君と。", "artist": "夜の手帖 / Haru",
     "url": args.url + "/__home_music.wav",
     "lrc": "[00:00.00]風の中で、春を待っている\n[00:02.00]把每一个平凡的瞬间，写成温柔的歌\n[00:30.00]让旋律陪你走过今天"},
    {"id": "preview-2", "name": "夏夜、星屑与未完的诗 — " + "UninterruptedEnglishTitle" * 8,
     "artist": "花譜 / Aimer / " + "ManyArtistsTogether" * 8,
     "url": args.url + "/__home_music.wav?second",
     "lrc": "[00:00.00]新的旋律已经开始\n[00:02.00]LongUnbrokenLyric" + "AcrossTheNight" * 30},
    {"id": "preview-3", "name": "Nocturne · 静かな夜", "artist": "Instrumental Ensemble",
     "url": args.url + "/__home_music.wav?third"},
]
report = {"recorded_at": datetime.now(timezone.utc).isoformat(), "scope": "component contract only; #51/#67 composition and #68 destruction unverified",
          "transport": "fixed music API and HTTP Range WAV; real root MusicProvider and HTMLAudioElement",
          "checks": [], "page_errors": []}


def setup(browser, width=1440, motion="no-preference", state="ready", tracks=None):
    context = browser.new_context(viewport={"width": width, "height": 900}, reduced_motion=motion)
    transport = {"state": state, "requests": 0, "pending": []}

    def music_route(route):
        transport["requests"] += 1
        if transport["state"] == "loading":
            transport["pending"].append(route)
        elif transport["state"] == "error":
            route.fulfill(status=503, json={"error": "preview unavailable"})
        else:
            route.fulfill(json=[] if transport["state"] == "empty" else (songs if tracks is None else tracks))

    def audio_route(route):
        data = audio.getvalue()
        byte_range = route.request.headers.get("range")
        headers = {"Accept-Ranges": "bytes"}
        if byte_range:
            first, last = byte_range.removeprefix("bytes=").split("-", 1)
            first, last = int(first or 0), min(int(last or len(data) - 1), len(data) - 1)
            headers["Content-Range"] = f"bytes {first}-{last}/{len(data)}"
            route.fulfill(status=206, body=data[first:last + 1], content_type="audio/wav", headers=headers)
        else:
            route.fulfill(body=data, content_type="audio/wav", headers=headers)

    context.route("**/api/music?**", music_route)
    context.route("**/__home_music.wav*", audio_route)
    page = context.new_page()
    page.on("pageerror", lambda error: report["page_errors"].append(str(error)))
    page.goto(preview_url, wait_until="domcontentloaded", timeout=120000)
    expect(page.get_by_role("heading", name="音乐组件接口预览", exact=True)).to_be_visible()
    page.wait_for_function("document.documentElement.classList.contains('splash-seen')", timeout=30000)
    page.get_by_role("button", name="展开音乐控制", exact=True).click()
    if state == "ready":
        expect(player(page).get_by_role("slider", name="播放进度")).to_be_enabled()
    return context, page, transport


def player(page):
    return page.get_by_role("region", name="音乐控制", exact=True)


def lyrics(page):
    return page.get_by_role("region", name="当前歌词", exact=True)


def capture(page, name):
    if not args.check_only:
        page.screenshot(path=str(output / f"{name}.jpg"), type="jpeg", quality=85)


try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, executable_path=args.browser)
        for width in [1024, 1280, 1440]:
            for motion in ["no-preference", "reduce"]:
                context, page, _ = setup(browser, width, motion)
                controls = player(page)
                assert controls.locator("img, audio").count() == 0
                assert page.locator('a[href="/music"]').count() == 0
                assert page.locator("audio").count() == 1
                for button in controls.get_by_role("button").all():
                    b = button.bounding_box()
                    assert b["width"] >= 44 and b["height"] >= 44
                controls.get_by_role("button", name="播放", exact=True).hover()
                expect(controls).to_be_visible()
                controls.get_by_role("button", name="播放", exact=True).focus()
                page.keyboard.press("Enter")
                page.wait_for_function("!document.querySelector('audio').paused && document.querySelector('audio').currentTime > 2.1")
                expect(lyrics(page)).to_contain_text("把每一个平凡的瞬间")
                stage = page.get_by_label("接口演示舞台", exact=True).bounding_box()
                lyric = lyrics(page).bounding_box()
                assert abs(stage["y"] + stage["height"] - lyric["y"] - lyric["height"]) <= 2
                assert lyrics(page).evaluate("el => getComputedStyle(el).pointerEvents") == "none"
                assert lyrics(page).evaluate("el => !el.contains(document.elementFromPoint(el.getBoundingClientRect().x + el.clientWidth/2, el.getBoundingClientRect().y + el.clientHeight/2))")
                if motion == "reduce":
                    assert lyrics(page).evaluate("el => el.getAnimations({subtree:true}).length === 0")
                capture(page, f"desktop-{width}" if motion == "no-preference" else f"reduced-{width}")
                page.keyboard.press("Escape")
                expect(page.get_by_role("button", name="展开音乐控制", exact=True)).to_be_focused()
                expect(page.locator("#preview-music-controls")).to_be_hidden()
                assert page.locator("#preview-music-controls").evaluate("el => el.inert")
                assert page.locator("audio").evaluate("a => !a.paused")
                expect(lyrics(page)).to_be_visible()
                if width == 1440 and motion == "no-preference":
                    capture(page, "closed")
                page.keyboard.press("Tab")
                outside = page.get_by_role("link", name="前往关于页，检查跨页播放", exact=True)
                expect(outside).to_be_focused()
                page.get_by_role("button", name="展开音乐控制", exact=True).click()
                controls.get_by_role("button", name="上一首", exact=True).focus()
                outside.focus()
                expect(page.locator("#preview-music-controls")).to_be_hidden()
                expect(outside).to_be_focused()
                page.get_by_role("button", name="展开音乐控制", exact=True).click()
                controls.get_by_role("button", name="下一首", exact=True).click()
                expect(controls).to_contain_text("夏夜、星屑与未完的诗")
                expect(lyrics(page)).to_contain_text("LongUnbrokenLyric", timeout=10000)
                # A different fixture width demonstrates that the component has no #67 geometry.
                controls.locator("..").evaluate("el => el.style.width = '208px'")
                assert controls.evaluate("el => el.scrollWidth <= el.clientWidth")
                assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
                assert lyrics(page).evaluate("el => el.scrollWidth <= el.clientWidth")
                if width == 1024 and motion == "reduce":
                    capture(page, "long-content")
                report["checks"].append(f"{width}/{motion}: buttons, pointer into controls, Escape/focus, inert closed view, blur, persistent playback, bottom/click-through lyrics, flexible width and long text")
                context.close()

        context, page, _ = setup(browser)
        controls = player(page)
        controls.get_by_role("button", name="播放", exact=True).click()
        page.wait_for_function("document.querySelector('audio').currentTime > 2.1")
        controls.get_by_role("button", name="暂停", exact=True).click()
        expect(controls.get_by_role("button", name="播放", exact=True)).to_be_visible()
        page.wait_for_function("document.querySelector('audio').paused")
        paused = page.locator("audio").evaluate("a => a.currentTime")
        page.wait_for_timeout(350)
        assert abs(page.locator("audio").evaluate("a => a.currentTime") - paused) < 0.1
        expect(lyrics(page)).to_contain_text("把每一个平凡的瞬间")
        seek = controls.get_by_role("slider", name="播放进度")
        seek.focus()
        seek.press("Home")
        seek.press("ArrowRight")
        page.wait_for_function("document.querySelector('audio').currentTime >= 0.5")
        assert page.locator("audio").evaluate("a => a.currentTime") < 2
        seek.click(position={"x": seek.bounding_box()["width"] * 0.65, "y": 12})
        page.wait_for_function("document.querySelector('audio').currentTime > 30")
        expect(lyrics(page)).to_contain_text("让旋律陪你走过今天")
        controls.get_by_role("button", name="下一首", exact=True).click()
        expect(controls).to_contain_text("夏夜、星屑与未完的诗")
        controls.get_by_role("button", name="下一首", exact=True).click()
        expect(controls).to_contain_text("Nocturne")
        expect(lyrics(page)).to_have_count(0)
        capture(page, "instrumental")
        controls.get_by_role("button", name="上一首", exact=True).click()
        expect(lyrics(page)).to_contain_text("新的旋律已经开始")
        controls.get_by_role("button", name="播放", exact=True).click()
        page.wait_for_function("!document.querySelector('audio').paused && document.querySelector('audio').currentTime > 1")
        before_route = page.locator("audio").evaluate("a => { window.__homeMusicAudio = a; return {src:a.src,time:a.currentTime} }")
        page.get_by_role("link", name="前往关于页，检查跨页播放", exact=True).click()
        page.wait_for_url("**/about")
        assert page.locator("audio").evaluate("a => a === window.__homeMusicAudio && !a.paused")
        page.go_back(wait_until="domcontentloaded")
        page.wait_for_url(preview_url)
        page.get_by_role("button", name="展开音乐控制", exact=True).click()
        expect(player(page).get_by_role("button", name="暂停", exact=True)).to_be_visible()
        assert page.locator("audio").count() == 1
        assert page.locator("audio").evaluate("a => a === window.__homeMusicAudio && a.src") == before_route["src"]
        assert page.locator("audio").evaluate("a => a.currentTime") >= before_route["time"]
        report["checks"].append("real audio pause/resume, timed lyrics, keyboard/pointer seek, next/previous, no-lyrics collapse, Next navigation to about and back preserves same playing audio element and time")
        page.get_by_role("navigation", name="主导航", exact=True).get_by_role("link", name="首页", exact=True).click()
        page.wait_for_url(args.url + "/")
        for width in [1024, 1280, 1440]:
            page.set_viewport_size({"width": width, "height": 900})
            assert page.get_by_role("region", name="音乐控制", exact=True).count() == 0
            assert lyrics(page).count() == 0
            assert page.locator('a[href="/music"]').count() == 0
            assert page.locator("audio").evaluate("a => a === window.__homeMusicAudio && !a.paused")
        report["checks"].append("actual homepage at 1024/1280/1440 has no old music card or lyric row; same root audio keeps playing")
        context.close()

        for state in ["loading", "empty", "error"]:
            context, page, transport = setup(browser, state=state)
            controls = player(page)
            expect(controls).to_contain_text({"loading": "正在连接音乐云端", "empty": "暂无可播放音乐", "error": "音乐连接失败"}[state])
            assert controls.get_by_role("slider").count() == 0
            assert lyrics(page).count() == 0
            capture(page, state)
            if state != "loading":
                if state == "error":
                    expect(controls).to_contain_text("503")
                transport["state"] = "ready"
                count = transport["requests"]
                controls.get_by_role("button", name="重试连接", exact=True).click()
                expect(controls.get_by_role("slider", name="播放进度")).to_be_enabled()
                assert transport["requests"] > count
            for pending in transport["pending"]:
                pending.abort()
            report["checks"].append(f"{state}: no invalid controls/lyric placeholder" + ("; retry recovers" if state != "loading" else ""))
            context.close()
        context, page, _ = setup(browser, tracks=[{**songs[0], "lrc": "[00:00.00]   "}])
        expect(lyrics(page)).to_have_count(0)
        report["checks"].append("empty parsed lyrics produce no lyric DOM")
        context.close()
        browser.close()
    assert not report["page_errors"], report["page_errors"]
    report["passed"] = True
finally:
    (output / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(report, ensure_ascii=False, indent=2))
print(f"Evidence: {output}")
