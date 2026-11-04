"""Reproduce #48 screenshots and interactions using the real MusicProvider.

Only the music API, cover and audio transport use deterministic local fixtures.
Requires Python Playwright; does not change the app, API or production data.
"""

import argparse
import io
import json
import math
import struct
import wave
from pathlib import Path

from playwright.sync_api import sync_playwright, expect


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--url", default="http://127.0.0.1:3148")
parser.add_argument("--stage", choices=["before", "after"], default="after")
parser.add_argument("--output", default=".sync/tmp-home-music-evidence")
parser.add_argument("--check-only", action="store_true", help="Skip the four comparison captures")
parser.add_argument("--browser", help="Optional Chromium executable")
args = parser.parse_args()
output = Path(args.output).resolve() / args.stage
output.mkdir(parents=True, exist_ok=True)

audio = io.BytesIO()
with wave.open(audio, "wb") as wav:
    wav.setnchannels(1)
    wav.setsampwidth(2)
    wav.setframerate(8000)
    wav.writeframes(b"".join(struct.pack("<h", int(150 * math.sin(i * 2 * math.pi * 220 / 8000)))
                             for i in range(8000 * 60)))

songs = [
    {"id": "preview-1", "name": "春を待つ、君と。", "artist": "夜の手帖 / Haru",
     "cover": args.url + "/avatar.jpg", "url": args.url + "/__home_music.wav",
     "lrc": "[00:00.00]風の中で、春を待っている\n[00:02.00]把每一个平凡的瞬间，写成温柔的歌\n[00:30.00]让旋律陪你走过今天"},
    {"id": "preview-2", "name": "夏夜、星屑与未完的诗 — A Very Long Song Title / 星をめぐる旅 " + "UninterruptedEnglishTitle" * 4,
     "artist": "花譜 / ヨルシカ / Aimer / The Journal Ensemble / " + "ManyArtistsTogether" * 5,
     "cover": args.url + "/about-cover.png", "url": args.url + "/__home_music.wav?second",
     "lrc": "[00:00.00]新的旋律已经开始\n[00:02.00]LongUnbrokenLyric" + "AcrossTheNight" * 30},
    {"id": "preview-3", "name": "Nocturne · 静かな夜", "artist": "Instrumental Ensemble",
     "cover": args.url + "/__missing_cover.jpg", "url": args.url + "/__home_music.wav?third"},
]
report = {"stage": args.stage, "transport": "deterministic music fixtures; real Provider and HTMLAudioElement", "checks": [], "page_errors": []}


def setup(browser, width=1440, theme="light", motion="no-preference", state="ready", tracks=None):
    context = browser.new_context(viewport={"width": width, "height": 1000 if width > 768 else 844},
                                  reduced_motion=motion, has_touch=width < 768, is_mobile=width < 768)
    context.add_init_script(f"localStorage.setItem('blog-theme', '{theme}'); localStorage.setItem('blog-theme-override-until', String(Date.now()+86400000));")
    transport = {"state": state, "requests": 0, "pending": []}

    def music_route(route):
        transport["requests"] += 1
        if transport["state"] == "loading":
            # Keep the original Provider in loading without introducing app test hooks.
            transport["pending"].append(route)
            return
        if transport["state"] == "error":
            route.fulfill(status=503, json={"error": "preview unavailable"})
        else:
            route.fulfill(json=[] if transport["state"] == "empty" else (tracks if tracks is not None else songs))

    context.route("**/api/music?**", music_route)
    def audio_route(route):
        data = audio.getvalue()
        byte_range = route.request.headers.get("range")
        headers = {"Accept-Ranges": "bytes"}
        if byte_range:
            first, last = byte_range.removeprefix("bytes=").split("-", 1)
            first, last = int(first or 0), int(last or len(data) - 1)
            headers["Content-Range"] = f"bytes {first}-{last}/{len(data)}"
            route.fulfill(status=206, body=data[first:last+1], content_type="audio/wav", headers=headers)
        else:
            route.fulfill(body=data, content_type="audio/wav", headers=headers)

    context.route("**/__home_music.wav*", audio_route)
    context.route("**/__missing_cover.jpg", lambda route: route.fulfill(status=404, body="missing"))
    page = context.new_page()
    page.on("pageerror", lambda error: report["page_errors"].append(str(error)))
    page.goto(args.url, wait_until="domcontentloaded", timeout=120000)
    page.wait_for_function("document.documentElement.classList.contains('splash-seen')", timeout=30000)
    if state != "loading":
        page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1100)
    return context, page, transport


def player(page):
    if args.stage == "after":
        return page.get_by_role("region", name="首页音乐", exact=True)
    return page.locator("div[data-field-obstacle]").filter(has=page.get_by_role("slider", name="播放进度")).last


def capture(page, name, focus=False):
    if focus:
        player(page).scroll_into_view_if_needed()
    page.screenshot(path=str(output / f"{name}.png"), full_page=True)
    if name in ["loading", "empty", "error", "paused", "cover-failed-instrumental", "desktop-day"] and args.stage == "after":
        player(page).screenshot(path=str(output / f"{name}-player.png"))


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=args.browser)
    for width, theme, name in ([] if args.check_only else [(1440, "light", "desktop-day"), (1440, "dark", "desktop-night"),
                               (390, "light", "mobile-playing"), (320, "light", "mobile-long-title")]):
        context, page, _ = setup(browser, width, theme)
        controls = player(page)
        controls.get_by_role("slider", name="播放进度").wait_for()
        if width == 320:
            controls.get_by_role("button", name="下一首", exact=True).click()
        controls.get_by_role("button", name="播放", exact=True).click()
        expect(controls.get_by_role("button", name="暂停", exact=True)).to_be_visible()
        page.wait_for_timeout(2300)
        capture(page, name, width < 768)
        if args.stage == "after":
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), f"overflow at {width}"
            for button in controls.get_by_role("button").all():
                b = button.bounding_box()
                assert b["width"] >= 44 and b["height"] >= 44, "small control target"
            report["checks"].append(f"{width}/{theme}: layout, playback, click targets")
        context.close()
    if args.stage == "before":
        browser.close()
        (output / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Captured before screenshots: {output}")
        raise SystemExit(0)

    context, page, _ = setup(browser)
    controls = player(page)
    slider = controls.get_by_role("slider", name="播放进度")
    controls.get_by_role("button", name="播放", exact=True).focus()
    page.keyboard.press("Enter")
    page.wait_for_function("document.querySelector('audio').currentTime > 2.2")
    lyric = page.get_by_role("region", name="当前歌词", exact=True)
    expect(lyric).to_contain_text("把每一个平凡的瞬间，写成温柔的歌")
    controls.get_by_role("button", name="暂停", exact=True).click()
    paused_time = page.locator("audio").evaluate("a => a.currentTime")
    paused_lyric = lyric.inner_text()
    page.wait_for_timeout(400)
    assert abs(page.locator("audio").evaluate("a => a.currentTime") - paused_time) < 0.1
    assert lyric.inner_text() == paused_lyric
    capture(page, "paused")
    slider.focus()
    page.keyboard.press("ArrowRight")
    page.wait_for_function("before => document.querySelector('audio').currentTime > before", arg=paused_time)
    # Native pointer seeking follows the actual rendered slider, without dispatching Provider methods.
    box = slider.bounding_box()
    page.mouse.move(box["x"] + box["width"] * 0.2, box["y"] + box["height"] / 2)
    page.mouse.down()
    page.mouse.move(box["x"] + box["width"] * 0.6, box["y"] + box["height"] / 2, steps=8)
    page.mouse.up()
    page.wait_for_function("document.querySelector('audio').currentTime > 30")
    assert page.url.rstrip("/") == args.url.rstrip("/")
    controls.get_by_role("button", name="下一首", exact=True).click()
    expect(lyric).to_contain_text("新的旋律已经开始")
    controls.get_by_role("button", name="上一首", exact=True).click()
    expect(controls).to_contain_text(songs[0]["name"])
    controls.get_by_role("button", name="下一首", exact=True).click()
    controls.get_by_role("button", name="播放", exact=True).click()
    controls.get_by_role("button", name="下一首", exact=True).click()
    expect(lyric).to_contain_text("纯享音乐")
    expect(controls.get_by_role("img", name="音乐封面占位")).to_be_visible()
    page.wait_for_function("document.querySelector('audio').currentTime > 1")
    expect(controls.get_by_role("button", name="暂停", exact=True)).to_be_visible()
    capture(page, "cover-failed-instrumental")
    controls.get_by_role("button", name="下一首", exact=True).click()
    expect(controls.locator("img")).to_be_visible()
    expect(controls.get_by_role("button", name="暂停", exact=True)).to_be_visible()
    page.wait_for_function("document.querySelector('audio').currentTime > 1")
    before_route = page.locator("audio").evaluate("a => ({ src: a.src, time: a.currentTime })")
    controls.get_by_role("link", name="完整播放器").click()
    page.wait_for_url("**/music")
    assert page.locator("audio").count() == 1
    page.get_by_role("navigation", name="主导航", exact=True).get_by_role("link", name="关于", exact=True).click()
    page.wait_for_url("**/about")
    page.get_by_role("navigation", name="主导航", exact=True).get_by_role("link", name="首页", exact=True).click()
    page.wait_for_url(args.url + "/")
    expect(player(page).get_by_role("button", name="暂停", exact=True)).to_be_visible()
    assert page.locator("audio").evaluate("a => a.src") == before_route["src"]
    assert page.locator("audio").evaluate("a => a.currentTime") >= before_route["time"]
    report["checks"].append("real audio playback/pause, lyrics, next/previous, keyboard and pointer seek, cover failure/recovery, instrumental, route continuity and one audio element")
    context.close()

    for state in ["loading", "empty", "error"]:
        context, page, transport = setup(browser, state=state)
        controls = player(page)
        expect(controls.get_by_role("link", name="完整播放器")).to_be_visible()
        assert page.get_by_role("region", name="当前歌词", exact=True).count() == 0
        assert controls.get_by_role("slider").count() == 0
        layout = page.locator("main").evaluate("el => ({gap:el.children[1].getBoundingClientRect().top-el.children[0].getBoundingClientRect().bottom,expected:parseFloat(getComputedStyle(el).rowGap)})")
        assert abs(layout["gap"] - layout["expected"]) < 1, "empty lyric wrapper leaves extra gap"
        capture(page, state)
        if state == "error":
            expect(controls).to_contain_text("音乐连接失败")
            expect(controls).to_contain_text("503")
            transport["state"] = "ready"
            count = transport["requests"]
            controls.get_by_role("button", name="重试连接", exact=True).click()
            expect(controls.get_by_role("slider", name="播放进度")).to_be_visible()
            assert transport["requests"] > count
        if state == "loading":
            for pending in transport["pending"]:
                pending.abort()
        report["checks"].append(f"{state}: consistent frame, music link, no lyric row/invalid controls" + (", retry recovers" if state == "error" else ""))
        context.close()

    for width in [1280, 768, 375, 320]:
        context, page, _ = setup(browser, width, motion="reduce")
        controls = player(page)
        controls.get_by_role("button", name="下一首", exact=True).click()
        controls.get_by_role("button", name="播放", exact=True).click()
        page.wait_for_timeout(2500)
        controls.scroll_into_view_if_needed()
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        assert controls.evaluate("el => el.scrollWidth <= el.clientWidth")
        assert page.get_by_role("region", name="当前歌词", exact=True).evaluate("el => el.scrollWidth <= el.clientWidth")
        assert page.get_by_role("region", name="当前歌词", exact=True).evaluate("el => el.getAnimations({ subtree: true }).every(a => a.playState !== 'running')")
        if width < 768:
            mobile_seek = controls.get_by_role("slider", name="播放进度")
            mobile_seek.tap(position={"x": mobile_seek.bounding_box()["width"] * 0.6, "y": 16})
            page.wait_for_function("document.querySelector('audio').currentTime > 25")
            obstacles = [page.get_by_role("button", name="打开导航", exact=True), page.get_by_title("返回上一页", exact=True)]
            for obstacle in obstacles:
                nav = obstacle.bounding_box()
                for item in [*controls.get_by_role("button").all(), controls.get_by_role("slider"), controls.get_by_role("link", name="完整播放器")]:
                    b = item.bounding_box()
                    assert not (max(b["x"], nav["x"]) < min(b["x"]+b["width"], nav["x"]+nav["width"]) and
                                max(b["y"], nav["y"]) < min(b["y"]+b["height"], nav["y"]+nav["height"])), "mobile navigation overlaps music controls"
        capture(page, f"reduced-{width}", width < 768)
        report["checks"].append(f"{width}: long multilingual content, reduced motion, overflow and mobile navigation clearance")
        context.close()

    for name, title in [("chinese", "把平凡的日子写成歌"), ("english", "A Quiet Place Between the Pages")]:
        context, page, _ = setup(browser, 375, tracks=[{**songs[0], "name": title, "artist": "Ensemble / 合奏"}])
        controls = player(page)
        expect(controls.get_by_role("heading", name=title, exact=True)).to_be_visible()
        assert controls.evaluate("el => el.scrollWidth <= el.clientWidth")
        capture(page, f"title-{name}", True)
        report["checks"].append(f"375: {name} title and mixed artist text")
        context.close()
    browser.close()
(output / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
assert all("isReady" in error for error in report["page_errors"]), report["page_errors"]
print(json.dumps(report, ensure_ascii=False, indent=2))
print(f"Evidence: {output}")
