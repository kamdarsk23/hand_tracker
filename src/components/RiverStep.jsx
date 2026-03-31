import { useState } from 'react'
import CardPicker from './CardPicker'
import ActionBuilder from './ActionBuilder'
import ActionTimeline from './ActionTimeline'
import { estimatePot } from '../utils/handMath'

export default function RiverStep({
  hand,
  onChange,
  onBack,
  onShowdown,
  onHandOver,
  usedCards,
  positions,
}) {
  const [isPickingRiver, setIsPickingRiver] = useState(false)
  const river = hand.river
  const actions = hand.riverActions ?? []

  const updateHand = (patch) => onChange?.({ ...hand, ...patch })

  const addAction = (actionPayload) => {
    updateHand({
      riverActions: [
        ...actions,
        {
          id: crypto.randomUUID(),
          ...actionPayload,
        },
      ],
    })
  }

  const deleteAction = (index) => {
    updateHand({ riverActions: actions.filter((_, i) => i !== index) })
  }

  const updateAction = (index, nextAction) => {
    updateHand({
      riverActions: actions.map((actionItem, actionIndex) =>
        actionIndex === index ? nextAction : actionItem
      ),
    })
  }

  const estimatedPot = estimatePot([
    hand.preflopActions ?? [],
    hand.flopActions ?? [],
    hand.turnActions ?? [],
    actions,
  ])

  return (
    <div className="preflop-action">
      <button type="button" className="logger-step__back" onClick={onBack}>
        ← Back
      </button>

      <section className="hero-setup__section">
        <h2 className="hero-setup__label">River Card</h2>
        <button
          type="button"
          className={`hero-setup__card-slot ${river ? 'hero-setup__card-slot--filled' : ''}`}
          onClick={() => (river ? updateHand({ river: null }) : setIsPickingRiver(true))}
        >
          {river ?? 'Pick card'}
        </button>
      </section>

      <section className="hero-setup__section">
        <h2 className="hero-setup__label">Estimated Pot</h2>
        <p className="preflop-action__pot">${estimatedPot.toFixed(2)}</p>
      </section>

      <section className="hero-setup__section">
        <h2 className="hero-setup__label">Timeline</h2>
        <ActionTimeline actions={actions} onDelete={deleteAction} onUpdate={updateAction} />
      </section>

      <section className="hero-setup__section">
        <h2 className="hero-setup__label">Add Action</h2>
        <ActionBuilder hand={hand} actions={actions} onAction={addAction} positions={positions} />
      </section>

      <div className="preflop-action__footer">
        <button
          type="button"
          className="hero-setup__next-btn"
          disabled={!river}
          onClick={onShowdown}
        >
          Showdown
        </button>
        <button type="button" className="preflop-action__hand-over" onClick={onHandOver}>
          Hand Over
        </button>
      </div>

      {isPickingRiver && (
        <div className="hero-setup__modal-overlay" onClick={() => setIsPickingRiver(false)}>
          <div className="hero-setup__modal" onClick={(event) => event.stopPropagation()}>
            <CardPicker
              usedCards={usedCards}
              onSelect={(card) => {
                updateHand({ river: card })
                setIsPickingRiver(false)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
