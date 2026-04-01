import { useEffect, useMemo, useState } from 'react'
import CardPicker from './CardPicker'
import { estimatePot, getInitialPot } from '../utils/handMath'

function ensureVillainEntry(list, position) {
  const existing = list.find((entry) => entry.position === position)
  if (existing) return list
  return [...list, { position, cards: [null, null] }]
}

export default function ResultStep({
  hand,
  onChange,
  onBack,
  onSaveHand,
  remainingVillains,
  usedCards,
}) {
  const [expanded, setExpanded] = useState({})
  const [activePick, setActivePick] = useState(null) // { position, slot }
  const [potAutoFilled, setPotAutoFilled] = useState(false)

  const updateHand = (patch) => onChange?.({ ...hand, ...patch })
  const villainShowdown = hand.villainShowdown ?? []

  const showdownMap = useMemo(() => {
    const map = new Map()
    for (const entry of villainShowdown) {
      map.set(entry.position, entry)
    }
    return map
  }, [villainShowdown])

  const estimatedFinalPot = useMemo(
    () =>
      estimatePot(
        [
          hand.preflopActions ?? [],
          hand.flopActions ?? [],
          hand.turnActions ?? [],
          hand.riverActions ?? [],
        ],
        getInitialPot(hand)
      ),
    [hand]
  )

  useEffect(() => {
    if (potAutoFilled) return
    if (hand.potSize != null && hand.potSize !== '') return
    updateHand({ potSize: Number(estimatedFinalPot.toFixed(2)) })
    setPotAutoFilled(true)
  }, [potAutoFilled, hand.potSize, estimatedFinalPot])

  const setVillainCard = (card) => {
    if (!activePick) return
    const { position, slot } = activePick
    let next = ensureVillainEntry(villainShowdown, position)
    next = next.map((entry) => {
      if (entry.position !== position) return entry
      const cards = [...(entry.cards ?? [null, null])]
      cards[slot] = card
      return { ...entry, cards }
    })
    updateHand({ villainShowdown: next })
    setActivePick(null)
  }

  const clearVillainCard = (position, slot) => {
    const next = villainShowdown.map((entry) => {
      if (entry.position !== position) return entry
      const cards = [...(entry.cards ?? [null, null])]
      cards[slot] = null
      return { ...entry, cards }
    })
    updateHand({ villainShowdown: next })
  }

  return (
    <div className="result-step">
      <button type="button" className="logger-step__back" onClick={onBack}>
        ← Back
      </button>

      <section className="hero-setup__section">
        <h2 className="hero-setup__label">Result</h2>
        <div className="result-step__result-row">
          <button
            type="button"
            className={`result-step__result-btn result-step__result-btn--won ${
              hand.result === 'won' ? 'result-step__result-btn--selected' : ''
            }`}
            onClick={() => updateHand({ result: 'won' })}
          >
            Won
          </button>
          <button
            type="button"
            className={`result-step__result-btn result-step__result-btn--lost ${
              hand.result === 'lost' ? 'result-step__result-btn--selected' : ''
            }`}
            onClick={() => updateHand({ result: 'lost' })}
          >
            Lost
          </button>
        </div>
      </section>

      <section className="hero-setup__section">
        <h2 className="hero-setup__label">Pot Size (optional)</h2>
        <label className="hero-setup__stack-input-wrap">
          <span className="hero-setup__dollar">$</span>
          <input
            className="hero-setup__stack-input"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={hand.potSize ?? ''}
            onChange={(event) => updateHand({ potSize: event.target.value })}
          />
        </label>
      </section>

      <section className="hero-setup__section">
        <h2 className="hero-setup__label">Villain Showdown (optional)</h2>
        {remainingVillains.length === 0 ? (
          <p className="action-timeline__empty">No villains reached showdown.</p>
        ) : (
          remainingVillains.map((position) => {
            const isExpanded = Boolean(expanded[position])
            const cards = showdownMap.get(position)?.cards ?? [null, null]
            return (
              <div key={position} className="villain-setup__row">
                <div className="villain-setup__row-header">
                  <strong>{position}</strong>
                  <button
                    type="button"
                    className="villain-setup__link"
                    onClick={() => setExpanded((prev) => ({ ...prev, [position]: !prev[position] }))}
                  >
                    {isExpanded ? 'hide cards' : 'add cards'}
                  </button>
                </div>
                {isExpanded && (
                  <div className="hero-setup__cards-row">
                    {[0, 1].map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className={`hero-setup__card-slot ${
                          cards[slot] ? 'hero-setup__card-slot--filled' : ''
                        }`}
                        onClick={() =>
                          cards[slot]
                            ? clearVillainCard(position, slot)
                            : setActivePick({ position, slot })
                        }
                      >
                        {cards[slot] ?? 'Pick card'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </section>

      <section className="hero-setup__section">
        <h2 className="hero-setup__label">Notes (optional)</h2>
        <textarea
          className="result-step__notes"
          value={hand.notes ?? ''}
          onChange={(event) => updateHand({ notes: event.target.value })}
          placeholder="Add notes about reads, lines, and takeaways."
        />
      </section>

      <button type="button" className="hero-setup__next-btn" onClick={onSaveHand}>
        Save Hand
      </button>

      {activePick && (
        <div className="hero-setup__modal-overlay" onClick={() => setActivePick(null)}>
          <div className="hero-setup__modal" onClick={(event) => event.stopPropagation()}>
            <CardPicker usedCards={usedCards} onSelect={setVillainCard} />
          </div>
        </div>
      )}
    </div>
  )
}
