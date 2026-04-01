import { useEffect, useMemo, useState } from 'react'
import { POSITIONS, SIZING_PRESETS } from '../constants'
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

function toAmount(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function buildInitialContributions(street, hand, allPositions, straddle) {
  const map = new Map()
  for (const position of allPositions) {
    map.set(position, 0)
  }
  if (street !== 'preflop') return map

  if (map.has('SB')) map.set('SB', toAmount(hand?.blinds?.sb))
  if (map.has('BB')) map.set('BB', toAmount(hand?.blinds?.bb))
  if (straddle?.active && straddle?.position && map.has(straddle.position)) {
    map.set(straddle.position, toAmount(straddle.amount))
  }
  return map
}

function deriveStreetState(order, allPositions, actions, initialContributions) {
  const folded = new Set()
  const contributionByPosition = new Map(initialContributions)
  let actedSinceAggression = new Set()
  let pendingResponders = new Set()
  let lastAggressor = null
  let lastActor = null
  let currentBet = 0

  for (const position of allPositions) {
    currentBet = Math.max(currentBet, contributionByPosition.get(position) ?? 0)
  }
  if (currentBet > 0) {
    lastAggressor = allPositions.find((position) => (contributionByPosition.get(position) ?? 0) === currentBet) ?? null
    pendingResponders = new Set(allPositions)
  }

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

    if (actionItem.action === 'check') {
      actedSinceAggression.add(actor)
      pendingResponders.delete(actor)
      continue
    }

    if (actionItem.action === 'call') {
      const actorContribution = contributionByPosition.get(actor) ?? 0
      const invested = Math.max(0, toAmount(actionItem.rawDollars) || currentBet - actorContribution)
      contributionByPosition.set(actor, actorContribution + invested)
      actedSinceAggression.add(actor)
      pendingResponders.delete(actor)
      continue
    }

    if (actionItem.action === 'bet' || actionItem.action === 'raise' || actionItem.action === 'all-in') {
      const actorContribution = contributionByPosition.get(actor) ?? 0
      const explicitToAmount = toAmount(actionItem.toAmount)
      const invested = Math.max(0, toAmount(actionItem.rawDollars))
      const targetToAmount = explicitToAmount || actorContribution + invested
      lastAggressor = actor
      currentBet = Math.max(currentBet, targetToAmount)
      contributionByPosition.set(actor, Math.max(targetToAmount, actorContribution))
      actedSinceAggression = new Set([actor])
      pendingResponders = new Set(allPositions.filter((position) => position !== actor && !folded.has(position)))
      continue
    }
  }

  const activePositions = order.filter((position) => allPositions.includes(position) && !folded.has(position))
  const onlyOnePlayerLeft = activePositions.length <= 1
  let nextActor = null
  let streetComplete = false
  const betFacing = currentBet > 0 && pendingResponders.size > 0

  if (onlyOnePlayerLeft) {
    streetComplete = true
  } else if (currentBet > 0) {
    streetComplete = pendingResponders.size === 0
    if (!streetComplete) {
      nextActor = firstInCycle(order, lastActor ?? lastAggressor, (position) => pendingResponders.has(position))
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

  return {
    activePositions,
    nextActor,
    streetComplete,
    betFacing,
    onlyOnePlayerLeft,
    currentBet,
    contributionByPosition,
  }
}

export default function ActionBuilder({
  hand,
  actions = [],
  onAction,
  onSetHeroPosition,
  onMarkEmptyPosition,
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
    return [...POSITIONS]
  }, [positions])

  const initialContributions = useMemo(
    () => buildInitialContributions(street, hand, allPositions, straddle),
    [street, hand, allPositions, straddle]
  )

  const actionOrder = useMemo(
    () => getActionOrder(street, allPositions, straddle),
    [street, allPositions, straddle]
  )
  const streetState = useMemo(
    () => deriveStreetState(actionOrder, allPositions, actions, initialContributions),
    [actionOrder, allPositions, actions, initialContributions]
  )

  const promptedActor = streetState.nextActor
  const actorForAction =
    overridePosition && streetState.activePositions.includes(overridePosition)
      ? overridePosition
      : promptedActor

  const stackByPosition = useMemo(() => {
    const map = new Map()
    if (hand.heroPosition) map.set(hand.heroPosition, hand.heroStack)
    return map
  }, [hand.heroPosition, hand.heroStack])

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
  }, [actions.length, hand.emptyPositions])

  const submitAction = (action, payload = {}) => {
    if (!actorForAction) return
    onAction?.({
      position: actorForAction,
      action,
      sizingType: payload.sizingType ?? null,
      sizingValue: payload.sizingValue ?? null,
      rawDollars: payload.rawDollars ?? null,
      toAmount: payload.toAmount ?? null,
    })
    setPendingSizedAction(null)
    setShowDollarInput(false)
    setDollarAmount('')
    setOverridePosition(null)
    setCurrentActorIndex((prev) =>
      streetState.activePositions.length > 0 ? (prev + 1) % streetState.activePositions.length : 0
    )
  }

  const actorContribution = actorForAction ? streetState.contributionByPosition.get(actorForAction) ?? 0 : 0
  const callAmount = Math.max(0, streetState.currentBet - actorContribution)
  const facingBet = callAmount > 0

  const onActionTap = (action) => {
    if (action === 'fold') {
      submitAction('fold')
      return
    }
    if (action === 'check') {
      submitAction('check')
      return
    }
    if (action === 'call') {
      submitAction('call', { sizingType: 'dollars', rawDollars: callAmount })
      return
    }
    setPendingSizedAction(action)
    setShowDollarInput(false)
  }

  const confirmDollar = () => {
    const parsed = Number(dollarAmount)
    if (!pendingSizedAction || !Number.isFinite(parsed) || parsed <= 0) return
    const toAmount = pendingSizedAction === 'raise' ? actorContribution + parsed : parsed
    if (pendingSizedAction === 'raise' && toAmount <= streetState.currentBet) return
    submitAction(pendingSizedAction, {
      sizingType: 'dollars',
      rawDollars: parsed,
      toAmount,
    })
  }

  const indexedActor = streetState.activePositions[currentActorIndex] ?? null
  const displayStack = actorForAction ? stackByPosition.get(actorForAction) : null
  const heroLocked = Boolean(hand.heroPosition)
  const canMarkCurrentActorAsHero = !heroLocked && Boolean(actorForAction)
  const isHeroTurn = actorForAction && hand.heroPosition && actorForAction === hand.heroPosition

  return (
    <div className="action-builder">
      <div className="action-builder__actor">
        <strong>
          {actorForAction ? `▶ ${actorForAction} to act` : indexedActor ? `▶ ${indexedActor} to act` : 'Street complete'}
          {isHeroTurn && <span style={{ color: '#fbbf24', marginLeft: 8 }}>★</span>}
        </strong>
        {displayStack != null && displayStack !== '' && <span className="action-builder__actor-stack">${displayStack}</span>}
        {actorForAction && (
          <span className="action-builder__actor-stack">
            in: ${actorContribution.toFixed(2)} {facingBet ? `| call: $${callAmount.toFixed(2)}` : '| check option'}
          </span>
        )}
      </div>

      {street === 'preflop' && (
        <div className="action-builder__actions">
          <button
            type="button"
            className={`action-builder__action-btn ${heroLocked ? 'action-builder__action-btn--muted' : ''}`}
            disabled={!canMarkCurrentActorAsHero}
            onClick={() => {
              if (!canMarkCurrentActorAsHero) return
              onSetHeroPosition?.(actorForAction)
            }}
          >
            {heroLocked ? `hero: ${hand.heroPosition}` : 'hero'}
          </button>
          <button
            type="button"
            className="action-builder__action-btn"
            disabled={!onMarkEmptyPosition || !actorForAction || actorForAction === hand.heroPosition}
            onClick={() =>
              actorForAction && actorForAction !== hand.heroPosition && onMarkEmptyPosition?.(actorForAction)
            }
          >
            empty
          </button>
        </div>
      )}

      <div className="action-builder__actions">
        <button type="button" className="action-builder__action-btn" disabled={!actorForAction} onClick={() => onActionTap('fold')}>
          Fold
        </button>
        <button
          type="button"
          className={`action-builder__action-btn ${!actorForAction ? 'action-builder__action-btn--muted' : ''}`}
          disabled={!actorForAction}
          onClick={() => onActionTap(facingBet ? 'call' : 'check')}
        >
          {facingBet ? `Call $${callAmount.toFixed(2)}` : 'Check'}
        </button>
        <button
          type="button"
          className={`action-builder__action-btn ${
            pendingSizedAction === (facingBet ? 'raise' : 'bet') ? 'action-builder__action-btn--active' : ''
          } ${!actorForAction ? 'action-builder__action-btn--muted' : ''}`}
          disabled={!actorForAction}
          onClick={() => onActionTap(facingBet ? 'raise' : 'bet')}
        >
          {facingBet ? 'Raise' : 'Bet'}
        </button>
      </div>

      {pendingSizedAction && (
        <div className="action-builder__sizing">
          {SIZING_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className="action-builder__size-btn"
              onClick={() => {
                const sizedAmount = (streetState.currentBet > 0 ? streetState.currentBet : 1) * (preset / 100)
                const toAmount = pendingSizedAction === 'raise' ? actorContribution + sizedAmount : sizedAmount
                if (pendingSizedAction === 'raise' && toAmount <= streetState.currentBet) return
                submitAction(pendingSizedAction, {
                  sizingType: 'percent',
                  sizingValue: preset,
                  rawDollars: sizedAmount,
                  toAmount,
                })
              }}
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
