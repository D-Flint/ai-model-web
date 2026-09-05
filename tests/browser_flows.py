"""End-to-end checks against the running local Astro server."""
from pathlib import Path
import os
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get("ASTRA_TEST_URL", "http://localhost:4321")
ARTIFACTS = Path("artifacts")
ARTIFACTS.mkdir(exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))

    def visit(path):
        response = page.goto(BASE + path)
        assert response and response.status == 200, path
        page.wait_for_load_state("networkidle")
        assert page.locator("main h1").count() == 1, path

    visit("/")
    page.get_by_label("First model", exact=True).select_option("quill-air")
    expect(page.get_by_role("link", name="See the full comparison")).to_have_attribute("href", "/compare?models=quill-air,orbit-ultra")
    page.get_by_label("Search models", exact=True).fill("cedar")
    page.get_by_role("button", name="Explore", exact=True).click()
    page.wait_for_load_state("networkidle")
    expect(page.locator(".model-card")).to_have_count(2)
    page.get_by_role("button", name="Reset filters").click()
    expect(page.locator(".model-card")).to_have_count(12)
    page.get_by_role("combobox", name="Provider", exact=True).select_option("Quill Labs")
    expect(page.locator(".model-card")).to_have_count(2)
    page.get_by_role("button", name="Reset filters").click()
    page.get_by_label("Open weights", exact=True).check()
    expect(page.locator(".model-card")).to_have_count(2)
    page.get_by_label("Vision support", exact=True).check()
    expect(page.get_by_text("No models match yet.")).to_be_visible()
    page.get_by_role("button", name="Reset filters").first.click()
    for i in range(4):
        page.locator(".model-card").nth(i).get_by_role("button", name="Compare", exact=True).click()
    page.locator(".model-card").nth(4).get_by_role("button", name="Compare", exact=True).click()
    expect(page.get_by_text("You can compare up to 4 models.", exact=False)).to_be_visible()
    page.get_by_role("link", name="Compare models", exact=True).click()
    page.wait_for_load_state("networkidle")
    expect(page.locator(".comparison-table thead th")).to_have_count(5)
    page.screenshot(path=str(ARTIFACTS / "compare-desktop.png"), full_page=True)
    page.reload()
    page.wait_for_load_state("networkidle")
    expect(page.locator(".selected-models .selection-chip")).to_have_count(4)
    for _ in range(3):
        page.locator(".selected-models button").first.click()
    expect(page.get_by_text("Pick at least two models.")).to_be_visible()
    page.get_by_role("combobox", name="Add a model", exact=True).select_option("prism-write")
    expect(page.locator(".comparison-table")).to_be_visible()

    visit("/models/quill-pro")
    page.locator("#score-coding summary").click()
    expect(page.locator("#score-coding")).to_have_attribute("open", "")
    expect(page.locator("#score-coding")).to_contain_text("Synthetic fixture input 960")
    visit("/rankings/coding")
    expect(page.locator(".ranking-row h3").first).to_have_text("Quill Pro")
    visit("/rankings/cheap")
    expect(page.locator(".ranking-row h3").first).to_have_text("Tide Small")

    visit("/find")
    page.get_by_role("radio", name="Writing", exact=False).check()
    page.get_by_role("button", name="Continue", exact=True).click()
    page.get_by_role("radio", name="Best quality", exact=False).check()
    page.get_by_role("button", name="Continue", exact=True).click()
    page.get_by_role("button", name="Find my matches").click()
    expect(page.locator(".recommendation-result")).to_have_count(3)
    page.get_by_role("button", name="Start again").click()
    page.get_by_role("button", name="Continue", exact=True).click()
    page.get_by_role("button", name="Continue", exact=True).click()
    page.get_by_role("radio", name="Free", exact=False).check()
    page.get_by_role("button", name="Find my matches").click()
    expect(page.get_by_text("No models fit this budget.")).to_be_visible()

    visit("/cost?models=quill-pro")
    expect(page.locator(".cost-table tbody tr")).to_have_count(1)
    expect(page.locator(".cost-table tbody td").last).to_have_text("$5.40")
    page.get_by_role("button", name="Advanced", exact=True).click()
    page.get_by_label("Input tokens per attempt").fill("1000")
    page.get_by_label("Output tokens per attempt").fill("500")
    expect(page.locator(".cost-table tbody td").last).to_have_text("$6.30")
    page.get_by_text("Retries & tool costs", exact=True).click()
    page.get_by_label("Assumed success rate (%)").fill("50")
    expect(page.locator(".cost-table tbody td").last).to_have_text("$12.60")
    page.get_by_label("Assumed success rate (%)").fill("0")
    expect(page.get_by_role("alert")).to_be_visible()
    page.get_by_label("Assumed success rate (%)").fill("100")
    page.get_by_label("Days per month").fill("32")
    expect(page.get_by_role("alert")).to_be_visible()
    page.get_by_label("Days per month").fill("30")
    page.get_by_role("checkbox", name="Quill Pro", exact=True).uncheck()
    expect(page.get_by_text("Choose a model to estimate.")).to_be_visible()

    # Actual screenshots and horizontal overflow checks on all major surfaces.
    for width in [1440, 390, 320]:
        page.set_viewport_size({"width": width, "height": 900})
        for route in ["/", "/models", "/compare", "/models/quill-pro", "/find", "/cost", "/rankings", "/methodology"]:
            visit(route)
            assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), f"Overflow: {route} at {width}"
            if route in ["/", "/compare", "/find", "/cost"] and width != 320:
                name = "home" if route == "/" else route.strip("/")
                page.screenshot(path=str(ARTIFACTS / f"{name}-{width}.png"), full_page=True)
        if width == 390:
            visit("/")
            page.get_by_role("button", name="Open navigation").click()
            expect(page.get_by_role("navigation", name="Mobile navigation")).to_be_visible()
            page.get_by_role("button", name="Close navigation").click()
    page.set_viewport_size({"width": 1440, "height": 1000})
    visit("/")
    page.get_by_role("button", name="Toggle color theme").click()
    expect(page.locator("html")).to_have_attribute("data-theme", "dark")
    page.screenshot(path=str(ARTIFACTS / "home-dark.png"), full_page=True)
    visit("/compare")
    expect(page.locator("html")).to_have_attribute("data-theme", "dark")
    page.screenshot(path=str(ARTIFACTS / "compare-dark.png"), full_page=True)
    assert not errors, errors
    print("PASS: browse, filters, selection limit, share reload, score evidence, rankings, finder, costs, mobile navigation, theme persistence; 24 responsive route checks; no browser errors.")
    browser.close()
