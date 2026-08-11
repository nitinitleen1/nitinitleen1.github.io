# Chimes-inspired redesign — design

**Date:** 2026-08-12
**Repo:** nitinitleen1.github.io
**Reference:** https://marinabudarina.github.io/chimes/

## Goal

Rebuild the visual language of the personal site around a tactile, interactive hero —
verlet-simulated hanging strands the visitor can part with cursor or touch — while keeping
the existing Jekyll content model, warm-paper palette, and archive pages intact.

This is a presentation-layer rewrite. No content migration, no plugin changes, no build-step
additions, no framework.

## Decisions (agreed with user)

| Question | Decision |
|---|---|
| Scope | Full redesign, chimes-inspired |
| Palette | Keep warm paper, add depth |
| Home | Hero + Writing + Shelves, archives kept as separate pages |
| Hero canvas | Hanging strings / chimes (verlet physics) |
| About | Overlay modal |
| Audio | Chime on strand strike, muted by default |
| Mobile / reduced motion | Keep physics, touch-driven (hard-disabled under `prefers-reduced-motion`) |

## Architecture

| File | Change |
|---|---|
| `_layouts/default.html` | Sidebar → sticky top nav. Adds canvas mount, About modal markup, JS includes. |
| `_layouts/home.html` | Rewritten: anchored sections `#home`, `#writing`, `#shelf`. |
| `_layouts/post.html` | Restyled; TOC script kept, structure unchanged. |
| `blogs.html`, `bookshelf.html`, `papershelf.html`, `courses.html`, `talks.html` | Restyled via CSS only. |
| `static/css/site.css` | Rewritten. Existing tokens extended, not replaced. |
| `static/js/chimes.js` | **New.** Verlet strands + WebAudio chime. |
| `static/js/site.js` | **New.** Scroll reveals, About modal, nav scrollspy. |

Navigation on inner pages links back to home anchors (`/#writing`). "About" is a button
that opens the modal, available on every page.

## Hero canvas — `chimes.js`

Strands hang from the top edge of the hero, full-bleed.

```
strand = chain of ~18 points, point[0] pinned to top
verlet:     v = (p - p.old) * damping
            p.old = p
            p += v + gravity
constraint: 6 relaxation passes, fixed segment length
pointer:    points within radius R pushed by pointer delta,
            falloff = 1 - (d/R)
```

- Strand count scales with viewport width (~28 desktop, ~14 phone).
- Pointer and touch both drive the simulation.
- Rendered as thin tapered ink lines at low alpha, with a single bead near each strand's
  lower third — reads as a beaded curtain without per-bead rigid bodies.
- `IntersectionObserver` pauses the RAF loop when the hero leaves the viewport.
- `prefers-reduced-motion` → simulation disabled, strands drawn once at rest.

### Audio

WebAudio synthesis, zero audio files.

- Strike detected when the pointer crosses a strand's rest-x with velocity above threshold.
- Triangle oscillator → exponential decay envelope, ~1.2s tail.
- Pitch from a pentatonic scale indexed by strand position, so sweeping left-to-right
  plays a run.
- **Muted by default.** Speaker toggle bottom-right; state persisted in `localStorage`.
- `AudioContext` created lazily on first unmute, avoiding browser autoplay warnings.

## Palette — warm paper + depth

Existing tokens stay. Added:

```css
--accent-amber:   #c8922f;   /* golden courtyard */
--accent-lacquer: #9c3b28;   /* sparing — active nav, strand beads */
--paper-raise:    #faf7f0;   /* lifted surfaces above --bg */
--shadow-1: 0 1px 2px rgba(36,34,27,.06);
--shadow-2: 0 8px 24px rgba(36,34,27,.09);
--shadow-3: 0 24px 60px rgba(36,34,27,.12);
```

Tactility comes from layering: post rows and shelf cards sit on `--paper-raise` with
`--shadow-1`, lifting to `--shadow-2` and rising 2px on hover. Hero headline uses
display-scale Newsreader (`clamp(3.5rem, 9vw, 7rem)`) with tight tracking.

## Motion — `site.js`

- **Scroll reveal:** one `IntersectionObserver` adds `.in` → staggered fade-up, 60ms per
  child; elements unobserved after firing.
- **About modal:** full-screen overlay, fade + scale-in, focus trap, Esc to close,
  `aria-modal`, body scroll lock.
- **Scrollspy:** active nav item tracks the visible section on home.
- **Hover:** post rows and nav items get spring-eased transforms. No custom cursor.

All motion respects `prefers-reduced-motion`: reveals become instant, transforms drop.

## Out of scope

- Country-selector metaphor, per-section audio, beaded curtains on every section — these
  fight a text-heavy technical blog.
- Any framework or build-step addition. Vanilla JS, two files, no dependencies.
- Post reading experience stays conservative; the drama lives on the home page.

## Acceptance criteria

1. `bundle exec jekyll build` succeeds with no new warnings.
2. Home renders hero with animated strands; dragging the cursor parts them and they settle.
3. Audio is silent until the speaker toggle is clicked; preference survives reload.
4. `#writing` and `#shelf` sections reveal on scroll; nav highlights the visible section.
5. About modal opens from any page, traps focus, closes on Esc and on backdrop click.
6. `/blogs/`, `/bookshelf/`, `/papershelf/`, `/courses/`, `/talks/` and a post page all
   render correctly under the new nav and palette.
7. With `prefers-reduced-motion: reduce`, no simulation runs and no fade-up animations play.
8. Layout holds at 375px, 768px, and 1440px widths.
