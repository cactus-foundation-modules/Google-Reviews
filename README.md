<p align="center">
  <img src="module-art.webp" alt="Google Reviews" width="640" />
</p>

# Google Reviews

A [Cactus](https://github.com/usersaynoso/cactus-foundation) module that brings your Google reviews onto your own site.

It finds your business on Google, pulls its reviews in by itself every day, hides anything under the star rating you choose, and shows them wherever you drop the **Google Reviews** block - as a carousel that slides along on its own, a one-at-a-time spotlight, a steady ticker, a grid, a wall of quotes, a list, or just a rating badge.

## What you need

- A **Google Cloud API key** with the **Places API (New)** switched on and billing set up on its project. A daily check sits comfortably inside Google's monthly allowance. Restrict the key to the Places API (New).
- Cactus core **0.5.1946** or newer.

## Setting it up

1. Install the module from **Modules**.
2. Open **Settings → General → Google Reviews**.
3. Paste the API key and save.
4. Type your business name and town into **Find your business on Google**, pick it from the list, and save.
5. Press **Fetch reviews now**. After that it checks Google every day on its own; the frequency is on the same tab.
6. Add the **Google Reviews** block to any page.

## Choosing which reviews show

- **Hide reviews under** - the site-wide floor. A block can be stricter than this, never more lenient.
- **Skip reviews with no words** - drops the bare star ratings.
- **Hide** - any single review, from the list on the settings tab. It stays hidden through every future fetch.

### The five-review limit

Google hands over at most **five reviews per request**, chosen by its own idea of relevance, and there is no way to ask for more. By default the module shows exactly the five Google sent last. Tick **Keep reviews Google has stopped sending** and every review it has ever sent is kept, so the collection grows past five over time. Google's terms are not keen on sites storing its content, so that is a decision for the site owner.

## The block

The sidebar has three tabs.

- **Block** - display style, heading, introduction, how many reviews, lowest star rating, order, whether it moves on by itself and how often, arrows, dots, reviewer photos, dates, and the links to your Google page and to leave a review.
- **Appearance** - card style, shadow, corners, border, text and heading sizes, star size, quote mark, photo shape, cutting long reviews short, and fifteen colours (section, card, text, border, heading, introduction, dates, stars, empty stars, quote mark, links, arrow buttons, dots). Every colour picks from the site's own palette and takes a separate dark mode colour.
- **Layout** - reviews across on a computer, tablet and phone, spacing between and inside the cards, equal-height cards, alignment, arrow position, maximum width and space above and below.

The carousel shows three equal-height cards by default and slides from right to left at the interval you set. It pauses while the pointer is over it, has a pause button for anyone who would rather it kept still, and starts paused for visitors whose device asks for less motion.

## Licence

MIT
