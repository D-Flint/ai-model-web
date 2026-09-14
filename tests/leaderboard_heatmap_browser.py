"""Verify leaderboard score heatmaps only mark each metric's top values."""
import os
from playwright.sync_api import sync_playwright

BASE = os.environ.get('ASTRA_TEST_URL', 'http://localhost:4321')
METRICS = [
    'reasoning',
    'coding',
    'agentic',
    'mathematics',
    'dataAnalysis',
    'language',
    'instructionFollowing',
]


def assert_heatmap_ranks(page):
    for metric in METRICS:
        cells = page.locator(f'.td-{metric}')
        values = [
            float(value)
            for value in cells.all_inner_texts()
            if value.strip() != '—'
        ]
        cutoff = sorted(values, reverse=True)[9] if len(values) >= 10 else None
        expected = [
            value for value in values if cutoff is None or value >= cutoff
        ]
        highlighted = page.locator(f'.td-{metric}.cell-score-heatmap').count()
        assert highlighted == len(expected), (
            f'{metric}: expected {len(expected)} highlighted values, got {highlighted}'
        )


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    page.goto(BASE + '/models', wait_until='networkidle')
    assert_heatmap_ranks(page)

    page.get_by_label('Search models', exact=True).fill('GPT-5.6')
    page.wait_for_timeout(100)
    assert_heatmap_ranks(page)
    browser.close()

print('Passed: leaderboard heatmaps follow full and filtered top-ten cutoffs.')
