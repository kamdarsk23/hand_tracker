import { useMemo } from 'react'
import { SUITS } from '../constants'
import { getHandSummary } from '../utils/handSummary'

function formatCard(cardString) {
  if (!cardString || cardString.length !== 2) return null
  const rank = cardString[0]
  const suitInitial = cardString[1]
  const suit = SUITS.find((item) => item.name[0] === suitInitial)
  if (!suit) return null
  return { rank, symbol: suit.symbol, color: suit.color }
}

function renderCardBadge(cardString) {
  const card = formatCard(cardString)
  if (!card) return null
  return (
    <span key={cardString} className="list-card__card-badge">
      <span>{card.rank}</span>
      <span style={{ color: card.color }}>{card.symbol}</span>
    </span>
  )
}

function formatRelativeTime(isoString) {
  if (!isoString) return '-'
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))}m ago`
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`
  if (diffMs < 2 * day) return 'yesterday'
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)}d ago`

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatStakes(hand) {
  const sb = hand?.blinds?.sb
  const bb = hand?.blinds?.bb
  if (sb == null || bb == null || sb === '' || bb === '') return null
  return `$${sb}/$${bb}`
}

export default function HandList({ hands = [], onSelect }) {
  const sortedHands = useMemo(() => {
    return [...hands].sort((a, b) => {
      const aTime = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime()
      const bTime = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime()
      return bTime - aTime
    })
  }, [hands])

  if (sortedHands.length === 0) {
    return (
      <div className="view">
        <div className="empty-state">
          <span className="empty-state__icon">🃏</span>
          <p className="empty-state__text">
            No hands logged yet.
            <br />
            Tap + to record your first hand.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="view">
      <ul className="hand-list">
        {sortedHands.map((hand) => (
          <li key={hand.id}>
            <button type="button" className="list-card" onClick={() => onSelect?.(hand.id)}>
              <div className="list-card__header">
                <div className="list-card__hero-row">
                  <strong>{hand.heroPosition ?? 'No Hero'}</strong>
                  <span>-</span>
                  <div className="list-card__hero-cards">
                    {(hand.heroCards ?? []).filter(Boolean).map((card) => renderCardBadge(card))}
                  </div>
                  {formatStakes(hand) && <span className="list-card__stakes">{formatStakes(hand)}</span>}
                </div>
                <span className="list-card__time">{formatRelativeTime(hand.updatedAt ?? hand.createdAt)}</span>
              </div>

              <div className="list-card__meta">
                <span className="list-card__summary">{getHandSummary(hand)}</span>
                {hand.potSize != null && hand.potSize !== '' ? (
                  <span className="list-card__pot">${hand.potSize}</span>
                ) : (
                  <span className="list-card__pot">-</span>
                )}
                <span
                  className={`list-card__result ${
                    hand.result === 'won'
                      ? 'list-card__result--won'
                      : hand.result === 'lost'
                        ? 'list-card__result--lost'
                        : ''
                  }`}
                >
                  {hand.result === 'won' ? 'W' : hand.result === 'lost' ? 'L' : '-'}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
