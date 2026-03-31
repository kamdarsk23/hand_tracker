import { useEffect, useMemo, useState } from 'react'
import { ACTIONS, POSITIONS, SIZING_PRESETS } from '../constants'

function getNextPosition(currentPosition, positions) {
  if (positions.length === 0) return null
  const index = positions.indexOf(currentPosition)
  if (index === -1) return positions[0]
  return positions[(index + 1) % positions.length]
}

export default function ActionBuilder({ hand, actions = [], onAction, positions }) {
  const [selectedPosition, setSelectedPosition] = useState(null)
  const [pendingSizedAction, setPendingSizedAction] = useState(null)
  const [showDollarInput, setShowDollarInput] = useState(false)
  const [dollarAmount, setDollarAmount] = useState('')

  const activePositions = useMemo(() => {
    if (positions?.length) return positions
    const included = [hand.heroPosition, ...(hand.villains ?? []).map((villain) => villain.position)]
      .filter(Boolean)
      .filter((position, index, arr) => arr.indexOf(position) === index)
    return POSITIONS.filter((position) => included.includes(position))
  }, [hand.heroPosition, hand.villains, positions])

  useEffect(() => {
    if (!selectedPosition || !activePositions.includes(selectedPosition)) {
      setSelectedPosition(activePositions[0] ?? null)
    }
  }, [activePositions, selectedPosition])

  useEffect(() => {
    if (actions.length === 0) return
    const last = actions[actions.length - 1]
    if (!last?.position) return
    setSelectedPosition(getNextPosition(last.position, activePositions))
  }, [actions, activePositions])

  const submitAction = (action, payload = {}) => {
    if (!selectedPosition) return
    onAction?.({
      position: selectedPosition,
      action,
      sizingType: payload.sizingType ?? null,
      sizingValue: payload.sizingValue ?? null,
      rawDollars: payload.rawDollars ?? null,
    })
    setPendingSizedAction(null)
    setShowDollarInput(false)
    setDollarAmount('')
    setSelectedPosition((prev) => getNextPosition(prev, activePositions))
  }

  const onActionTap = (action) => {
    if (action === 'fold' || action === 'check' || action === 'call') {
      submitAction(action)
      return
    }
    setPendingSizedAction(action)
    setShowDollarInput(false)
  }

  const confirmDollar = () => {
    const parsed = Number(dollarAmount)
    if (!pendingSizedAction || !Number.isFinite(parsed) || parsed <= 0) return
    submitAction(pendingSizedAction, { sizingType: 'dollars', rawDollars: parsed })
  }

  return (
    <div className="action-builder">
      <div className="action-builder__positions">
        {activePositions.map((position) => (
          <button
            key={position}
            type="button"
            className={`hero-setup__position-btn ${
              selectedPosition === position ? 'hero-setup__position-btn--selected' : ''
            }`}
            onClick={() => setSelectedPosition(position)}
          >
            {position}
          </button>
        ))}
      </div>

      <div className="action-builder__actions">
        {ACTIONS.map((action) => (
          <button
            key={action}
            type="button"
            className={`action-builder__action-btn ${
              pendingSizedAction === action ? 'action-builder__action-btn--active' : ''
            }`}
            onClick={() => onActionTap(action)}
          >
            {action}
          </button>
        ))}
      </div>

      {pendingSizedAction && (
        <div className="action-builder__sizing">
          {SIZING_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className="action-builder__size-btn"
              onClick={() =>
                submitAction(pendingSizedAction, {
                  sizingType: 'percent',
                  sizingValue: preset,
                })
              }
            >
              {preset}%
            </button>
          ))}
          <button
            type="button"
            className="action-builder__size-btn"
            onClick={() => setShowDollarInput((prev) => !prev)}
          >
            $
          </button>
        </div>
      )}

      {pendingSizedAction && showDollarInput && (
        <div className="action-builder__dollar">
          <label className="hero-setup__stack-input-wrap">
            <span className="hero-setup__dollar">$</span>
            <input
              className="hero-setup__stack-input"
              type="text"
              inputMode="decimal"
              value={dollarAmount}
              placeholder="Amount"
              onChange={(event) => setDollarAmount(event.target.value)}
            />
          </label>
          <button type="button" className="action-builder__confirm-btn" onClick={confirmDollar}>
            Confirm
          </button>
        </div>
      )}
    </div>
  )
}
