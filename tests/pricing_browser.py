"""Pricing flows against the running local Astro server."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

base = os.environ.get('ASTRA_TEST_URL', 'http://localhost:4321')
artifacts = Path('artifacts')
artifacts.mkdir(exist_ok=True)
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))

    def visit(path):
        response = page.goto(base + path, wait_until='networkidle')
        assert response and response.status == 200, path

    visit('/cost')
    assert all(v == '' for v in page.locator('main input[type=number]').evaluate_all('(els) => els.map(e => e.value)'))
    page.get_by_role('button', name='Calculate cost', exact=True).click()
    expect(page.get_by_role('alert')).to_have_text('Choose a model.')
    page.get_by_role('combobox', name='Model', exact=True).select_option('claude-sonnet-5')
    page.get_by_role('button', name='Calculate cost', exact=True).click()
    expect(page.get_by_role('alert')).to_contain_text('Enter your input tokens')
    page.get_by_label('Uncached input tokens per request', exact=True).fill('1000')
    page.get_by_label('Output tokens per request', exact=True).fill('500')
    page.get_by_label('Number of requests', exact=True).fill('10')
    page.get_by_text('Optional provider-specific usage', exact=True).click()
    page.get_by_label('Cached input tokens per request', exact=True).fill('2000')
    page.get_by_role('button', name='Calculate cost', exact=True).click()
    expect(page.get_by_role('heading', name='$0.074', exact=True)).to_be_visible()
    expect(page.locator('[aria-live=polite]').get_by_text('Based on your inputs', exact=False)).to_be_visible()
    page.screenshot(path=str(artifacts / 'pricing-calculator-result.png'), full_page=True)
    page.get_by_role('combobox', name='Model', exact=True).select_option('gemini-2-5-pro')
    expect(page.get_by_label('Uncached input tokens per request', exact=True)).to_have_value('')
    assert page.get_by_label('Web searches per request', exact=True).count() == 0
    page.get_by_label('Uncached input tokens per request', exact=True).fill('200001')
    page.get_by_label('Output tokens per request', exact=True).fill('1000')
    page.get_by_label('Number of requests', exact=True).fill('1')
    page.get_by_role('button', name='Calculate cost', exact=True).click()
    expect(page.get_by_role('heading', name='$0.515003', exact=True)).to_be_visible()
    page.get_by_role('combobox', name='Model', exact=True).select_option('hy4-preview')
    for label in ['Uncached input tokens per request', 'Output tokens per request', 'Number of requests']:
        page.get_by_label(label, exact=True).fill('1')
    page.get_by_role('button', name='Calculate cost', exact=True).click()
    expect(page.get_by_role('alert')).to_contain_text('Pricing unavailable')

    visit('/pricing')
    page.get_by_label('Search model or provider').fill('Gemini 2.5')
    expect(page.locator('tbody tr')).to_have_count(3)
    expect(page.locator('tbody tr').first).to_contain_text('Gemini 2.5 Flash-Lite')
    page.get_by_role('combobox', name='Sort pricing', exact=True).select_option('blended')
    expect(page.get_by_role('columnheader', name='Blended / 1M')).to_be_visible()
    expect(page.locator('tbody tr').last).to_contain_text('.10 up to 200k · .20 above')
    expect(page.locator('.mobile-pricing-list')).to_be_hidden()
    page.screenshot(path=str(artifacts / 'pricing-comparison-desktop.png'), full_page=True)

    visit('/models/gemini-2-5-pro')
    expect(page.locator('#pricing')).to_contain_text('200,001')
    expect(page.locator('#pricing')).to_contain_text('Google Gemini API pricing')
    visit('/compare?models=claude-sonnet-5,gemini-2-5-pro')
    expect(page.locator('.comparison-table')).to_contain_text('.10 up to 200k · .20 above')
    expect(page.locator('.mobile-comparison')).to_be_hidden()
    assert 'Estimated task cost' not in page.locator('main').inner_text()
    visit('/compare/claude-sonnet-5-vs-gemini-2-5-pro')
    selector = page.get_by_role('combobox', name='Add a model or effort', exact=True)
    expect(selector.locator('option[value="claude-opus-5"]')).to_have_count(1)
    selector.select_option('claude-opus-5')
    expect(page.locator('.comparison-table thead')).to_contain_text('Claude Opus 5')
    page.route('**/catalog.json', lambda route: route.abort())
    visit('/compare/claude-sonnet-5-vs-gemini-2-5-pro')
    expect(page.get_by_role('status')).to_contain_text('Additional models could not load')
    expect(page.locator('.comparison-table')).to_contain_text('Claude Sonnet 5')
    page.unroute('**/catalog.json')
    visit('/models')
    expect(page.get_by_role('columnheader', name='INPUT / 1M TOKENS', exact=False)).to_be_visible()
    visit('/find')
    page.get_by_role('button', name='Continue', exact=True).click()
    page.get_by_role('button', name='Continue', exact=True).click()
    expect(page.get_by_text('Up to $1 / 1M input tokens', exact=True)).to_be_visible()
    page.get_by_role('button', name='Find my matches', exact=True).click()
    assert 'Estimated task cost' not in page.locator('main').inner_text()
    visit('/')
    expect(page.get_by_role('heading', name='Compare model pricing', exact=True)).to_be_visible()
    text = page.locator('main').inner_text().lower()
    assert '20 questions' not in text and '/ month' not in text

    page.set_viewport_size({'width': 390, 'height': 844})
    visit('/pricing')
    expect(page.locator('.pricing-desktop-table')).to_be_hidden()
    expect(page.locator('.mobile-pricing-list')).to_be_visible()
    assert page.locator('.mobile-pricing-card').count() > 0
    page.get_by_label('Search model or provider').fill('Gemini 2.5')
    assert page.locator('.mobile-pricing-card').count() > 0
    expect(page.locator('.mobile-pricing-card').first).to_contain_text('Gemini 2.5')
    page.get_by_role('combobox', name='Sort pricing', exact=True).select_option('blended')
    expect(page.locator('.mobile-pricing-card').first).to_contain_text('Blended / 1M')
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    page.screenshot(path=str(artifacts / 'pricing-mobile-pricing.png'), full_page=True)

    visit('/compare?models=claude-sonnet-5,gemini-2-5-pro')
    expect(page.locator('.comparison-desktop-table')).to_be_hidden()
    expect(page.locator('.mobile-comparison')).to_be_visible()
    core_card = page.locator('.mobile-metric-card').first
    expect(core_card).to_contain_text('Claude Sonnet 5')
    expect(core_card).to_contain_text('Gemini 2.5 Pro')
    expect(page.get_by_role('heading', name='Compared models', exact=True)).to_be_visible()
    assert page.locator('.mobile-effort-control select').count() > 0
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    page.screenshot(path=str(artifacts / 'pricing-mobile-compare.png'), full_page=True)

    page.set_viewport_size({'width': 320, 'height': 720})
    visit('/pricing')
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    visit('/compare?models=claude-sonnet-5,gemini-2-5-pro')
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')

    for path in ['/cost?models=claude-sonnet-5', '/models/gemini-2-5-pro']:
        page.set_viewport_size({'width': 390, 'height': 844})
        visit(path)
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), path
        page.screenshot(path=str(artifacts / ('pricing-mobile-' + path.split('?')[0].split('/')[-1] + '.png')), full_page=True)
    assert not errors, errors
    browser.close()
print('PASS: browse, compare, find, pricing, calculator, unavailable rates, tier selection and mobile layouts; no browser errors.')
