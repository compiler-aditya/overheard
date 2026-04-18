# Allowed generic signatures for pairings

Pair specs reference signatures that must resolve to either a category slug, a landmark slug, or a generic subject on this list. This list is the canonical set of "things Gemini might reasonably return as a primary subject that aren't one of our 12 categories." It exists so the `pairing-signature-validator` hook has a closed-world to check against.

Add a signature here only when a pairing spec needs it and none of the 12 categories fits.

## Allowed generic subjects
- pigeon
- candle
- mirror
- key
- door
- plate
- fork
- book
- pen
- paper
- coffee-cup
- laptop
- ring
- letter

## Rules for adding
1. Use lowercase kebab-case.
2. Must be a thing Gemini 2.5 Flash is likely to return as a single-word or two-word primary subject.
3. Must not overlap with an existing category slug (`houseplant`, `appliance`, etc.). If it does, use the category slug instead.
