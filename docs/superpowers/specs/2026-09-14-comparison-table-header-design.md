# Comparison table header design

## Objective

Keep model names and reasoning-effort controls visible while a desktop visitor
reviews rows farther down the comparison table. The global site header must
remain fixed, and the table must retain horizontal scrolling for comparisons
with multiple models.

## Design

The comparison table will become a bounded scroll region on desktop. Its column
header cells will stick to the top of that region, while the row-label column
continues to stick to the left during horizontal scrolling. The top-left cell
will have the appropriate stacking order where those two sticky areas meet.

The region's maximum height will be based on the viewport, leaving room for the
site header and surrounding page context. Mobile continues to use the existing
comparison cards and is unchanged.

## Verification

A browser regression check will scroll within the comparison table and assert
that its header remains visible below the global navigation. Existing comparison
selection and horizontal-scroll behavior remain covered by the current browser
flow tests.
