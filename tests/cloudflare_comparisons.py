"""Check pair SSR and interactive sharing against a running Cloudflare preview."""
import os
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get("ASTRA_TEST_URL", "http://localhost:4321")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(permissions=["clipboard-read", "clipboard-write"])
    api = context.request
    catalog = api.get(BASE + "/catalog.json").json()
    assert len(catalog) == 49
    synthetic = {model["slug"] for model in catalog if model["dataKind"] == "synthetic"}
    assert synthetic == set()
    a, b = sorted(catalog[-2:], key=lambda model: model["slug"])
    separator = "~vs~" if any("-vs-" in m["slug"] for m in [a, b]) else "-vs-"
    pair = separator.join([a["slug"], b["slug"]])
    path = "/compare/" + pair

    # Raw HTML proves the content exists before hydration.
    response = api.get(BASE + path)
    assert response.status == 200, (response.status, response.text()[:300])
    html = response.text()
    for text in [a["name"], b["name"], "comparison-table", "The short version", "API", "/methodology", 'name="description"']:
        assert text in html, text
    assert "<title>" in html
    expected_origin = os.environ.get("SITE_URL")
    if expected_origin:
        assert f'rel="canonical" href="{expected_origin.rstrip("/")}{path}"' in html

    reverse = api.get(BASE + "/compare/" + separator.join([b["slug"], a["slug"]]) + "?source=test", max_redirects=0)
    assert reverse.status == 301
    assert reverse.headers["location"] == path + "?source=test"
    trailing = api.get(BASE + path + "/", max_redirects=0)
    assert trailing.status == 301 and trailing.headers["location"] == path
    for invalid in ["missing", "unknown-vs-absent", a["slug"] + "-vs-" + a["slug"], a["slug"] + "-vs-unknown"]:
        result = api.get(BASE + "/compare/" + invalid, max_redirects=0)
        assert result.status == 404, (invalid, result.status)
        assert "window.location.replace" not in result.text()
    verified_detail = api.get(BASE + "/models/gpt-6-astra")
    assert verified_detail.status == 200
    assert "Public benchmark dataset" in verified_detail.text()
    assert api.get(BASE + "/compare/claude-fable-5-1-vs-gpt-6-astra", max_redirects=0).status == 200

    for static in ["/", "/models", "/models/" + a["slug"], "/rankings", "/methodology", "/compare", "/find", "/cost", "/pricing"]:
        assert api.get(BASE + static).status == 200, static
    sitemap = api.get(BASE + "/sitemap.xml").text()
    assert sitemap.count("/compare/") <= 100
    assert api.get(BASE + "/not-a-real-page").status == 404

    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    navigation = page.goto(BASE + path)
    assert navigation and navigation.status == 200, "Browser navigation must reach SSR, not the asset 404 fallback"
    page.wait_for_load_state("networkidle")
    expect(page.locator(".selection-chip")).to_have_count(2)
    page.get_by_role("button", name="Copy comparison link").click()
    expect(page.get_by_role("status")).to_have_text("Comparison link copied.")
    assert page.evaluate("navigator.clipboard.readText()") == BASE + path

    extra = next(m for m in catalog if m["slug"] not in [a["slug"], b["slug"]])
    page.get_by_label("Add a model or effort").select_option(extra["slug"])
    expect(page.locator(".selection-chip")).to_have_count(3)
    assert urlparse(page.url).path == "/compare"
    page.reload()
    page.wait_for_load_state("networkidle")
    expect(page.locator(".selection-chip")).to_have_count(3)
    page.get_by_role("button", name="Copy comparison link").click()
    expect(page.get_by_role("status")).to_have_text("Comparison link copied.")
    assert "models=" in page.evaluate("navigator.clipboard.readText()")

    page.goto(BASE + "/compare?a=" + a["slug"] + "&b=" + b["slug"])
    page.wait_for_load_state("networkidle")
    expect(page.locator(".selection-chip")).to_have_count(2)
    expect(page.locator(".selection-chip").first).to_contain_text(a["name"])
    page.goto(BASE + "/models/")
    page.get_by_role("searchbox", name="Search models").fill("GPT-6 Astra")
    verified_row = page.locator("tbody tr", has_text="GPT-6 Astra").first
    expect(verified_row).not_to_contain_text("Synthetic")
    Path("artifacts").mkdir(exist_ok=True)
    page.screenshot(path="artifacts/cloudflare-comparison.png", full_page=True)
    assert not errors, errors
    browser.close()
    print("Passed: SSR content, redirects, 404s, static routes, sitemap, hydration, and sharing.")
