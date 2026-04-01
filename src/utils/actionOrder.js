const POSTFLOP_CLOCKWISE = ['SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'UTG+3', 'LJ', 'HJ', 'CO', 'BTN']
const PREFLOP_CYCLE = ['UTG', 'UTG+1', 'UTG+2', 'UTG+3', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB']

function uniquePositions(positions) {
  return [...new Set((positions ?? []).filter(Boolean))]
}

function rotateFrom(order, firstActor) {
  const index = order.indexOf(firstActor)
  if (index < 0) return order
  return [...order.slice(index), ...order.slice(0, index)]
}

function pickPreflopOrder(straddle) {
  if (!straddle?.active) return rotateFrom(PREFLOP_CYCLE, 'UTG')
  if (straddle.position === 'UTG') return rotateFrom(PREFLOP_CYCLE, 'UTG+2')
  if (straddle.position === 'BTN') return rotateFrom(PREFLOP_CYCLE, 'SB')
  return rotateFrom(PREFLOP_CYCLE, 'UTG')
}

export default function getActionOrder(street, allPositions, straddle) {
  const included = uniquePositions(allPositions)
  const baseOrder =
    street === 'preflop' ? pickPreflopOrder(straddle) : POSTFLOP_CLOCKWISE

  return baseOrder.filter((position) => included.includes(position))
}

if (import.meta.env?.DEV) {
  const sample = ['UTG', 'UTG+1', 'UTG+2', 'UTG+3', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB']

  const normalPreflop = getActionOrder('preflop', sample, { active: false, position: null })
  console.assert(normalPreflop[0] === 'UTG', 'Normal preflop should start at UTG')
  console.assert(
    normalPreflop[normalPreflop.length - 1] === 'BB',
    'Normal preflop should end at BB'
  )

  const utgStraddlePreflop = getActionOrder('preflop', sample, { active: true, position: 'UTG' })
  console.assert(
    utgStraddlePreflop[0] === 'UTG+2',
    'UTG straddle preflop should start at UTG+2'
  )
  console.assert(utgStraddlePreflop.includes('UTG'), 'UTG straddle preflop should include UTG')
  console.assert(utgStraddlePreflop.includes('UTG+1'), 'UTG straddle preflop should include UTG+1')

  const btnStraddlePreflop = getActionOrder('preflop', sample, { active: true, position: 'BTN' })
  console.assert(btnStraddlePreflop[0] === 'SB', 'BTN straddle preflop should start at SB')
  console.assert(
    btnStraddlePreflop.includes('BTN'),
    'BTN straddle preflop should include BTN'
  )

  const postFlop = getActionOrder('flop', sample, { active: true, position: 'UTG' })
  console.assert(postFlop[0] === 'SB', 'Post-flop should start at SB')
  console.assert(postFlop[postFlop.length - 1] === 'BTN', 'Post-flop should end at BTN')
}
