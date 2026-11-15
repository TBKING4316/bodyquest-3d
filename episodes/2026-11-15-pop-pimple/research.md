# Research — pop-pimple (What Happens If You Pop A Pimple?)

Date: 2026-11-15 · Mode B daily run · pipeline: faceless-shorts deep-dive (SOFTWARE_GL)

## Idea selection
- facts-bank fast path checked first: highest-score unused topic in topics.yaml is
  "What happens if you drink only cold water?" (74) — has `facts/cold-water.json` but NO
  `facts/cold-water.shots.js` (not QA'd) → fast path unavailable.
- websearch API down today (HTTP 402, as on 2026-11-11) → research done via direct fetches of
  authoritative sources (NHS.uk, Nemours KidsHealth, PMC/Europe PMC).
- Shortlist scored (audience pull / freshness / distinct angle / source availability /
  visual potential / brand fit):
  1. **What happens if you pop a pimple? — 84** ← picked. Huge evergreen pull (pimple-popping
     genre), myth-bust + gross-but-fascinating pillars, brand-new visual territory (face close-up,
     inside-the-follicle macro, vein map toward the brain).
  2. What happens if you hold in a fart? — 71: weaker sourcing for the twist available today;
     gut journey too close to swallow-gum's visual treatment.
  3. What happens if you stop drinking water? — 70: overlaps unused cold-water + the no-water
     project already in the project drawer.
- Dedupe: `ledger.py check` to run; compared by meaning against the last 5 episodes
  (sneeze/pressure, sleep deprivation, knuckle joints, gum pass-through, pee retention) — no
  overlap in idea, organ system or visual treatment.

## Verified claims (all with dated sources; see pop-pimple.claims.csv)
1. Pore blocked by excess oil + dead skin cells → bacteria grow → inflammation and pus.
   NHS "Acne" (reviewed 22 Sep 2026); KidsHealth "Acne" (Nov 2021).
2. Popping pushes pus deeper → more swelling and redness; scabs; permanent pits/scars.
   KidsHealth "Should I Pop My Pimple?" (reviewed Oct 2018); NHS (Sep 2026) "do not pick or
   squeeze spots because this can cause scars".
3. Facial danger triangle: valveless veins communicate with the cavernous sinus; infections
   there can rarely extend intracranially (orbital cellulitis, abscess, septic cavernous sinus
   thrombosis — uncommon but serious). Cureus 18(7):e112359 (9 Jul 2026); case reports
   J Emerg Med 53(1) 2017 (PMID 28408235). Script hedges with "very rarely".
4. Fix: leave it alone (heals on its own, no scar); 5% benzoyl peroxide gel 1-2x/day dries it
   faster. KidsHealth popzit (Oct 2018); NHS (Sep 2026).

## Visual plan (Deep Dive 3D)
bathroom mirror (hero squeezes, POV-ish) → x-ray face (pore zone lights up) → MACRO inside the
pore (clog plug, bacteria multiply, pus floods, wall bulges) → fingers press, wall breaks SIDEWAYS,
pus pushes deeper → red halo grows (swelling) → x-ray face with danger triangle drawn (gold) +
valveless vein paths glow up toward the skull → rare-clot caveat (dark red bead in vein, "very
rarely") → calm bathroom close (patience, benzoyl peroxide pill) → clear-skin payoff.

## Health-topic discipline
No medical advice beyond sourced OTC fact (benzoyl peroxide 5%); danger-triangle claim hedged
("very rarely"); no gore; scare framed as "don't do this, here's the evidence".
