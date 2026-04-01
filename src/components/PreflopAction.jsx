import ActionBuilder from './ActionBuilder'
import ActionTimeline from './ActionTimeline'
import { estimatePot } from '../utils/handMath'

export default function PreflopAction({
  hand,
  onChange,
  onBack,
  onDealFlop,
  onHandOver,
  positions,
  initialPot = 0,
  editable = true,
}) {
  const actions = hand.preflopActions ?? []
  const updateHand = (patch) => onChange?.({ ...hand, ...patch })

  const addAction = (actionPayload) => {
    const nextActions = [
      ...actions,
      {
        id: crypto.randomUUID(),
        ...actionPayload,
      },
    ]
    updateHand({ preflopActions: nextActions })
  }

  const deleteAction = (index) => {
    const nextActions = actions.filter((_, actionIndex) => actionIndex !== index)
    updateHand({ preflopActions: nextActions })
  }

  const updateAction = (index, nextAction) => {
    const nextActions = actions.map((actionItem, actionIndex) =>
      actionIndex === index ? nextAction : actionItem
    )
    updateHand({ preflopActions: nextActions })
  }

  const estimatedPot = estimatePot([actions], initialPot)

  return (
    <div className="preflop-action">
      <button type="button" className="logger-step__back" onClick={onBack}>
        ← Back
      </button>

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
            street="preflop"
            straddle={hand.straddle}
            onHandOver={onHandOver}
          />
        </section>
      )}

      {editable && (
        <div className="preflop-action__footer">
          {actions.length > 0 && (
            <button type="button" className="hero-setup__next-btn" onClick={onDealFlop}>
              Deal Flop
            </button>
          )}
          <button type="button" className="preflop-action__hand-over" onClick={onHandOver}>
            Hand Over
          </button>
        </div>
      )}
    </div>
  )
}
