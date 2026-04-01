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

export default function FlopStep({
  hand,
  onChange,
  onBack,
  onDealTurn,
  onHandOver,
  usedCards,
  positions,
  editable = true,
}) {
  const [activeBoardSlot, setActiveBoardSlot] = useState(null)
  const board = hand.flop ?? [null, null, null]
  const actions = hand.flopActions ?? []

  const updateHand = (patch) => onChange?.({ ...hand, ...patch })

  const setBoardCard = (card) => {
    if (activeBoardSlot == null) return
    const nextBoard = [...board]
    nextBoard[activeBoardSlot] = card
    updateHand({ flop: nextBoard })
    const nextMissing = nextBoard.findIndex((boardCard) => !boardCard)
    setActiveBoardSlot(nextMissing >= 0 ? nextMissing : null)
  }

  const clearBoardCard = (slot) => {
    const nextBoard = [...board]
    nextBoard[slot] = null
    updateHand({ flop: nextBoard })
  }

  const addAction = (actionPayload) => {
    updateHand({
      flopActions: [
        ...actions,
        {
          id: crypto.randomUUID(),
          ...actionPayload,
        },
      ],
    })
  }

  const deleteAction = (index) => {
    updateHand({ flopActions: actions.filter((_, i) => i !== index) })
  }

  const updateAction = (index, nextAction) => {
    updateHand({
      flopActions: actions.map((actionItem, actionIndex) =>
        actionIndex === index ? nextAction : actionItem
      ),
    })
  }

  const canDealTurn = board.filter(Boolean).length === 3
  const estimatedPot = estimatePot([hand.preflopActions ?? [], actions], getInitialPot(hand))

  useEffect(() => {
    if (!editable) return
    if (activeBoardSlot != null) return
    const missingIndex = board.findIndex((boardCard) => !boardCard)
    if (missingIndex >= 0) {
      setActiveBoardSlot(missingIndex)
    }
  }, [editable, activeBoardSlot, board])

  return (
    <div className="preflop-action">
      <button type="button" className="logger-step__back" onClick={onBack}>
        ← Back
      </button>

      <section className="hero-setup__section">
        <h2 className="hero-setup__label">Flop Board</h2>
        <div className="street-step__board-grid">
          {[0, 1, 2].map((slot) => {
            const card = board[slot]
            return (
              <button
                key={slot}
                type="button"
                className={`hero-setup__card-slot ${card ? 'hero-setup__card-slot--filled' : ''}`}
                onClick={() => (card ? clearBoardCard(slot) : setActiveBoardSlot(slot))}
              >
                {formatBoardCard(card)}
              </button>
            )
          })}
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
            street="flop"
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
            disabled={!canDealTurn}
            onClick={onDealTurn}
          >
            Deal Turn
          </button>
          <button type="button" className="preflop-action__hand-over" onClick={onHandOver}>
            Hand Over
          </button>
        </div>
      )}

      {activeBoardSlot != null && (
        <div className="hero-setup__modal-overlay" onClick={() => setActiveBoardSlot(null)}>
          <div className="hero-setup__modal" onClick={(event) => event.stopPropagation()}>
            <CardPicker usedCards={usedCards} onSelect={setBoardCard} />
          </div>
        </div>
      )}
    </div>
  )
}
