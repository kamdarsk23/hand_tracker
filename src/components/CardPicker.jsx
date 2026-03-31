import { useMemo, useState } from 'react'
import { RANKS, SUITS } from '../constants'

export default function CardPicker({ usedCards = [], onSelect }) {
  const [selectedRank, setSelectedRank] = useState(null)
  const usedSet = useMemo(() => new Set(usedCards), [usedCards])

  const suitsWithInitial = useMemo(
    () => SUITS.map((suit) => ({ ...suit, initial: suit.name[0] })),
    []
  )

  const isRankFullyUsed = (rank) =>
    suitsWithInitial.every((suit) => usedSet.has(`${rank}${suit.initial}`))

  const handleSuitPick = (suitInitial) => {
    if (!selectedRank) return
    const pickedCard = `${selectedRank}${suitInitial}`
    if (usedSet.has(pickedCard)) return
    onSelect?.(pickedCard)
    setSelectedRank(null)
  }

  return (
    <div className="card-picker">
      {!selectedRank ? (
        <>
          <h3 className="card-picker__title">Select Rank</h3>
          <div className="card-picker__rank-grid">
            {RANKS.map((rank) => {
              const disabled = isRankFullyUsed(rank)
              return (
                <button
                  key={rank}
                  type="button"
                  className="card-picker__rank-btn"
                  disabled={disabled}
                  onClick={() => setSelectedRank(rank)}
                >
                  {rank}
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <>
          <div className="card-picker__suit-header">
            <button
              type="button"
              className="card-picker__back-btn"
              onClick={() => setSelectedRank(null)}
            >
              ← Back
            </button>
            <h3 className="card-picker__title">Select Suit for {selectedRank}</h3>
            <span />
          </div>
          <div className="card-picker__suit-grid">
            {suitsWithInitial.map((suit) => {
              const cardString = `${selectedRank}${suit.initial}`
              const disabled = usedSet.has(cardString)
              return (
                <button
                  key={suit.name}
                  type="button"
                  className="card-picker__suit-btn"
                  disabled={disabled}
                  onClick={() => handleSuitPick(suit.initial)}
                >
                  <span style={{ color: suit.color }} className="card-picker__suit-symbol">
                    {suit.symbol}
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
