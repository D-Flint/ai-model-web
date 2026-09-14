# Leaderboard Top-Ten Heatmap Design

## Objective

Restrict each green leaderboard heatmap column to its top ten displayed values.

## Behavior

- With no search, organization, or open-weights filter, rank all catalog rows.
- With any of those filters active, rank only the filtered rows.
- Rank each score metric independently in descending numeric order.
- Ignore missing values.
- Include values tied at the tenth-place cutoff.
- Replace the existing fixed score threshold; do not change sorting, filtering, or gradient styling.

## Implementation and verification

Add a small rank-membership helper near the leaderboard component, use it for metric cell class and style selection, and add unit coverage for full-catalog, filtered, null, and cutoff-tie cases. Run the targeted unit test plus type checks and linting.
