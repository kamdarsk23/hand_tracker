function getPreflopPotType(preflopActions = []) {
  const raiseCount = preflopActions.filter((actionItem) =>
    ['raise', 'bet', 'all-in'].includes(actionItem?.action)
  ).length

  if (raiseCount === 0) return 'limped pot'
  if (raiseCount === 1) return 'single raised'
  if (raiseCount === 2) return '3bet pot'
  return '4bet+'
}

function getEndStreet(hand) {
  if (!hand.flop || hand.flop.filter(Boolean).length < 3) return 'preflop'
  if (!hand.turn) return 'flop'
  if (!hand.river) return 'turn'
  return 'river'
}

export function getHandSummary(hand) {
  const base = getPreflopPotType(hand.preflopActions ?? [])
  const hasShowdownCards = (hand.villainShowdown ?? []).some((entry) =>
    (entry.cards ?? []).some(Boolean)
  )

  if (hasShowdownCards) return base
  return `${base} - folded on ${getEndStreet(hand)}`
}
