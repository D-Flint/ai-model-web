"""Focused responsive checks for comparison and API pricing cards."""
import os
from pathlib import Path

from playwright.sync_api import expect, sync_playwright


base = os.environ.get('ASTRA_TEST_URL', 'http://localhost:4321')
artifacts = Path('artifacts')
artifacts.mkdir(exist_ok=True)

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1024, 'height': 900})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))

    def visit(path):
        response = page.goto(base + path, wait_until='networkidle')
        assert response and response.status == 200, path

    visit('/pricing')
    expect(page.locator('.pricing-desktop-table')).to_be_visible()
    expect(page.locator('.mobile-pricing-list')).to_be_hidden()
    page.screenshot(path=str(artifacts / 'desktop-pricing-table-1024.png'))

    visit('/compare?models=claude-sonnet-5,gemini-2-5-pro')
    expect(page.locator('.comparison-desktop-table')).to_be_visible()
    expect(page.locator('.mobile-comparison')).to_be_hidden()
    page.screenshot(path=str(artifacts / 'desktop-comparison-table-1024.png'))

    page.set_viewport_size({'width': 390, 'height': 844})
    visit('/pricing')
    expect(page.locator('.pricing-desktop-table')).to_be_hidden()
    expect(page.locator('.mobile-pricing-list')).to_be_visible()
    assert page.locator('.mobile-pricing-card').count() > 0
    page.get_by_label('Search model or provider').fill('Gemini 2.5')
    assert page.locator('.mobile-pricing-card').count() > 0
    expect(page.locator('.mobile-pricing-card').first).to_contain_text('Gemini 2.5')
    page.get_by_role('combobox', name='Sort pricing', exact=True).select_option(
        'blended'
    )
    expect(page.locator('.mobile-pricing-card').first).to_contain_text(
        'Blended / 1M'
    )
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    page.screenshot(path=str(artifacts / 'mobile-pricing-cards-viewport-390.png'))
    page.screenshot(
        path=str(artifacts / 'mobile-pricing-cards-390.png'), full_page=True
    )

    visit('/compare?models=claude-sonnet-5,gemini-2-5-pro')
    expect(page.locator('.comparison-desktop-table')).to_be_hidden()
    expect(page.locator('.mobile-comparison')).to_be_visible()
    expect(
        page.get_by_role('heading', name='Compared models', exact=True)
    ).to_be_visible()
    first_metric = page.locator('.mobile-metric-card').first
    expect(first_metric).to_contain_text('Claude Sonnet 5')
    expect(first_metric).to_contain_text('Gemini 2.5 Pro')
    assert page.locator('.mobile-effort-control select').count() > 0
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    page.screenshot(path=str(artifacts / 'mobile-comparison-cards-viewport-390.png'))
    page.screenshot(
        path=str(artifacts / 'mobile-comparison-cards-390.png'), full_page=True
    )

    page.set_viewport_size({'width': 320, 'height': 720})
    visit('/pricing')
    expect(page.locator('.mobile-pricing-list')).to_be_visible()
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    visit('/compare?models=claude-sonnet-5,gemini-2-5-pro')
    expect(page.locator('.mobile-comparison')).to_be_visible()
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')

    assert not errors, errors
    browser.close()

print('PASS: mobile comparison and pricing cards; desktop tables preserved')
