import { useState } from 'react'
import { POSITIONS, SUITS } from '../constants'
import CardPicker from './CardPicker'

const STACK_PRESETS = [200, 300, 500, 1000]

function formatCard(cardString) {
  if (!cardString || cardString.length !== 2) return null
  const rank = cardString[0]
  const suitInitial = cardString[1]
  const suit = SUITS.find((item) => item.name[0] === suitInitial)
  if (!suit) return null

  return {
    rank,
    symbol: suit.symbol,
    color: suit.color,
  }
}

export default function HeroSetup({ hand, onChange, onNext, onBack }) {
  const heroCards = hand.heroCards ?? []
  const [firstCard, secondCard] = heroCards
  const [activeSlot, setActiveSlot] = useState(null)

  const canProceed = Boolean(hand.heroPosition && firstCard && secondCard)

  const updateHand = (patch) => onChange?.({ ...hand, ...patch })

  const setPosition = (position) => updateHand({ heroPosition: position })

  const setStack = (value) => updateHand({ heroStack: value })

  const setCardInSlot = (card) => {
    if (activeSlot == null) return
    const nextCards = [...heroCards]
    nextCards[activeSlot] = card
    updateHand({ heroCards: nextCards })
    setActiveSlot(null)
  }

  const clearCard = (slot) => {
    const nextCards = [...heroCards]
    nextCards[slot] = null
    updateHand({ heroCards: nextCards })
  }

  const cardBadge = (card) => {
    const formatted = formatCard(card)
    if (!formatted) return <span className="hero-setup__empty">Tap to pick</span>
    return (
      <>
        <span>{formatted.rank}</span>
        <span style={{ color: formatted.color }}>{formatted.symbol}</span>
      </>
    )
  }

  return (
    <div className="hero-setup">
      <button type="button" className="logger-step__back" onClick={onBack}>
        ← Back
      </button>
      <section className="hero-setup__section">
        <h2 className="hero-setup__label">Position</h2>
        <div className="hero-setup__position-grid">
          {POSITIONS.map((position) => (
            <button
              key={position}
              type="button"
              className={`hero-setup__position-btn ${
                hand.heroPosition === position ? 'hero-setup__position-btn--selected' : ''
              }`}
              onClick={() => setPosition(position)}
            >
              {position}
            </button>
          ))}
        </div>
      </section>

      <section className="hero-setup__section">
        <h2 className="hero-setup__label">Stack Size (optional)</h2>
        <div className="hero-setup__preset-row">
          {STACK_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className="hero-setup__preset-btn"
              onClick={() => setStack(String(preset))}
            >
              ${preset}
            </button>
          ))}
        </div>
        <label className="hero-setup__stack-input-wrap">
          <span className="hero-setup__dollar">$</span>
          <input
            className="hero-setup__stack-input"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={hand.heroStack ?? ''}
            onChange={(event) => setStack(event.target.value)}
          />
        </label>
      </section>

      <section className="hero-setup__section">
        <h2 className="hero-setup__label">Hole Cards</h2>
        <div className="hero-setup__cards-row">
          {[0, 1].map((slot) => {
            const card = heroCards[slot]
            return (
              <button
                key={slot}
                type="button"
                className={`hero-setup__card-slot ${card ? 'hero-setup__card-slot--filled' : ''}`}
                onClick={() => (card ? clearCard(slot) : setActiveSlot(slot))}
              >
                {cardBadge(card)}
              </button>
            )
          })}
        </div>
      </section>

      <button
        type="button"
        className="hero-setup__next-btn"
        disabled={!canProceed}
        onClick={onNext}
      >
        Next
      </button>

      {activeSlot != null && (
        <div className="hero-setup__modal-overlay" onClick={() => setActiveSlot(null)}>
          <div className="hero-setup__modal" onClick={(event) => event.stopPropagation()}>
            <CardPicker usedCards={heroCards.filter(Boolean)} onSelect={setCardInSlot} />
          </div>
        </div>
      )}
    </div>
  )
}
