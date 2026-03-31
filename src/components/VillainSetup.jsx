import { useMemo, useState } from 'react'
import { POSITIONS } from '../constants'

function toStackValue(raw) {
  if (raw == null || raw === '') return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

export default function VillainSetup({ hand, onChange, onBack, onNext }) {
  const [expanded, setExpanded] = useState({})
  const [stackDrafts, setStackDrafts] = useState({})

  const villains = hand.villains ?? []
  const villainPositions = useMemo(
    () => new Set(villains.map((villain) => villain.position)),
    [villains]
  )

  const updateHand = (patch) => onChange?.({ ...hand, ...patch })

  const toggleVillain = (position) => {
    if (position === hand.heroPosition) return
    const nextVillains = villainPositions.has(position)
      ? villains.filter((villain) => villain.position !== position)
      : [...villains, { position, stack: null }]

    nextVillains.sort((a, b) => POSITIONS.indexOf(a.position) - POSITIONS.indexOf(b.position))
    updateHand({ villains: nextVillains })
  }

  const setVillainStack = (position, inputValue) => {
    setStackDrafts((prev) => ({ ...prev, [position]: inputValue }))
    const nextVillains = villains.map((villain) =>
      villain.position === position ? { ...villain, stack: toStackValue(inputValue) } : villain
    )
    updateHand({ villains: nextVillains })
  }

  const toggleStackExpanded = (position) => {
    setExpanded((prev) => ({ ...prev, [position]: !prev[position] }))
    const existing = villains.find((villain) => villain.position === position)
    if (existing && stackDrafts[position] == null && existing.stack != null) {
      setStackDrafts((prev) => ({ ...prev, [position]: String(existing.stack) }))
    }
  }

  return (
    <div className="villain-setup">
      <button type="button" className="logger-step__back" onClick={onBack}>
        ← Back
      </button>

      <section className="hero-setup__section">
        <h2 className="hero-setup__label">Select Villains</h2>
        <div className="hero-setup__position-grid">
          {POSITIONS.map((position) => {
            const isHero = position === hand.heroPosition
            const isSelected = villainPositions.has(position)
            return (
              <button
                key={position}
                type="button"
                disabled={isHero}
                className={`hero-setup__position-btn ${
                  isSelected ? 'hero-setup__position-btn--selected' : ''
                }`}
                onClick={() => toggleVillain(position)}
              >
                {position}
              </button>
            )
          })}
        </div>
      </section>

      <section className="hero-setup__section">
        {villains.map((villain) => {
          const isExpanded = Boolean(expanded[villain.position])
          const inputValue =
            stackDrafts[villain.position] ?? (villain.stack != null ? String(villain.stack) : '')
          return (
            <div key={villain.position} className="villain-setup__row">
              <div className="villain-setup__row-header">
                <strong>{villain.position}</strong>
                <button
                  type="button"
                  className="villain-setup__link"
                  onClick={() => toggleStackExpanded(villain.position)}
                >
                  {isExpanded ? 'hide stack' : 'add stack'}
                </button>
              </div>
              {isExpanded && (
                <label className="hero-setup__stack-input-wrap">
                  <span className="hero-setup__dollar">$</span>
                  <input
                    className="hero-setup__stack-input"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={inputValue}
                    onChange={(event) => setVillainStack(villain.position, event.target.value)}
                  />
                </label>
              )}
            </div>
          )
        })}
      </section>

      <button
        type="button"
        className="hero-setup__next-btn"
        disabled={villains.length === 0}
        onClick={onNext}
      >
        Next
      </button>
    </div>
  )
}
