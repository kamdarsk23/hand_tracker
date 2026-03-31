import { useState } from 'react'
import { SUITS } from '../constants'

function formatCard(cardString) {
  if (!cardString || cardString.length !== 2) return null
  const rank = cardString[0]
  const suitInitial = cardString[1]
  const suit = SUITS.find((item) => item.name[0] === suitInitial)
  if (!suit) return null
  return { rank, symbol: suit.symbol, color: suit.color }
}

function CardBadge({ card, large = false }) {
  const formatted = formatCard(card)
  if (!formatted) return null
  return (
    <span className={`detail-card ${large ? 'detail-card--large' : ''}`}>
      <span>{formatted.rank}</span>
      <span style={{ color: formatted.color }}>{formatted.symbol}</span>
    </span>
  )
}

function formatAction(actionItem) {
  const verbMap = {
    fold: 'folds',
    check: 'checks',
    call: 'calls',
    bet: 'bets',
    raise: 'raises',
    'all-in': 'goes all-in',
  }

  const verb = verbMap[actionItem.action] ?? actionItem.action
  let sizingText = ''

  if (actionItem.sizingType === 'percent' && actionItem.sizingValue != null) {
    sizingText = ` ${actionItem.sizingValue}%`
    if (actionItem.rawDollars != null) sizingText += ` ($${actionItem.rawDollars})`
  } else if (actionItem.sizingType === 'dollars' && actionItem.rawDollars != null) {
    sizingText = ` $${actionItem.rawDollars}`
  }

  return `${actionItem.position} ${verb}${sizingText}`
}

function StreetSection({ title, boardCards = [], actions = [] }) {
  if (boardCards.filter(Boolean).length === 0 && actions.length === 0) return null
  return (
    <section className="detail-section">
      <h3 className="detail-section__title">{title}</h3>
      {boardCards.filter(Boolean).length > 0 && (
        <div className="detail-section__cards">
          {boardCards.filter(Boolean).map((card) => (
            <CardBadge key={card} card={card} />
          ))}
        </div>
      )}
      {actions.length > 0 ? (
        <ul className="detail-section__actions">
          {actions.map((actionItem, index) => (
            <li key={actionItem.id ?? index}>{formatAction(actionItem)}</li>
          ))}
        </ul>
      ) : (
        <p className="action-timeline__empty">No actions logged.</p>
      )}
    </section>
  )
}

export default function HandDetail({ hand, onEdit, onDelete }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!hand) {
    return (
      <div className="view">
        <p className="placeholder">Hand not found.</p>
      </div>
    )
  }

  const flopCards = hand.flop ?? []
  const turnCards = hand.turn ? [hand.turn] : []
  const riverCards = hand.river ? [hand.river] : []

  return (
    <div className="view hand-detail">
      <section className="detail-section">
        <h2 className="detail-section__title">Hero</h2>
        <p className="detail-section__row">
          <strong>Position:</strong> {hand.heroPosition ?? '-'}
        </p>
        <p className="detail-section__row">
          <strong>Stack:</strong> {hand.heroStack != null && hand.heroStack !== '' ? `$${hand.heroStack}` : '-'}
        </p>
        <div className="detail-section__cards">
          {(hand.heroCards ?? []).filter(Boolean).map((card) => (
            <CardBadge key={card} card={card} large />
          ))}
        </div>
      </section>

      <section className="detail-section">
        <h3 className="detail-section__title">Villains</h3>
        {hand.villains?.length ? (
          <ul className="detail-section__actions">
            {hand.villains.map((villain) => (
              <li key={villain.position}>
                {villain.position} {villain.stack != null ? `- $${villain.stack}` : '-'}
              </li>
            ))}
          </ul>
        ) : (
          <p className="action-timeline__empty">No villains logged.</p>
        )}
      </section>

      <StreetSection title="Preflop" actions={hand.preflopActions ?? []} />
      <StreetSection title="Flop" boardCards={flopCards} actions={hand.flopActions ?? []} />
      <StreetSection title="Turn" boardCards={turnCards} actions={hand.turnActions ?? []} />
      <StreetSection title="River" boardCards={riverCards} actions={hand.riverActions ?? []} />

      <section className="detail-section">
        <h3 className="detail-section__title">Result</h3>
        <p className="detail-section__row">
          <strong>Outcome:</strong> {hand.result ?? '-'}
        </p>
        <p className="detail-section__row">
          <strong>Pot:</strong> {hand.potSize != null && hand.potSize !== '' ? `$${hand.potSize}` : '-'}
        </p>

        {hand.villainShowdown?.length > 0 && (
          <div className="detail-section__showdown">
            {hand.villainShowdown.map((entry) => (
              <div key={entry.position} className="detail-section__showdown-row">
                <strong>{entry.position}</strong>
                <div className="detail-section__cards">
                  {(entry.cards ?? []).filter(Boolean).map((card) => (
                    <CardBadge key={`${entry.position}-${card}`} card={card} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {hand.notes ? <p className="detail-section__notes">{hand.notes}</p> : null}
      </section>

      <div className="hand-detail__footer">
        <button type="button" className="hero-setup__next-btn" onClick={onEdit}>
          Edit
        </button>
        <button type="button" className="preflop-action__hand-over" onClick={() => setShowDeleteConfirm(true)}>
          Delete
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="hero-setup__modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="hero-setup__modal" onClick={(event) => event.stopPropagation()}>
            <h3 className="card-picker__title">Delete this hand?</h3>
            <p className="action-timeline__empty">This cannot be undone.</p>
            <div className="hand-detail__confirm-row">
              <button type="button" className="hero-setup__position-btn" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button type="button" className="preflop-action__hand-over" onClick={onDelete}>
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
