import { useEffect, useState } from 'react'
import CardPicker from './CardPicker'
import ActionBuilder from './ActionBuilder'
import ActionTimeline from './ActionTimeline'
import { estimatePot, getInitialPot } from '../utils/handMath'

function formatBoardCard(card) {
  if (!card || card.length !== 2) return 'Pick card'
  const rank = card[0]
  const suit = card[1]
  const symbols = { s: '♠', h: '♥', d: '♦', c: '♣' }
  return `${rank}${symbols[suit] ?? ''}`
}

export default function RiverStep({
  hand,
  onChange,
  onBack,
  onShowdown,
  onHandOver,
  usedCards,
  positions,
  editable = true,
}) {
  const [isPickingRiver, setIsPickingRiver] = useState(false)
  const river = hand.river
  const flop = hand.flop ?? [null, null, null]
  const turn = hand.turn
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
  ], getInitialPot(hand))

  useEffect(() => {
    if (!editable) return
    if (river) return
    if (isPickingRiver) return
    setIsPickingRiver(true)
  }, [editable, river, isPickingRiver])

  return (
    <div className="preflop-action">
      <button type="button" className="logger-step__back" onClick={onBack}>
        ← Back
      </button>

      <section className="hero-setup__section">
        <h2 className="hero-setup__label">Board</h2>
        <div className="street-step__board-grid">
          {flop.map((card, idx) => (
            <div
              key={`flop-${idx}`}
              className={`hero-setup__card-slot ${card ? 'hero-setup__card-slot--filled' : ''}`}
            >
              {formatBoardCard(card)}
            </div>
          ))}
          <div className={`hero-setup__card-slot ${turn ? 'hero-setup__card-slot--filled' : ''}`}>
            {formatBoardCard(turn)}
          </div>
          <button
            type="button"
            className={`hero-setup__card-slot ${river ? 'hero-setup__card-slot--filled' : ''}`}
            onClick={() => (river ? updateHand({ river: null }) : setIsPickingRiver(true))}
          >
            {formatBoardCard(river)}
          </button>
        </div>
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
            street="river"
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
            disabled={!river}
            onClick={onShowdown}
          >
            Showdown
          </button>
          <button type="button" className="preflop-action__hand-over" onClick={onHandOver}>
            Hand Over
          </button>
        </div>
      )}

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
