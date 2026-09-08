import re

from playwright.sync_api import sync_playwright


def scores(page):
    values = page.locator('.ranking-row .score-number').all_inner_texts()
    return [int(re.match(r'\d+', value.strip()).group()) for value in values]


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    console_errors = []
    page.on(
        'console',
        lambda message: console_errors.append(message.text)
        if message.type == 'error'
        else None,
    )

    page.goto('http://localhost:4321/rankings/intelligence')
    page.wait_for_load_state('networkidle')

    order = page.get_by_label('Sort ranking')
    assert order.input_value() == 'desc'
    descending = scores(page)
    assert len(descending) > 1
    assert descending == sorted(descending, reverse=True)

    order.select_option('asc')
    ascending = scores(page)
    assert ascending == sorted(ascending)
    assert len(ascending) == len(descending)

    order.select_option('desc')
    last_row = page.locator('.ranking-row').last
    model_name = last_row.locator('h3').inner_text()
    last_row.get_by_role('link', name='Add to comparison').click()
    page.wait_for_load_state('networkidle')
    assert page.locator('.selected-models .selection-chip').count() == 1
    assert model_name in page.locator('.selected-models .selection-chip').inner_text()
    assert console_errors == []

    browser.close()

print('PASS: intelligence ranking defaults high-to-low and supports low-to-high.')
