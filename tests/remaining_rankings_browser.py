import re

from playwright.sync_api import sync_playwright


SCORE_ROUTES = [
    '/rankings/value',
    '/rankings/coding',
    '/rankings/agents',
    '/rankings/daily-use',
    '/rankings/research',
    '/rankings/writing',
    '/rankings/vision',
]


def score_values(page):
    values = page.locator('.ranking-row .score-number').all_inner_texts()
    return [int(re.match(r'\d+', value.strip()).group()) for value in values]


def price_values(page):
    values = page.locator('.ranking-row .score-number').all_inner_texts()
    return [
        float(re.search(r'[\d,]+(?:\.\d+)?', value).group().replace(',', ''))
        for value in values
    ]


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

    for route in SCORE_ROUTES:
        page.goto(f'http://localhost:4321{route}')
        page.wait_for_load_state('networkidle')
        highest = page.get_by_role(
            'button',
            name='Sort ranking: Highest to lowest. Activate to sort lowest to highest.',
        )
        assert highest.get_attribute('aria-pressed') == 'false', route
        descending = score_values(page)
        assert descending == sorted(descending, reverse=True), route
        highest.click()
        ascending = score_values(page)
        assert ascending == sorted(ascending), route
        assert len(ascending) == len(descending), route
        lowest = page.get_by_role(
            'button',
            name='Sort ranking: Lowest to highest. Activate to sort highest to lowest.',
        )
        assert lowest.get_attribute('aria-pressed') == 'true', route

    page.goto('http://localhost:4321/rankings/cheap')
    page.wait_for_load_state('networkidle')
    lowest = page.get_by_role(
        'button',
        name='Sort ranking: Lowest to highest. Activate to sort highest to lowest.',
    )
    assert lowest.get_attribute('aria-pressed') == 'true'
    ascending_prices = price_values(page)
    assert len(ascending_prices) > 1
    assert ascending_prices == sorted(ascending_prices)
    lowest.click()
    descending_prices = price_values(page)
    assert descending_prices == sorted(descending_prices, reverse=True)
    highest = page.get_by_role(
        'button',
        name='Sort ranking: Highest to lowest. Activate to sort lowest to highest.',
    )
    assert highest.get_attribute('aria-pressed') == 'false'

    first_row = page.locator('.ranking-row').first
    model_name = first_row.locator('h3').inner_text()
    first_row.get_by_role('link', name='Add to comparison').click()
    page.wait_for_load_state('networkidle')
    assert page.locator('.selected-models .selection-chip').count() == 1
    assert model_name in page.locator('.selected-models .selection-chip').inner_text()
    assert console_errors == []

    browser.close()

print('PASS: remaining ranking pages support correct default and reverse sorting.')
