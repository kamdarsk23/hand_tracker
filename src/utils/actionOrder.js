const POSTFLOP_CLOCKWISE = ['SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN']

const PREFLOP_NO_STRADDLE = ['UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB']
const PREFLOP_UTG_STRADDLE = ['UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB', 'UTG']
const PREFLOP_BTN_STRADDLE = ['UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'SB', 'BB', 'BTN']

function uniquePositions(positions) {
  return [...new Set((positions ?? []).filter(Boolean))]
}

function pickPreflopOrder(straddle) {
  if (!straddle?.active) return PREFLOP_NO_STRADDLE
  if (straddle.position === 'UTG') return PREFLOP_UTG_STRADDLE
  if (straddle.position === 'BTN') return PREFLOP_BTN_STRADDLE
  return PREFLOP_NO_STRADDLE
}

export default function getActionOrder(street, allPositions, straddle) {
  const included = uniquePositions(allPositions)
  const baseOrder =
    street === 'preflop' ? pickPreflopOrder(straddle) : POSTFLOP_CLOCKWISE

  return baseOrder.filter((position) => included.includes(position))
}

if (import.meta.env?.DEV) {
  const sample = ['UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB']

  const normalPreflop = getActionOrder('preflop', sample, { active: false, position: null })
  console.assert(normalPreflop[0] === 'UTG', 'Normal preflop should start at UTG')
  console.assert(
    normalPreflop[normalPreflop.length - 1] === 'BB',
    'Normal preflop should end at BB'
  )

  const utgStraddlePreflop = getActionOrder('preflop', sample, { active: true, position: 'UTG' })
  console.assert(
    utgStraddlePreflop[0] === 'UTG+1',
    'UTG straddle preflop should start at UTG+1'
  )
  console.assert(
    utgStraddlePreflop[utgStraddlePreflop.length - 1] === 'UTG',
    'UTG straddle preflop should end at UTG'
  )

  const btnStraddlePreflop = getActionOrder('preflop', sample, { active: true, position: 'BTN' })
  console.assert(btnStraddlePreflop[0] === 'UTG', 'BTN straddle preflop should start at UTG')
  console.assert(
    btnStraddlePreflop[btnStraddlePreflop.length - 1] === 'BTN',
    'BTN straddle preflop should end at BTN'
  )

  const postFlop = getActionOrder('flop', sample, { active: true, position: 'UTG' })
  console.assert(postFlop[0] === 'SB', 'Post-flop should start at SB')
  console.assert(postFlop[postFlop.length - 1] === 'BTN', 'Post-flop should end at BTN')
}
