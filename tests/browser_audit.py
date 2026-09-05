"""Axe accessibility checks and internal-link validation."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

base = os.environ.get('ASTRA_TEST_URL', 'http://localhost:4321')
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    page.emulate_media(reduced_motion='reduce')
    reports = []
    for theme in ['light', 'dark']:
        for route in ['/', '/models', '/compare', '/find', '/cost', '/models/quill-pro', '/rankings/cheap', '/methodology']:
            page.goto(base + route)
            page.wait_for_load_state('networkidle')
            page.evaluate('(theme) => document.documentElement.dataset.theme = theme', theme)
            page.add_script_tag(path='node_modules/axe-core/axe.min.js')
            result = page.evaluate("async () => await axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a','wcag2aa','wcag21aa']}})")
            for violation in result['violations']:
                reports.append({'route': route, 'theme': theme, 'rule': violation['id'], 'impact': violation['impact'], 'nodes': [{'target': n['target'], 'summary': n.get('failureSummary')} for n in violation['nodes']]})
    Path('artifacts/accessibility.json').write_text(json.dumps(reports, indent=2), encoding='utf-8')
    print(json.dumps(reports, indent=2))
    assert not reports, 'Accessibility violations found'
    # Follow all internal paths in the generated production HTML, including pair links.
    import re
    paths = set()
    for html in Path('dist').rglob('*.html'):
        for href in re.findall(r'href="(/[^"#?]*)(?:[?#][^"]*)?"', html.read_text(encoding='utf-8')):
            if not href.startswith('/_astro/'):
                paths.add(href)
    for path in sorted(paths):
        response = page.request.get(base + path)
        assert response.status == 200, f'Broken internal link: {path}: {response.status}'
    print(f'PASS: 16 page/theme accessibility audits, {len(paths)} internal links')
    browser.close()
