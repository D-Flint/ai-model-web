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

    def assert_neutral_select_focus():
        selects = page.locator('select:visible')
        assert selects.count() > 0, page.url
        for index in range(selects.count()):
            select = selects.nth(index)
            select.focus()
            focus_style = select.evaluate(
                """element => {
                    const probe = document.createElement('span');
                    probe.style.color = 'var(--accent)';
                    document.body.appendChild(probe);
                    const result = {
                        accent: getComputedStyle(probe).color,
                        border: getComputedStyle(element).borderTopColor,
                        outline: getComputedStyle(element).outlineStyle,
                    };
                    probe.remove();
                    return result;
                }"""
            )
            assert focus_style['outline'] == 'none'
            assert focus_style['border'] != focus_style['accent']

    visit('/pricing')
    expect(page.locator('.pricing-desktop-table')).to_be_visible()
    expect(page.locator('.mobile-pricing-list')).to_be_hidden()
    assert_neutral_select_focus()
    page.screenshot(path=str(artifacts / 'desktop-pricing-table-1024.png'))

    visit('/compare?models=claude-sonnet-5,gemini-2-5-pro')
    expect(page.locator('.comparison-desktop-table')).to_be_visible()
    expect(page.locator('.mobile-comparison')).to_be_hidden()
    assert_neutral_select_focus()
    page.screenshot(path=str(artifacts / 'desktop-comparison-table-1024.png'))

    visit('/models')
    assert_neutral_select_focus()

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
    assert_neutral_select_focus()
    expect(page.locator('.mobile-pricing-card').first).to_contain_text(
        'Blended / 1M'
    )
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    page.screenshot(path=str(artifacts / 'mobile-pricing-cards-viewport-390.png'))
    page.screenshot(
        path=str(artifacts / 'mobile-pricing-cards-390.png'), full_page=True
    )

    visit('/compare?models=claude-fable-5-1:high,gemini-3-deep-think:high')
    expect(page.locator('.comparison-desktop-table')).to_be_hidden()
    expect(page.locator('.mobile-comparison')).to_be_visible()
    expect(
        page.get_by_role('heading', name='Compared models', exact=True)
    ).to_be_visible()
    first_metric = page.locator('.mobile-metric-card').first
    expect(first_metric).to_contain_text('Claude Fable 5.1')
    expect(first_metric).to_contain_text('Gemini 3 Deep Think')
    effort_selects = page.locator('.mobile-effort-select')
    expect(effort_selects).to_have_count(2)
    select_box = effort_selects.first.bounding_box()
    assert select_box and select_box['height'] >= 44 and select_box['width'] <= 180
    intelligence_before = first_metric.inner_text()
    effort_selects.first.select_option('medium')
    expect(effort_selects.first).to_have_value('medium')
    assert 'claude-fable-5-1:medium' in page.evaluate(
        'decodeURIComponent(location.search)'
    )
    assert first_metric.inner_text() != intelligence_before
    page.get_by_role('button', name='Toggle color theme').click()
    assert_neutral_select_focus()
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    page.locator('.mobile-compared-models').screenshot(
        path=str(artifacts / 'mobile-effort-selectors-390.png')
    )
    page.screenshot(path=str(artifacts / 'mobile-comparison-cards-viewport-390.png'))
    page.screenshot(
        path=str(artifacts / 'mobile-comparison-cards-390.png'), full_page=True
    )

    page.set_viewport_size({'width': 320, 'height': 720})
    visit('/pricing')
    expect(page.locator('.mobile-pricing-list')).to_be_visible()
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    visit('/compare?models=claude-fable-5-1:high,gemini-3-deep-think:high')
    expect(page.locator('.mobile-comparison')).to_be_visible()
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')

    assert not errors, errors
    browser.close()

print('PASS: mobile comparison and pricing cards; desktop tables preserved')
