-- Google Reviews module: one settings row and the reviews Google last handed us.
-- All DDL is idempotent so run-module-migrations can safely re-apply it.

CREATE TABLE IF NOT EXISTS "grv_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    -- A Google Maps Platform key with the Places API (New) switched on.
    -- Encrypted at rest; the "_encrypted" suffix is what core's key rotation
    -- looks for, so a rotated site key re-encrypts this column with the rest.
    "api_key_encrypted" TEXT,
    -- Google's own identifier for the business ("ChIJ..."). The only piece of
    -- Google's content its terms allow a site to keep indefinitely.
    "place_id" TEXT,
    -- What Google calls the business, its overall rating, how many ratings
    -- that rating is built from, and the link to its page on Google Maps.
    -- Refreshed on every pull alongside the reviews.
    "place_name" TEXT,
    "place_maps_url" TEXT,
    "place_rating" NUMERIC(2, 1),
    "place_rating_count" INTEGER,
    -- The site-wide floor: reviews under this many stars are never shown,
    -- whatever a block asks for. 1 shows everything. A block can be stricter.
    "min_rating" INTEGER NOT NULL DEFAULT 1,
    -- Skip reviews that are a star rating with no words attached.
    "require_text" BOOLEAN NOT NULL DEFAULT false,
    -- Google returns at most five reviews per request. false (the default)
    -- keeps exactly what Google returned last time and lets the rest go, which
    -- is what Google's terms expect. true keeps every review it has ever seen,
    -- so the collection grows past five over time. The owner chooses.
    "keep_history" BOOLEAN NOT NULL DEFAULT false,
    "last_fetched_at" TIMESTAMP(3),
    -- Plain-English reason the last pull failed, cleared on the next success.
    "last_error" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "grv_settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "grv_settings_singleton_check" CHECK ("id" = 'singleton'),
    CONSTRAINT "grv_settings_min_rating_check" CHECK ("min_rating" BETWEEN 1 AND 5)
);
INSERT INTO "grv_settings" ("id") VALUES ('singleton') ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS "grv_reviews" (
    -- Google's resource name for the review ("places/<id>/reviews/<id>"),
    -- stable across pulls, so a re-fetch updates rather than duplicates.
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "author_url" TEXT,
    "author_photo_url" TEXT,
    "rating" INTEGER NOT NULL,
    "text" TEXT NOT NULL DEFAULT '',
    "language_code" TEXT,
    "published_at" TIMESTAMP(3),
    -- Google's own "3 weeks ago", kept as a fallback for a review whose
    -- publish time Google did not send.
    "relative_time" TEXT,
    "review_url" TEXT,
    -- Hidden by the owner on the settings tab. Survives every re-fetch.
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "grv_reviews_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "grv_reviews_rating_check" CHECK ("rating" BETWEEN 1 AND 5)
);
CREATE INDEX IF NOT EXISTS "grv_reviews_place_published_idx" ON "grv_reviews" ("place_id", "published_at" DESC);
