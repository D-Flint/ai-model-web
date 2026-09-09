from playwright.sync_api import expect, sync_playwright


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 900})

    for path in ["/rankings", "/rankings/intelligence", "/rankings/speed", "/rankings/coding"]:
        page.goto(f"http://localhost:4321{path}")
        page.wait_for_load_state("networkidle")
        first_row = page.locator(".ranking-row").first
        expect(first_row.locator(".ranking-row-header > .score-number")).to_have_count(1)
        identity = first_row.locator(".ranking-identity").bounding_box()
        score = first_row.locator(".ranking-row-header > .score-number").bounding_box()
        content = first_row.locator(".ranking-row-content").bounding_box()
        assert score["x"] > identity["x"]
        assert score["y"] <= identity["y"]
        assert content["y"] > score["y"]

    browser.close()

print("PASS: ranking scores share the upper card header with model identity.")
