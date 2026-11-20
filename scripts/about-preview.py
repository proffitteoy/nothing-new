"""Smoke-test /about: keep all profile content without identity headings.

Requires a running Next.js preview and Python Playwright.
Example: python scripts/about-preview.py --url http://127.0.0.1:3168
"""
import argparse
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--url", default="http://127.0.0.1:3168")
parser.add_argument("--browser", help="Existing Chromium binary (otherwise Playwright Chromium)")
args = parser.parse_args()

SECTIONS = ("about-website", "about-engineering", "about-research")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=args.browser)
    for width in (390, 768, 1024, 1440):
        context = browser.new_context(
            viewport={"width": width, "height": 900},
            is_mobile=width < 768,
            has_touch=width < 768,
            reduced_motion="reduce",
        )
        context.route("**/api/music?*", lambda route: route.fulfill(json=[]))
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        response = page.goto(args.url + "/about", wait_until="networkidle", timeout=60000)
        assert response and response.ok
        page.wait_for_function("document.documentElement.classList.contains('splash-seen')")
        assert page.get_by_role("heading", name="关于", exact=True).count() == 1

        article = page.locator("article[aria-labelledby='about-title']")
        nav = article.get_by_role("navigation", name="关于页章节导航")
        buttons = nav.get_by_role("button")
        assert buttons.count() == 3
        for i, (section_id, label) in enumerate(zip(SECTIONS, ("网站介绍", "工程身份", "研究身份"))):
            assert buttons.nth(i).get_attribute("aria-controls") == section_id
            assert label in buttons.nth(i).inner_text()

        # The two former identity headings and subtitles must not return.
        for heading in ("工程身份", "研究身份"):
            assert article.get_by_role("heading", name=heading, exact=True).count() == 0
        for subtitle in ("算法、开源软件与平台开发", "拓扑数据分析、同调理论与双曲几何"):
            assert article.get_by_text(subtitle, exact=True).count() == 0

        for section_id in SECTIONS:
            section = article.locator("#" + section_id)
            assert section.count() == 1
            assert section.get_attribute("data-about-section")
        assert article.locator("#about-engineering").get_by_role(
            "heading", name="开源算法", exact=True
        ).count() == 1
        assert article.locator("#about-research").get_by_role(
            "heading", name="拓扑数据分析", exact=True
        ).count() == 1

        assert article.locator("#activity-heatmap-title").count() == 0
        assert article.get_by_text("GitHub 贡献数据暂时不可用").count() == 0
        assert article.locator("img").evaluate_all(
            "(images) => images.every((image) => image.complete && image.naturalWidth > 0)"
        )
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        for i, section_id in enumerate(SECTIONS):
            buttons.nth(i).click()
            page.wait_for_function(
                "(i) => document.querySelectorAll('nav[aria-label=\"关于页章节导航\"] button')[i].getAttribute('aria-current') === 'location'",
                arg=i,
            )
            assert article.locator("#" + section_id).is_visible()
        article.locator("#about-website").scroll_into_view_if_needed()
        page.wait_for_function(
            "() => document.querySelector('nav[aria-label=\"关于页章节导航\"] button').getAttribute('aria-current') === 'location'"
        )
        assert not errors, errors
        print(f"/about OK width={width}: three sidebar items with scroll tracking, no body identity headings, all content, images, no overflow")
        context.close()
    browser.close()
