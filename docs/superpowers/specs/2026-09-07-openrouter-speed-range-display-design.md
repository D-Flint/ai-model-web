# OpenRouter Provider Speed Display

## Goal

Display OpenRouter throughput according to provider coverage:

- One provider: `N tok/s`.
- Multiple providers: `min–max tok/s`.

Keep speed score, ranking logic, and other model data unchanged.

## Data flow

1. Read healthy OpenRouter endpoint records.
2. Read finite positive `throughput_last_30m.p50` values.
3. Group values by `provider_name` so duplicate records from one provider do not create a false range.
4. Calculate one speed value per provider by averaging that provider's valid values.
5. Store min, max, midpoint, provider count, source, and retrieval date.
6. Render one value when provider count is one; render range when provider count is greater than one.

## Scope

Update OpenRouter throughput processing and shared speed display consumers. Do not change speed normalization, overall scoring, static fallback data, or unrelated UI.

## Verification

- Test one provider returns one display value.
- Test multiple providers return min/max range.
- Test unavailable and invalid endpoints are ignored.
- Run focused tests, `npm run check`, and relevant lint checks.
