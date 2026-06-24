---
target: settings
total_score: 23
p0_count: 0
p1_count: 1
timestamp: 2026-06-24T20-20-21Z
slug: src-app-org-orgslug-settings-page-tsx
---
## Design Health Score — Dashboard

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Suspense skeletons present, no error boundaries |
| 2 | Match System / Real World | 3 | Good Spanish; passive empty states |
| 3 | User Control and Freedom | 2 | No undo, no cancel |
| 4 | Consistency and Standards | 3 | Consistent components; gradient colors leak |
| 5 | Error Prevention | 2 | No confirmation dialogs |
| 6 | Recognition Rather Than Recall | 3 | Nav labeled; quick actions text-only |
| 7 | Flexibility and Efficiency | 1 | No shortcuts, no bulk, no search |
| 8 | Aesthetic and Minimalist Design | 3 | Clean but stat card wall |
| 9 | Error Recovery | 2 | No error boundaries |
| 10 | Help and Documentation | 1 | No contextual help |
| **Total** | | **23/40** | **Acceptable** |

### Anti-Patterns
- 2x ai-color-palette: from-purple-500 gradient (lines 33, 106)
- Identical card grid: 8 stat cards in two rows

### Priority Issues
- [P1] Stat cards identical grid — bans violation
- [P1] No search/filter on vehicles
- [P2] Hardcoded bg-blue-600 button
- [P2] Quick Actions = bulleted list
- [P2] Settings sparse

### Persona Red Flags
- Alex: No keyboard shortcuts, no search, quick actions slower than sidebar
- Casey: Stat numbers not abbreviated, quick action links too small
- Jordan: Stat wall with no guidance, empty states not actionable
