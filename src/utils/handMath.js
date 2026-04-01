import { POSITIONS } from '../constants'

function actionAmount(actionItem, currentPot) {
  if (!actionItem) return 0
  if (actionItem.sizingType === 'dollars' && actionItem.rawDollars != null) {
    return Number(actionItem.rawDollars) || 0
  }
  if (actionItem.sizingType === 'percent' && actionItem.sizingValue != null) {
    return currentPot > 0 ? (currentPot * Number(actionItem.sizingValue || 0)) / 100 : 0
  }
  return 0
}

export function estimatePot(actionLists = [], initialPot = 0) {
  let pot = Number(initialPot) || 0
  let currentPrice = 0

  for (const actions of actionLists) {
    for (const actionItem of actions ?? []) {
      if (!actionItem) continue
      if (actionItem.action === 'bet' || actionItem.action === 'raise' || actionItem.action === 'all-in') {
        const amount = actionAmount(actionItem, pot)
        currentPrice = Math.max(currentPrice, amount)
        pot += amount
      }

      if (actionItem.action === 'call' && currentPrice > 0) {
        pot += currentPrice
      }
    }
  }

  return pot
}

export function getInitialPot(hand) {
  const sb = Number(hand?.blinds?.sb) || 0
  const bb = Number(hand?.blinds?.bb) || 0
  const straddleActive = Boolean(hand?.straddle?.active)
  const straddleAmount = straddleActive ? Number(hand?.straddle?.amount) || 0 : 0
  return sb + bb + straddleAmount
}

export function getOrderedHandPositions(hand) {
  const included = [hand.heroPosition, ...(hand.villains ?? []).map((villain) => villain.position)]
    .filter(Boolean)
    .filter((position, index, arr) => arr.indexOf(position) === index)
  return POSITIONS.filter((position) => included.includes(position))
}

export function getActivePositionsAfterActions(startPositions, actionLists = []) {
  const folded = new Set()
  const allIn = new Set()
  for (const actions of actionLists) {
    for (const actionItem of actions ?? []) {
      if (actionItem?.action === 'fold' && actionItem.position) {
        folded.add(actionItem.position)
      }
      if (actionItem?.action === 'all-in' && actionItem.position) {
        allIn.add(actionItem.position)
      }
    }
  }
  return startPositions.filter((position) => !folded.has(position) && !allIn.has(position))
}

export function collectUsedCards(hand) {
  const used = new Set()
  const hero = hand.heroCards ?? []
  const flop = hand.flop ?? []
  const turn = hand.turn ? [hand.turn] : []
  const river = hand.river ? [hand.river] : []
  const villainShowdown = (hand.villainShowdown ?? []).flatMap((entry) => entry.cards ?? [])

  for (const card of [...hero, ...flop, ...turn, ...river, ...villainShowdown]) {
    if (card) used.add(card)
  }

  return [...used]
}
