"""Check raw speed parity, compact context, and retained-catalog flows."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get('ASTRA_TEST_URL', 'http://localhost:4321')

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(BASE + '/models', wait_until='networkidle')
    row = page.locator('.leaderboard-row').filter(has_text='GPT-6 Astra')
    speed = row.locator('.td-speed').inner_text()
    assert speed == '13–48 tok/s', speed
    row.click()
    drawer = page.locator('.subtask-expanded-row')
    expect(drawer.locator('.subtask-spec-grid > div').filter(has_text='Speed').locator('strong')).to_have_text(speed)
    expect(drawer).to_contain_text('1.05M')
    Path('artifacts').mkdir(exist_ok=True)
    page.screenshot(path='artifacts/pipeline-speed-desktop.png')
    page.set_viewport_size({'width': 390, 'height': 844})
    page.goto(BASE + '/models', wait_until='networkidle')
    card = page.locator('.mobile-model-row-card').filter(has_text='GPT-6 Astra')
    card.get_by_role('button', name='Expand', exact=False).click()
    expect(card.locator('.mobile-expanded-specs > div').filter(has_text='Speed').locator('strong')).to_have_text(speed)
    expect(card).to_contain_text('1.05M')
    page.screenshot(path='artifacts/pipeline-speed-mobile.png')
    page.goto(BASE + '/cost', wait_until='networkidle')
    page.get_by_role('combobox', name='Model', exact=True).select_option('claude-sonnet-5')
    page.get_by_label('Uncached input tokens per request', exact=True).fill('1000')
    page.get_by_label('Output tokens per request', exact=True).fill('500')
    page.get_by_label('Number of requests', exact=True).fill('10')
    page.get_by_role('button', name='Calculate cost', exact=True).click()
    expect(page.get_by_role('heading', name='$0.07', exact=True)).to_be_visible()
    assert not errors, errors
    browser.close()
print('Passed: desktop/mobile raw speed parity, context formatting, and cost calculation.')
