---
target: kitchen-modules
total_score: 21
p0_count: 0
p1_count: 2
timestamp: 2026-06-25T01-30-46Z
slug: kitchen-modules
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | No loading/success feedback on recipe ingredient add; InvoiceLineItems has no save confirmation |
| 2 | Match System / Real World | 3 | Good Spanish; "Costo/u" is cryptic; "Líneas de detalle" is jargon |
| 3 | User Control and Freedom | 2 | Can't undo ingredient removal; can't reorder line items |
| 4 | Consistency and Standards | 3 | RecipeEditor uses table, InvoiceLineItems uses cards — inconsistent |
| 5 | Error Prevention | 2 | InvoiceLineItems allows empty descriptions; subtotal field conflicts with line item totals |
| 6 | Recognition Rather Than Recall | 2 | SalesByProductReport has no date context; RecipeEditor select has no search |
| 7 | Flexibility and Efficiency | 1 | No keyboard shortcuts; no bulk operations; no search in selects |
| 8 | Aesthetic and Minimalist Design | 3 | Clean but underutilizes space; KitchenSalesWidget too minimal |
| 9 | Error Recovery | 2 | Errors shown far from source; no field-level highlighting |
| 10 | Help and Documentation | 1 | No contextual help; empty states dead-end |
| **Total** | | **21/40** | **Acceptable** |

## Anti-Patterns Verdict

**LLM assessment**: No AI slop. Components use token system correctly. Issue is scaffolding-level completion, not visual anti-patterns.

**Deterministic scan**: 0 findings. Clean pass.

## Priority Issues

### [P1] Empty states don't guide — they dead-end
RecipeEditor, SalesByProductReport, KitchenSalesWidget all have minimal or no guidance for first-time users.

### [P1] InvoiceLineItems wastes space with card-per-row
Each line item wrapped in bordered card. 3-line invoice = ~400px. RecipeEditor does same thing in table format more efficiently.

### [P2] KitchenSalesWidget underuses dashboard space
Two lines of text in a card that could hold daily comparison, top 3 products, pending cobros.

### [P2] SalesByProductReport lacks date filtering
All-time data with no period context or filter. Can't compare months.

### [P2] Inconsistent patterns between RecipeEditor and InvoiceLineItems
Same data entry task, different UI patterns. Violates design principle #4.

## Persona Red Flags

**Jordan**: No explanation of what Receta section does. "Costo/u" abbreviation. Margin without context.
**Casey**: Line items ~200px each on mobile. Delete buttons under 44px. Product select unwieldy.
**Alex**: No keyboard shortcuts. No bulk paste. Native select instead of searchable combobox.

## Minor Observations

- RecipeEditor delete button 14px — below 44px touch target
- InvoiceLineItems delete button 32px — still below 44px
- Cost summary wraps unpredictably on narrow screens
- Duplicate subtotal source in InvoiceForm (line items vs manual field)
