import { useState } from 'react'
import CardPicker from './CardPicker'
import ActionBuilder from './ActionBuilder'
import ActionTimeline from './ActionTimeline'
import { estimatePot, getInitialPot } from '../utils/handMath'

export default function TurnStep({
  hand,
  onChange,
  onBack,
  onDealRiver,
  onHandOver,
  usedCards,
  positions,
  editable = true,
}) {
  const [isPickingTurn, setIsPickingTurn] = useState(false)
  const turn = hand.turn
  const actions = hand.turnActions ?? []

  const updateHand = (patch) => onChange?.({ ...hand, ...patch })

  const addAction = (actionPayload) => {
    updateHand({
      turnActions: [
        ...actions,
        {
          id: crypto.randomUUID(),
          ...actionPayload,
        },
      ],
    })
  }

  const deleteAction = (index) => {
    updateHand({ turnActions: actions.filter((_, i) => i !== index) })
  }

  const updateAction = (index, nextAction) => {
    updateHand({
      turnActions: actions.map((actionItem, actionIndex) =>
        actionIndex === index ? nextAction : actionItem
      ),
    })
  }

  const estimatedPot = estimatePot(
    [hand.preflopActions ?? [], hand.flopActions ?? [], actions],
    getInitialPot(hand)
  )

  return (
    <div className="preflop-action">
      <button type="button" className="logger-step__back" onClick={onBack}>
        ← Back
      </button>

      <section className="hero-setup__section">
        <h2 className="hero-setup__label">Turn Card</h2>
        <button
          type="button"
          className={`hero-setup__card-slot ${turn ? 'hero-setup__card-slot--filled' : ''}`}
          onClick={() => (turn ? updateHand({ turn: null }) : setIsPickingTurn(true))}
        >
          {turn ?? 'Pick card'}
        </button>
      </section>

      <section className="hero-setup__section">
        <h2 className="hero-setup__label">Estimated Pot</h2>
        <p className="preflop-action__pot">${estimatedPot.toFixed(2)}</p>
      </section>

      <section className="hero-setup__section">
        <h2 className="hero-setup__label">Timeline</h2>
        <ActionTimeline
          actions={actions}
          onDelete={deleteAction}
          onUpdate={updateAction}
          interactive={editable}
        />
      </section>

      {editable && (
        <section className="hero-setup__section">
          <h2 className="hero-setup__label">Add Action</h2>
          <ActionBuilder
            hand={hand}
            actions={actions}
            onAction={addAction}
            positions={positions}
            street="turn"
            straddle={hand.straddle}
            onHandOver={onHandOver}
          />
        </section>
      )}

      {editable && (
        <div className="preflop-action__footer">
          <button
            type="button"
            className="hero-setup__next-btn"
            disabled={!turn}
            onClick={onDealRiver}
          >
            Deal River
          </button>
          <button type="button" className="preflop-action__hand-over" onClick={onHandOver}>
            Hand Over
          </button>
        </div>
      )}

      {isPickingTurn && (
        <div className="hero-setup__modal-overlay" onClick={() => setIsPickingTurn(false)}>
          <div className="hero-setup__modal" onClick={(event) => event.stopPropagation()}>
            <CardPicker
              usedCards={usedCards}
              onSelect={(card) => {
                updateHand({ turn: card })
                setIsPickingTurn(false)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
