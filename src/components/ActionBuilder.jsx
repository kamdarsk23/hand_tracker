import { useEffect, useMemo, useState } from 'react'
import { ACTIONS, POSITIONS, SIZING_PRESETS } from '../constants'
import getActionOrder from '../utils/actionOrder'

function firstInCycle(order, startAfter, predicate) {
  if (!order.length) return null
  const startIndex = order.indexOf(startAfter)
  const begin = startIndex >= 0 ? startIndex + 1 : 0
  for (let i = 0; i < order.length; i += 1) {
    const position = order[(begin + i) % order.length]
    if (predicate(position)) return position
  }
  return null
}

function deriveStreetState(order, allPositions, actions) {
  const folded = new Set()
  let actedSinceAggression = new Set()
  let pendingResponders = new Set()
  let lastAggressor = null
  let lastActor = null

  for (const actionItem of actions ?? []) {
    const actor = actionItem?.position
    if (!actor || !allPositions.includes(actor)) continue
    lastActor = actor

    if (actionItem.action === 'fold') {
      folded.add(actor)
      actedSinceAggression.add(actor)
      pendingResponders.delete(actor)
      continue
    }

    if (actionItem.action === 'bet' || actionItem.action === 'raise' || actionItem.action === 'all-in') {
      lastAggressor = actor
      actedSinceAggression = new Set([actor])
      pendingResponders = new Set(allPositions.filter((position) => position !== actor && !folded.has(position)))
      continue
    }

    if (actionItem.action === 'check' || actionItem.action === 'call') {
      actedSinceAggression.add(actor)
      pendingResponders.delete(actor)
    }
  }

  const activePositions = order.filter((position) => allPositions.includes(position) && !folded.has(position))
  const onlyOnePlayerLeft = activePositions.length <= 1

  let nextActor = null
  let streetComplete = false
  const betFacing = lastAggressor != null && pendingResponders.size > 0

  if (onlyOnePlayerLeft) {
    streetComplete = true
  } else if (lastAggressor != null) {
    streetComplete = pendingResponders.size === 0
    if (!streetComplete) {
      nextActor = firstInCycle(order, lastAggressor, (position) => pendingResponders.has(position))
    }
  } else {
    streetComplete = activePositions.every((position) => actedSinceAggression.has(position))
    if (!streetComplete) {
      nextActor = order.find(
        (position) => activePositions.includes(position) && !actedSinceAggression.has(position)
      ) ?? null
    }
  }

  if (!nextActor && !streetComplete && activePositions.length > 0) {
    nextActor =
      firstInCycle(order, lastActor, (position) => {
        if (!activePositions.includes(position)) return false
        if (betFacing) return pendingResponders.has(position)
        return true
      }) ?? activePositions[0]
  }

  return { activePositions, nextActor, streetComplete, betFacing, onlyOnePlayerLeft, lastActor }
}

export default function ActionBuilder({
  hand,
  actions = [],
  onAction,
  positions,
  street = 'preflop',
  straddle = null,
  onHandOver,
}) {
  const [currentActorIndex, setCurrentActorIndex] = useState(0)
  const [overridePosition, setOverridePosition] = useState(null)
  const [pendingSizedAction, setPendingSizedAction] = useState(null)
  const [showDollarInput, setShowDollarInput] = useState(false)
  const [dollarAmount, setDollarAmount] = useState('')

  const allPositions = useMemo(() => {
    if (positions?.length) return positions
    const included = [hand.heroPosition, ...(hand.villains ?? []).map((villain) => villain.position)]
      .filter(Boolean)
      .filter((position, index, arr) => arr.indexOf(position) === index)
    return POSITIONS.filter((position) => included.includes(position))
  }, [hand.heroPosition, hand.villains, positions])

  const actionOrder = useMemo(
    () => getActionOrder(street, allPositions, straddle),
    [street, allPositions, straddle]
  )

  const streetState = useMemo(
    () => deriveStreetState(actionOrder, allPositions, actions),
    [actionOrder, allPositions, actions]
  )

  const promptedActor = streetState.nextActor
  const actorForAction =
    overridePosition && streetState.activePositions.includes(overridePosition)
      ? overridePosition
      : promptedActor

  const stackByPosition = useMemo(() => {
    const map = new Map()
    if (hand.heroPosition) map.set(hand.heroPosition, hand.heroStack)
    for (const villain of hand.villains ?? []) {
      map.set(villain.position, villain.stack)
    }
    return map
  }, [hand.heroPosition, hand.heroStack, hand.villains])

  useEffect(() => {
    if (!promptedActor) {
      setCurrentActorIndex(0)
      return
    }
    const nextIndex = streetState.activePositions.indexOf(promptedActor)
    setCurrentActorIndex(nextIndex >= 0 ? nextIndex : 0)
  }, [promptedActor, streetState.activePositions])

  useEffect(() => {
    setOverridePosition(null)
  }, [actions.length])

  const submitAction = (action, payload = {}) => {
    if (!actorForAction) return
    onAction?.({
      position: actorForAction,
      action,
      sizingType: payload.sizingType ?? null,
      sizingValue: payload.sizingValue ?? null,
      rawDollars: payload.rawDollars ?? null,
    })
    setPendingSizedAction(null)
    setShowDollarInput(false)
    setDollarAmount('')
    setOverridePosition(null)
    setCurrentActorIndex((prev) =>
      streetState.activePositions.length > 0 ? (prev + 1) % streetState.activePositions.length : 0
    )
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

  const actionValidity = {
    fold: true,
    check: !streetState.betFacing,
    call: streetState.betFacing,
    bet: !streetState.betFacing,
    raise: streetState.betFacing,
    'all-in': true,
  }

  const indexedActor = streetState.activePositions[currentActorIndex] ?? null
  const displayStack = actorForAction ? stackByPosition.get(actorForAction) : null

  return (
    <div className="action-builder">
      <div className="action-builder__actor">
        <strong>
          {actorForAction ? `▶ ${actorForAction} to act` : indexedActor ? `▶ ${indexedActor} to act` : 'Street complete'}
        </strong>
        {displayStack != null && displayStack !== '' && <span className="action-builder__actor-stack">${displayStack}</span>}
      </div>

      <div className="action-builder__actions">
        {ACTIONS.map((action) => (
          <button
            key={action}
            type="button"
            className={`action-builder__action-btn ${
              pendingSizedAction === action ? 'action-builder__action-btn--active' : ''
            } ${actionValidity[action] ? '' : 'action-builder__action-btn--muted'}`}
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

      <div className="action-builder__override">
        {streetState.activePositions.map((position) => (
          <button
            key={position}
            type="button"
            className={`action-builder__override-btn ${
              actorForAction === position ? 'action-builder__override-btn--selected' : ''
            }`}
            onClick={() => setOverridePosition(position)}
          >
            {position}
          </button>
        ))}
      </div>

      {streetState.onlyOnePlayerLeft && (
        <button type="button" className="action-builder__end-hand" onClick={onHandOver}>
          One player left - End Hand
        </button>
      )}
    </div>
  )
}
