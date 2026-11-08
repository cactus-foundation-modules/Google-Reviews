'use client'

import { useCallback, useEffect, useState, type ReactElement } from 'react'
import { SettingsHeaderActions, SettingsHeaderStatus } from '@/components/admin/SettingsHeaderActions'
import { InfoTip } from '@/components/admin/InfoTip'
import { CronScheduleSetting } from '@/components/admin/CronScheduleField'
import type { AdminReview, AdminSettings, PlaceSearchResult } from '@/modules/google-reviews/lib/types'

const API_BASE = '/api/m/google-reviews'

interface SettingsView {
  settings: AdminSettings
  reviews: AdminReview[]
}

interface Draft {
  apiKey: string
  placeId: string
  minRating: number
  requireText: boolean
  keepHistory: boolean
}

function draftOf(settings: AdminSettings): Draft {
  return {
    apiKey: '',
    placeId: settings.placeId,
    minRating: settings.minRating,
    requireText: settings.requireText,
    keepHistory: settings.keepHistory,
  }
}

const MIN_RATING_LABELS: Record<number, string> = {
  1: 'Show every review',
  2: '2 stars and up',
  3: '3 stars and up',
  4: '4 stars and up',
  5: '5 stars only',
}

function formatWhen(iso: string | null): string {
  if (!iso) return 'never'
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
}

function starText(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}

async function readError(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null) as { error?: string } | null
  return body?.error ?? fallback
}

/** Why a stored review is not on the site, or null when it is. */
function hiddenReason(review: AdminReview, settings: AdminSettings): string | null {
  if (review.hidden) return 'Hidden by you'
  if (review.rating < settings.minRating) return `Under ${settings.minRating} stars`
  if (settings.requireText && !review.text.trim()) return 'No words'
  return null
}

function FindBusiness({ hasApiKey, onPick }: { hasApiKey: boolean; onPick: (result: PlaceSearchResult) => void }): ReactElement {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceSearchResult[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const search = async () => {
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE}/admin/search`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      if (!response.ok) {
        setError(await readError(response, 'The search did not work.'))
        setResults(null)
        return
      }
      const body = await response.json() as { results: PlaceSearchResult[] }
      setResults(body.results)
    } catch {
      setError('Could not reach the site to search.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="field">
      <label>Find your business on Google</label>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={query}
          placeholder="Business name and town"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void search() } }}
          disabled={!hasApiKey}
        />
        <button type="button" className="btn btn-secondary" onClick={() => void search()} disabled={!hasApiKey || busy || query.trim().length < 2}>
          {busy ? 'Searching…' : 'Search'}
        </button>
      </div>
      {!hasApiKey && <p className="field-hint">Save an API key first - the search goes through it.</p>}
      {error && <div className="alert alert-danger" style={{ marginTop: '0.5rem' }}>{error}</div>}
      {results && results.length === 0 && <p className="field-hint">Nothing found. Try adding the town, or the postcode.</p>}
      {results && results.length > 0 && (
        <ul style={{ listStyle: 'none', margin: '0.5rem 0 0', padding: 0, display: 'grid', gap: '0.375rem' }}>
          {results.map((result) => (
            <li key={result.placeId}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left', height: 'auto', padding: '0.5rem 0.75rem' }}
                onClick={() => { onPick(result); setResults(null) }}
              >
                <span>
                  <strong>{result.name}</strong>
                  {result.rating !== null && <> · {result.rating.toFixed(1)} ★ ({result.ratingCount ?? 0})</>}
                  <br />
                  <span className="field-hint">{result.address || 'No public address - covers an area'}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ReviewsTable({ view, onToggle, busyId }: {
  view: SettingsView
  onToggle: (review: AdminReview) => void
  busyId: string | null
}): ReactElement {
  if (view.reviews.length === 0) {
    return <p className="field-hint">No reviews stored yet. Choose your business, save, then fetch.</p>
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table">
        <thead>
          <tr>
            <th>Reviewer</th>
            <th>Stars</th>
            <th>Review</th>
            <th>On the site?</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {view.reviews.map((review) => {
            const reason = hiddenReason(review, view.settings)
            return (
              <tr key={review.id}>
                <td>
                  {review.authorName}
                  <div className="field-hint">{review.publishedAt ? formatWhen(review.publishedAt) : review.relativeTime}</div>
                </td>
                <td aria-label={`${review.rating} out of 5`} style={{ whiteSpace: 'nowrap', color: 'var(--color-warning)' }}>{starText(review.rating)}</td>
                <td style={{ maxWidth: '28rem' }}>{review.text || <span className="field-hint">No words, just stars</span>}</td>
                <td>{reason ? <span className="field-hint">{reason}</span> : 'Shown'}</td>
                <td>
                  <button type="button" className="btn btn-secondary btn-sm" disabled={busyId === review.id} onClick={() => onToggle(review)}>
                    {review.hidden ? 'Show' : 'Hide'}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function GoogleReviewsSettingsTab(): ReactElement {
  const [view, setView] = useState<SettingsView | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [pickedName, setPickedName] = useState('')
  const [busy, setBusy] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [busyReviewId, setBusyReviewId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const accept = useCallback((next: SettingsView) => {
    setView(next)
    // Re-seeded from what was stored, not from what was typed: a place ID the
    // server refused comes back empty, which beats it sitting there looking saved.
    setDraft(draftOf(next.settings))
    setPickedName('')
  }, [])

  const load = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/settings`)
      if (!response.ok) {
        setError(await readError(response, 'Could not load the settings.'))
        return
      }
      accept(await response.json() as SettingsView)
    } catch {
      setError('Could not reach the site to load the settings.')
    }
  }, [accept])

  useEffect(() => {
    let cancelled = false
    // Yield a microtask so the opening setState never runs synchronously inside the effect.
    void (async () => {
      await Promise.resolve()
      if (!cancelled) await load()
    })()
    return () => { cancelled = true }
  }, [load])

  const save = useCallback(async (overrides: Partial<{ clearApiKey: boolean }> = {}) => {
    if (!draft) return
    setBusy(true)
    setMessage('')
    setError('')
    try {
      const response = await fetch(`${API_BASE}/admin/settings`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...(draft.apiKey.trim() ? { apiKey: draft.apiKey.trim() } : {}),
          placeId: draft.placeId,
          minRating: draft.minRating,
          requireText: draft.requireText,
          keepHistory: draft.keepHistory,
          ...overrides,
        }),
      })
      if (!response.ok) {
        setError(await readError(response, 'Could not save those settings.'))
        return
      }
      accept(await response.json() as SettingsView)
      setMessage('Saved.')
    } catch {
      setError('Could not reach the site to save those settings.')
    } finally {
      setBusy(false)
    }
  }, [accept, draft])

  const fetchNow = useCallback(async () => {
    setFetching(true)
    setMessage('')
    setError('')
    try {
      const response = await fetch(`${API_BASE}/admin/refresh`, { method: 'POST' })
      if (!response.ok) {
        setError(await readError(response, 'Could not fetch the reviews.'))
        await load()
        return
      }
      const body = await response.json() as SettingsView & { reviewCount: number }
      accept(body)
      setMessage(`Google sent ${body.reviewCount} ${body.reviewCount === 1 ? 'review' : 'reviews'}.`)
    } catch {
      setError('Could not reach the site to fetch the reviews.')
    } finally {
      setFetching(false)
    }
  }, [accept, load])

  const toggleReview = useCallback(async (review: AdminReview) => {
    setBusyReviewId(review.id)
    setError('')
    try {
      const response = await fetch(`${API_BASE}/admin/reviews`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: review.id, hidden: !review.hidden }),
      })
      if (!response.ok) {
        setError(await readError(response, 'Could not change that review.'))
        return
      }
      const body = await response.json() as { reviews: AdminReview[] }
      setView((current) => (current ? { ...current, reviews: body.reviews } : current))
    } catch {
      setError('Could not reach the site to change that review.')
    } finally {
      setBusyReviewId(null)
    }
  }, [])

  if (!view || !draft) {
    return error ? <div className="alert alert-danger">{error}</div> : <p className="field-hint">Loading…</p>
  }

  const { settings } = view
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft({ ...draft, [key]: value })
  const unsaved = draft.placeId !== settings.placeId || draft.apiKey.trim() !== ''
  const businessLabel = pickedName || settings.summary.name || (settings.placeId ? 'Chosen - fetch to see its name' : 'None chosen yet')

  return (
    <div>
      <p className="field-hint" style={{ marginBottom: '1rem' }}>
        Pulls your reviews from Google every day and shows them wherever you put the <strong>Google Reviews</strong> block.
        Google only ever hands over five reviews at a time - the five it thinks most useful - so the block never shows more
        than that unless you keep the ones it has sent before.
      </p>

      {settings.lastError && (
        <div className="alert alert-warning">
          The last attempt to fetch reviews did not work: {settings.lastError}
        </div>
      )}

      <SettingsHeaderActions>
        <SettingsHeaderStatus message={message} error={error} />
        <button type="button" className="btn btn-secondary" onClick={() => void fetchNow()} disabled={fetching || unsaved || !settings.hasApiKey || !settings.placeId}>
          {fetching ? 'Fetching…' : 'Fetch reviews now'}
        </button>
        <button type="button" className="btn btn-primary" onClick={() => void save()} disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </SettingsHeaderActions>

      <div className="settings-cols">
        <div className="card">
          <div className="card-title">Connect to Google</div>

          <div className="field">
            <label>
              Google API key
              <InfoTip>
                Made in the Google Cloud console under APIs &amp; Services, Credentials. Its project needs the
                Places API (New) switched on and billing set up. Google gives a monthly allowance that a daily
                check stays well within. Restrict the key to the Places API (New) so it is no use for anything else.
              </InfoTip>
            </label>
            <input
              type="password"
              autoComplete="off"
              value={draft.apiKey}
              placeholder={settings.hasApiKey ? 'Saved - type a new one to replace it' : 'AIza…'}
              onChange={(event) => set('apiKey', event.target.value)}
            />
            {settings.hasApiKey && (
              <p className="field-hint">
                A key is saved.{' '}
                <button type="button" className="btn-link" onClick={() => void save({ clearApiKey: true })} disabled={busy}>Remove it</button>
              </p>
            )}
          </div>

          <FindBusiness
            hasApiKey={settings.hasApiKey}
            onPick={(result) => {
              setDraft({ ...draft, placeId: result.placeId })
              setPickedName(result.name)
            }}
          />

          <div className="field">
            <label>
              Your business
              <InfoTip>
                Google&rsquo;s own reference for your business. The search above fills it in; you can also paste a
                place ID from Google&rsquo;s Place ID Finder. Changing business clears the reviews from the old one.
              </InfoTip>
            </label>
            <p style={{ margin: '0 0 0.375rem' }}><strong>{businessLabel}</strong></p>
            <input
              type="text"
              value={draft.placeId}
              placeholder="ChIJ…"
              onChange={(event) => { set('placeId', event.target.value); setPickedName('') }}
            />
            {unsaved && <p className="field-hint">Save before fetching.</p>}
          </div>

          <p className="field-hint">
            Last fetched: {formatWhen(settings.lastFetchedAt)}
            {settings.summary.rating !== null && (
              <> · Google rating {settings.summary.rating.toFixed(1)} from {settings.summary.ratingCount ?? 0} reviews</>
            )}
          </p>

          <CronScheduleSetting
            path="/api/m/google-reviews/cron/refresh"
            label="How often to check Google"
            hint="Once a day is plenty - new reviews do not arrive by the minute."
          />
        </div>

        <div className="card">
          <div className="card-title">What to show</div>

          <div className="field">
            <label>
              Hide reviews under
              <InfoTip>
                Applies to every Google Reviews block on the site. A block can be stricter than this, but never
                more lenient. Hidden reviews are still kept, so lowering this brings them straight back.
              </InfoTip>
            </label>
            <select value={draft.minRating} onChange={(event) => set('minRating', Number.parseInt(event.target.value, 10))}>
              {[1, 2, 3, 4, 5].map((stars) => (
                <option key={stars} value={stars}>{MIN_RATING_LABELS[stars]}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="settings-check">
              <input type="checkbox" checked={draft.requireText} onChange={(event) => set('requireText', event.target.checked)} />
              <span>Skip reviews that are only a star rating, with no words</span>
            </label>
          </div>

          <div className="field">
            <label className="settings-check">
              <input type="checkbox" checked={draft.keepHistory} onChange={(event) => set('keepHistory', event.target.checked)} />
              <span>Keep reviews Google has stopped sending</span>
              <InfoTip>
                Off, the site shows exactly the five reviews Google sent last, which is what Google&rsquo;s terms
                expect. On, every review it has ever sent is kept, so your collection grows past five over time.
                Google&rsquo;s terms are not keen on sites storing its content, so this is your call to make.
              </InfoTip>
            </label>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="card-title">Reviews from Google</div>
        <p className="field-hint">Hide any review you would rather not show. It stays hidden through every future fetch.</p>
        <ReviewsTable view={view} onToggle={(review) => void toggleReview(review)} busyId={busyReviewId} />
      </div>
    </div>
  )
}
