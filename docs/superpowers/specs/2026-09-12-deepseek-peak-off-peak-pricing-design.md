# DeepSeek peak and off-peak pricing

## Scope

Show DeepSeek API peak and off-peak input, cached-input, and output rates in the model detail pricing section. Keep existing single-rate rendering for providers without scheduled pricing.

## Design

Extend the validated API pricing shape with optional labeled pricing periods. Each period contains the same rate categories as a pricing tier and preserves a source on every rate. `ApiPricing` will expose DeepSeek's official peak/off-peak schedule, while the existing tier rates remain the default rates used by comparison and cost calculation.

The detail component will render a compact “Peak and off-peak rates” section beneath the tier rate list. Each period is labeled, rates are shown per 1M tokens, and the existing source/freshness component is reused. The official DeepSeek values are $0.003/$0.15/$0.60 off-peak and $0.006/$0.30/$1.20 peak for cached input/cache-miss input/output respectively.

## Verification

Add schema/data assertions for scheduled rates and component tests for the labels and values. Run type checking, linting, unit tests, and production build.
