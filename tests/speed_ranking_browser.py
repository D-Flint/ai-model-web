import re

from playwright.sync_api import sync_playwright


def speeds(page):
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

    page.goto('http://localhost:4321/rankings/speed')
    page.wait_for_load_state('networkidle')

    order = page.get_by_label('Sort ranking')
    assert order.input_value() == 'desc'
    descending = speeds(page)
    assert len(descending) > 1
    assert descending == sorted(descending, reverse=True)

    ranged_rows = page.locator('.ranking-row').filter(has_text='Measured range:')
    assert ranged_rows.count() > 0
    first_ranged = ranged_rows.first
    range_text = first_ranged.locator('.speed-measurement').inner_text()
    range_match = re.search(r'(\d+)–(\d+) tokens/sec', range_text)
    assert range_match
    displayed_peak = int(
        re.match(
            r'\d+', first_ranged.locator('.score-number').inner_text().strip()
        ).group()
    )
    assert displayed_peak == int(range_match.group(2))

    order.select_option('asc')
    ascending = speeds(page)
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

print('PASS: speed ranking uses verified peaks and supports both sort directions.')
