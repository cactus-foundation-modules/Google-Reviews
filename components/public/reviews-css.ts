// The Google Reviews block's stylesheet, emitted once per page through core's
// SharedStyle however many blocks are on it.
//
// Every colour is a theme token with the block's own override in front of it
// (var(--grv-card-bg, var(--color-surface))), so an untouched block follows the
// site's light and dark palettes, and a picked colour - itself a light-dark()
// pair from the colour field - follows them too. Every class carries the grv-
// prefix: core publishes global utilities (.hide-mobile and friends) that a bare
// name could collide with.
//
// Breakpoints: tablet at 1024px and below, phone at 640px and below.

const CSS = `
.grv {
  --grv-per-view: var(--grv-cols, 3);
  background: var(--grv-section-bg, transparent);
  color: var(--grv-card-text, var(--color-text));
  padding-top: var(--grv-pad-top, 0);
  padding-bottom: var(--grv-pad-bottom, 0);
}
.grv__inner { max-width: var(--grv-max-width, none); margin: 0 auto; }

/* Header */
.grv__header { margin-bottom: calc(var(--grv-gap, 24px) * 1.25); }
.grv__header--left { text-align: left; }
.grv__header--center { text-align: center; }
.grv__header--right { text-align: right; }
.grv__heading { margin: 0 0 0.5rem; color: var(--grv-heading, var(--color-text)); line-height: 1.2; font-weight: 700; }
.grv--head-sm .grv__heading { font-size: 1.25rem; }
.grv--head-md .grv__heading { font-size: clamp(1.35rem, 2.2vw, 1.6rem); }
.grv--head-lg .grv__heading { font-size: clamp(1.6rem, 3vw, 2rem); }
.grv--head-xl .grv__heading { font-size: clamp(1.9rem, 4vw, 2.6rem); }
.grv__intro { margin: 0 0 0.75rem; color: var(--grv-intro, var(--color-text-secondary)); }
.grv__summary { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; color: var(--grv-meta, var(--color-text-secondary)); }
.grv__summary-score { font-size: 1.35em; font-weight: 700; color: var(--grv-heading, var(--color-text)); }

/* Stars: an empty row with a filled row clipped over it, so 4.7 draws as 4.7. */
.grv__stars { position: relative; display: inline-flex; line-height: 0; vertical-align: middle; }
.grv__stars-row { display: inline-flex; gap: 2px; }
.grv__stars-row svg { width: var(--grv-star-size, 18px); height: var(--grv-star-size, 18px); flex: 0 0 auto; }
.grv__stars-row--empty { color: var(--grv-star-empty, var(--color-border-strong)); }
.grv__stars-row--filled { position: absolute; inset: 0 auto 0 0; overflow: hidden; white-space: nowrap; color: var(--grv-star, var(--color-warning)); }

/* Cards */
.grv__card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  box-sizing: border-box;
  min-width: 0;
  padding: var(--grv-card-pad, 24px);
  border-radius: var(--grv-radius, 12px);
  border: var(--grv-border-width, 1px) solid var(--grv-card-border, var(--color-border));
  background: var(--grv-card-bg, var(--color-surface));
  color: var(--grv-card-text, var(--color-text));
  box-shadow: var(--grv-shadow, none);
  text-align: left;
}
.grv--align-center .grv__card { text-align: center; align-items: center; }
.grv--align-right .grv__card { text-align: right; align-items: flex-end; }
.grv--card-filled .grv__card { background: var(--grv-card-bg, var(--color-bg-subtle)); border-color: var(--grv-card-border, transparent); }
.grv--card-elevated .grv__card { border-color: var(--grv-card-border, transparent); --grv-shadow: 0 8px 24px color-mix(in srgb, var(--color-text) 10%, transparent); }
.grv--card-minimal .grv__card { background: var(--grv-card-bg, transparent); border-color: var(--grv-card-border, transparent); }
.grv--shadow-soft .grv__card { --grv-shadow: 0 2px 8px color-mix(in srgb, var(--color-text) 8%, transparent); }
.grv--shadow-medium .grv__card { --grv-shadow: 0 8px 24px color-mix(in srgb, var(--color-text) 12%, transparent); }
.grv--shadow-strong .grv__card { --grv-shadow: 0 16px 40px color-mix(in srgb, var(--color-text) 20%, transparent); }

.grv__quote { font-size: 3.5em; line-height: 0.6; height: 0.45em; font-family: Georgia, 'Times New Roman', serif; color: var(--grv-quote, var(--color-primary)); }
.grv__text { margin: 0; flex: 1 1 auto; line-height: 1.6; overflow-wrap: anywhere; }
.grv--text-sm .grv__text { font-size: 0.9rem; }
.grv--text-md .grv__text { font-size: 1rem; }
.grv--text-lg .grv__text { font-size: 1.15rem; }
.grv--italic .grv__text { font-style: italic; }
.grv--clamp .grv__text { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: var(--grv-clamp); line-clamp: var(--grv-clamp); overflow: hidden; }
.grv--equal.grv--clamp .grv__text { min-height: calc(1.6em * var(--grv-clamp)); }

.grv__author { display: flex; align-items: center; gap: 0.75rem; min-width: 0; }
.grv--align-center .grv__author { flex-direction: column; gap: 0.4rem; }
.grv--align-right .grv__author { flex-direction: row-reverse; }
.grv__photo { width: 40px; height: 40px; flex: 0 0 40px; object-fit: cover; border-radius: 50%; background: var(--color-bg-subtle); }
.grv--photo-rounded .grv__photo { border-radius: 8px; }
.grv--photo-square .grv__photo { border-radius: 0; }
.grv__photo--initial { display: inline-flex; align-items: center; justify-content: center; font-weight: 700; color: var(--color-primary); background: var(--color-primary-subtle); }
.grv__who { display: flex; flex-direction: column; min-width: 0; }
.grv__name { font-weight: 600; color: inherit; text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
a.grv__name:hover, a.grv__name:focus-visible { text-decoration: underline; }
.grv__meta { font-size: 0.85em; color: var(--grv-meta, var(--color-text-secondary)); }
.grv__card-link { color: var(--grv-link, var(--color-primary)); font-size: 0.85em; font-weight: 600; text-decoration: none; }
.grv__card-link:hover, .grv__card-link:focus-visible { text-decoration: underline; }

/* Grid, list and wall of quotes */
.grv__grid { display: grid; gap: var(--grv-gap, 24px); grid-template-columns: repeat(var(--grv-cols, 3), minmax(0, 1fr)); align-items: start; }
.grv--equal .grv__grid { align-items: stretch; }
.grv--list .grv__grid { grid-template-columns: minmax(0, 1fr); }
.grv__masonry { column-count: var(--grv-cols, 3); column-gap: var(--grv-gap, 24px); }
.grv__masonry > .grv__card { break-inside: avoid; margin-bottom: var(--grv-gap, 24px); }

/* Carousel and spotlight */
.grv--spotlight { --grv-per-view: 1; }
.grv--spotlight .grv__card { text-align: center; align-items: center; }
.grv--spotlight .grv__author { flex-direction: column; gap: 0.4rem; }
.grv__carousel { display: grid; grid-template-columns: minmax(0, 1fr); align-items: center; gap: 0.75rem; }
.grv__carousel--sides { grid-template-columns: auto minmax(0, 1fr) auto; }
.grv__viewport { overflow: hidden; min-width: 0; }
.grv__track {
  display: flex;
  gap: var(--grv-gap, 24px);
  transform: translateX(calc(var(--grv-index, 0) * -1 * (100% + var(--grv-gap, 24px)) / var(--grv-per-view)));
  transition: transform var(--grv-transition, 600ms) ease;
}
.grv__track.is-jumping { transition: none; }
.grv__slide { display: flex; flex: 0 0 calc((100% - (var(--grv-per-view) - 1) * var(--grv-gap, 24px)) / var(--grv-per-view)); min-width: 0; }
.grv__slide > .grv__card { flex: 1 1 auto; }

.grv__controls { display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-top: 1rem; flex-wrap: wrap; }
.grv__dots { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; }
.grv__arrow, .grv__pause {
  display: inline-flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; padding: 0; border-radius: 50%; cursor: pointer;
  border: 1px solid var(--grv-control-border, var(--color-border));
  background: var(--grv-control-bg, var(--color-surface));
  color: var(--grv-control, var(--color-text));
  transition: filter 150ms ease, transform 150ms ease;
}
.grv__pause { width: 32px; height: 32px; }
.grv__arrow:hover, .grv__pause:hover { filter: brightness(0.94); }
.grv__arrow:active { transform: scale(0.96); }
.grv__arrow svg, .grv__pause svg { width: 18px; height: 18px; }
.grv__pause svg { width: 14px; height: 14px; }
.grv__dot {
  width: 10px; height: 10px; padding: 0; border: 0; border-radius: 999px; cursor: pointer;
  background: var(--grv-dot, var(--color-border-strong));
  transition: width 200ms ease, background 200ms ease;
}
.grv__dot[aria-current='true'] { width: 24px; background: var(--grv-dot-active, var(--color-primary)); }
.grv__arrow:focus-visible, .grv__pause:focus-visible, .grv__dot:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }

/* Ticker: two copies of the reviews side by side, sliding half their width. */
.grv__ticker { overflow: hidden; -webkit-mask-image: linear-gradient(to right, transparent, black 6%, black 94%, transparent); mask-image: linear-gradient(to right, transparent, black 6%, black 94%, transparent); }
.grv__ticker-track { display: flex; gap: var(--grv-gap, 24px); width: max-content; padding-right: var(--grv-gap, 24px); animation: grv-ticker var(--grv-ticker-duration, 40s) linear infinite; }
.grv__ticker-track > .grv__slide { flex: 0 0 auto; width: clamp(260px, 28vw, 380px); }
.grv--pause-hover .grv__ticker:hover .grv__ticker-track,
.grv--pause-hover .grv__ticker:focus-within .grv__ticker-track,
.grv__ticker.is-paused .grv__ticker-track { animation-play-state: paused; }
@keyframes grv-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }

/* Badge */
.grv__badge { display: inline-flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; padding: 0.6rem 1rem; border-radius: 999px; border: var(--grv-border-width, 1px) solid var(--grv-card-border, var(--color-border)); background: var(--grv-card-bg, var(--color-surface)); color: var(--grv-card-text, var(--color-text)); text-decoration: none; box-shadow: var(--grv-shadow, none); }
a.grv__badge:hover, a.grv__badge:focus-visible { filter: brightness(0.97); }
.grv__badge-score { font-weight: 700; font-size: 1.1em; }
.grv__badge-count { color: var(--grv-meta, var(--color-text-secondary)); font-size: 0.9em; }
.grv--badge .grv__inner { display: flex; flex-direction: column; }
.grv--badge.grv--align-left .grv__inner { align-items: flex-start; }
.grv--badge.grv--align-center .grv__inner { align-items: center; }
.grv--badge.grv--align-right .grv__inner { align-items: flex-end; }

/* Footer links and the empty state */
.grv__footer { display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem; justify-content: center; margin-top: calc(var(--grv-gap, 24px) * 1.25); }
.grv__footer-link { color: var(--grv-link, var(--color-primary)); font-weight: 600; text-decoration: none; }
.grv__footer-link:hover, .grv__footer-link:focus-visible { text-decoration: underline; }
.grv__empty { margin: 0; text-align: center; color: var(--grv-meta, var(--color-text-secondary)); }
.grv__notice { margin: 0 0 1rem; padding: 0.6rem 0.9rem; border-radius: 8px; font-size: 0.85rem; background: var(--color-info-bg); color: var(--color-text); border: 1px solid var(--color-info-border); }

@media (max-width: 1024px) {
  .grv { --grv-per-view: var(--grv-cols-tablet, 2); }
  .grv__grid { grid-template-columns: repeat(var(--grv-cols-tablet, 2), minmax(0, 1fr)); }
  .grv__masonry { column-count: var(--grv-cols-tablet, 2); }
}
@media (max-width: 640px) {
  .grv { --grv-per-view: var(--grv-cols-mobile, 1); }
  .grv__grid { grid-template-columns: repeat(var(--grv-cols-mobile, 1), minmax(0, 1fr)); }
  .grv__masonry { column-count: var(--grv-cols-mobile, 1); }
  .grv__carousel--sides { gap: 0.4rem; }
  .grv__arrow { width: 34px; height: 34px; }
}
/* Spotlight shows one at a time at every width; the rules above would override it. */
.grv.grv--spotlight { --grv-per-view: 1; }
.grv--list .grv__grid { grid-template-columns: minmax(0, 1fr); }

@media (prefers-reduced-motion: reduce) {
  .grv__track, .grv__dot, .grv__arrow { transition: none; }
  .grv__ticker { overflow-x: auto; }
  .grv__ticker-track { animation: none; }
}
`

export function reviewsCss(): string {
  return CSS
}
