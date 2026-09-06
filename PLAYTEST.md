# PLAYTEST

Primary feel: the active piece lives **above the grid** and slides left/right. Column-tap is only aim (or drop once that column is already aimed). Not the old tap-any-column-to-drop.

## Controls

- **← →** keyboard, on-screen arrows, or horizontal swipe: slide the piece across columns immediately.
- **Click a column:** aim there (piece, ghost, and column wash follow).
- **Drop:** ↓ / Space / **↓ Drop** / tap the active piece / click the column that is already aimed.
- Ghost sits on the **lowest empty cell** of the aimed column.

## Teach (first 10s)

1. Nigiri is already in the teach column. Held piece above the grid is also Nigiri.
2. One-liner (until first merge, then hide): `← → move · ↓ drop. Match to merge.`
3. L/R is free. Dropping in the wrong column **soft-bounces** back to the teach column (aim is not hard-locked).
4. Drop on the teach column: piece **falls** from the rail onto the cell stacked on that Nigiri, then merges → Maki.

Pass: a stranger slides L/R, drops once on the teach column, and merges without asking.

## Landing check (blocking)

A drop must visibly tween from the active piece **above the grid** down to the **lowest empty cell** in that column (stack on existing tiles; empty column = bottom row). Then merge if same tier.

Must not: stick mid-column, teleport, stay at the top, or end the tween above the real landing cell.

Verified locally (headless Chrome, sampled `.fall-tile` every 32ms):

- Teach column (seeded Nigiri on row 7): tween starts on the rail (`top ≈ 172`) and finishes on the stack cell (`top ≈ 649` vs cell `646`). Landing row **6**, then merge → Maki on row 7 (score 10). One-liner hides.
- Empty column after teach: tween starts on the rail (`top ≈ 203`) and finishes on the **bottom** cell (`top ≈ 737` vs cell `734`). Landing row **7**. No mid-column leftover.
- Wrong first drop: L/R away, Drop, piece soft-bounces back to the teach column; nothing is placed.
