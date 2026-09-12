"""Model Explorer source attribution checks against a running Astro server."""

import os
from pathlib import Path

from playwright.sync_api import expect, sync_playwright


BASE = os.environ.get("ASTRA_TEST_URL", "http://localhost:4321")
ARTIFACTS = Path("artifacts")
ARTIFACTS.mkdir(exist_ok=True)

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))

    response = page.goto(f"{BASE}/models", wait_until="networkidle")
    assert response and response.status == 200

    page.locator(".leaderboard-row").first.click()
    desktop_sources = page.locator(".subtask-expanded-row .model-data-sources")
    expect(desktop_sources).to_be_visible()
    expect(desktop_sources.get_by_text("Source coverage", exact=True)).to_be_visible()
    expect(
        desktop_sources.get_by_role(
            "link", name="Open LiveBench AI Benchmark source"
        )
    ).to_have_attribute("target", "_blank")
    expect(
        desktop_sources.get_by_role(
            "link", name="Open LiveBench AI Benchmark source for Overall score"
        )
    ).to_have_attribute("target", "_blank")
    expect(desktop_sources).to_contain_text("Retrieved")
    page.screenshot(
        path=str(ARTIFACTS / "model-data-sources-desktop.png"), full_page=True
    )

    page.set_viewport_size({"width": 390, "height": 844})
    response = page.goto(f"{BASE}/models", wait_until="networkidle")
    assert response and response.status == 200
    page.locator(".mobile-model-row-card").first.get_by_role(
        "button", name="Expand", exact=False
    ).click()
    mobile_sources = page.locator(".mobile-expanded-details .model-data-sources")
    expect(mobile_sources).to_be_visible()
    expect(mobile_sources.get_by_text("Source coverage", exact=True)).to_be_visible()
    expect(mobile_sources.get_by_role("link", name="Open OpenRouter recent throughput source for Speed")).to_have_attribute("target", "_blank")
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
    page.screenshot(
        path=str(ARTIFACTS / "model-data-sources-mobile.png"), full_page=True
    )

    assert not errors, errors
    browser.close()

print(
    "PASS: model dropdown sources render on desktop and mobile with links, dates, and no overflow."
)
