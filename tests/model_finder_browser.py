"""Focused browser coverage for the evidence-aware Model Finder."""

import os
import re
from pathlib import Path

from playwright.sync_api import expect, sync_playwright


BASE = os.environ.get("ASTRA_TEST_URL", "http://127.0.0.1:4321")
ARTIFACTS = Path("artifacts")
ARTIFACTS.mkdir(exist_ok=True)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))

    for theme in ["light", "dark"]:
        response = page.goto(f"{BASE}/find/")
        assert response and response.status == 200
        page.wait_for_load_state("networkidle")
        page.evaluate(
            "theme => document.documentElement.dataset.theme = theme", theme
        )
        page.add_script_tag(path="node_modules/axe-core/axe.min.js")
        violations = page.evaluate(
            """async () => (await axe.run(document, {
              runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa']}
            })).violations"""
        )
        assert not violations, violations
    page.goto(f"{BASE}/find/")
    page.wait_for_load_state("networkidle")
    page.evaluate("document.documentElement.dataset.theme = 'light'")
    page.add_script_tag(path="node_modules/axe-core/axe.min.js")

    expect(page.get_by_role("checkbox", name=re.compile(r"^Coding"))).to_be_checked()
    expect(
        page.get_by_role("checkbox", name=re.compile(r"^Images & vision"))
    ).to_be_disabled()
    expect(page.get_by_text("Vision quality evidence is not available yet.")).to_be_visible()

    page.get_by_role("checkbox", name=re.compile(r"^Research")).check()
    page.get_by_role("checkbox", name=re.compile(r"^Data analysis")).check()
    page.get_by_role("checkbox", name=re.compile(r"^Mathematics")).click()
    expect(page.get_by_role("alert")).to_contain_text("Choose up to 3 use cases")
    expect(
        page.get_by_role("checkbox", name=re.compile(r"^Mathematics"))
    ).not_to_be_checked()
    page.get_by_label("Research importance").select_option("medium")
    page.get_by_role("button", name="Continue").click()

    expect(page.get_by_text("Balanced by default")).to_be_visible()
    expect(page.get_by_text("Most reliable")).to_be_visible()
    page.get_by_role("checkbox", name=re.compile(r"^Best quality")).check()
    page.get_by_role("checkbox", name=re.compile(r"^Best value")).check()
    page.get_by_label("Best quality importance").select_option("high")
    page.get_by_role("button", name="Continue").click()

    page.get_by_role("checkbox", name=re.compile(r"^Tool calling")).check()
    page.get_by_role("checkbox", name=re.compile(r"^API available")).check()
    page.get_by_text("Advanced requirements").click()
    page.get_by_label("Minimum context window").select_option("128000")
    page.get_by_role("radio", name=re.compile(r"^Moderate")).check()
    page.get_by_role("radio", name="Preferred").check()
    page.get_by_role("button", name="Find my matches").click()

    expect(page.get_by_role("heading", name="Your evidence-backed shortlist")).to_be_focused()
    expect(page.locator(".recommendation-result")).to_have_count(3)
    expect(page.get_by_text("Best match", exact=True)).to_be_visible()
    expect(page.get_by_text("Best value", exact=True)).to_be_visible()
    expect(page.get_by_text("Alternative", exact=True)).to_be_visible()
    expect(page.locator(".finder-confidence").first).to_contain_text("evidence coverage")
    page.get_by_text("Why this match?", exact=True).first.click()
    expect(page.locator(".finder-breakdown").first).to_contain_text("Task fit")
    expect(page.locator(".finder-score-details").first).to_contain_text(
        "Evidence coverage"
    )
    result_violations = page.evaluate(
        """async () => (await axe.run(document, {
          runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa']}
        })).violations"""
    )
    assert not result_violations, result_violations
    expect(page.get_by_role("link", name="Compare matches")).to_have_attribute(
        "href", re.compile(r"^/compare\?models=")
    )
    page.screenshot(path=str(ARTIFACTS / "model-finder-desktop.png"), full_page=True)

    page.get_by_role("button", name="Start again").click()
    page.get_by_role("button", name="Continue").click()
    page.get_by_role("button", name="Continue").click()
    page.get_by_role("radio", name=re.compile(r"^Free API")).check()
    expect(page.get_by_role("radio", name="Preferred")).to_be_disabled()
    page.get_by_role("button", name="Find my matches").click()
    expect(page.get_by_role("heading", name="No trustworthy match yet")).to_be_visible()
    expect(page.get_by_text("No model passed", exact=False)).to_be_visible()

    for width in [390, 320]:
        page.set_viewport_size({"width": width, "height": 900})
        page.goto(f"{BASE}/find/", wait_until="domcontentloaded")
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
        expect(page.get_by_role("button", name="Continue")).to_be_visible()
        if width == 390:
            page.screenshot(
                path=str(ARTIFACTS / "model-finder-mobile.png"), full_page=True
            )

    assert not errors, errors
    print(
        "PASS: multi-select limits, importance, unsupported evidence, priorities, "
        "requirements, preferred/free budgets, explanations, comparison handoff, "
        "focus, and mobile overflow"
    )
    browser.close()
