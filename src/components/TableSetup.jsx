function toDoubleBb(bbValue) {
  const bb = Number(bbValue)
  if (!Number.isFinite(bb) || bb <= 0) return ''
  return String(bb * 2)
}

export default function TableSetup({ hand, onChange, onBack, onNext }) {
  const blinds = hand.blinds ?? { sb: '', bb: '' }
  const straddle = hand.straddle ?? { active: false, position: null, amount: null }
  const canProceed = blinds.sb !== '' && blinds.bb !== ''

  const updateHand = (patch) => onChange?.({ ...hand, ...patch })

  const setBlinds = (key, value) => {
    updateHand({ blinds: { ...blinds, [key]: value } })
  }

  const setStraddleMode = (mode) => {
    if (mode === 'off') {
      updateHand({
        straddle: { active: false, position: null, amount: null },
      })
      return
    }

    const isSameMode = straddle.active && straddle.position === mode
    const nextAmount = isSameMode ? straddle.amount : toDoubleBb(blinds.bb)
    updateHand({
      straddle: { active: true, position: mode, amount: nextAmount },
    })
  }

  return (
    <div className="hero-setup">
      <button type="button" className="logger-step__back" onClick={onBack}>
        ← Back
      </button>

      <section className="hero-setup__section">
        <h2 className="hero-setup__label">Blinds</h2>
        <div className="table-setup__blinds-row">
          <label className="hero-setup__stack-input-wrap">
            <span className="hero-setup__dollar">SB $</span>
            <input
              className="hero-setup__stack-input"
              type="text"
              inputMode="decimal"
              value={blinds.sb ?? ''}
              placeholder="0.00"
              onChange={(event) => setBlinds('sb', event.target.value)}
            />
          </label>
          <label className="hero-setup__stack-input-wrap">
            <span className="hero-setup__dollar">BB $</span>
            <input
              className="hero-setup__stack-input"
              type="text"
              inputMode="decimal"
              value={blinds.bb ?? ''}
              placeholder="0.00"
              onChange={(event) => setBlinds('bb', event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="hero-setup__section">
        <h2 className="hero-setup__label">Straddle</h2>
        <div className="table-setup__straddle-row">
          <button
            type="button"
            className={`hero-setup__position-btn ${
              !straddle.active ? 'hero-setup__position-btn--selected' : ''
            }`}
            onClick={() => setStraddleMode('off')}
          >
            Off
          </button>
          <button
            type="button"
            className={`hero-setup__position-btn ${
              straddle.active && straddle.position === 'UTG' ? 'hero-setup__position-btn--selected' : ''
            }`}
            onClick={() => setStraddleMode('UTG')}
          >
            UTG
          </button>
          <button
            type="button"
            className={`hero-setup__position-btn ${
              straddle.active && straddle.position === 'BTN' ? 'hero-setup__position-btn--selected' : ''
            }`}
            onClick={() => setStraddleMode('BTN')}
          >
            BTN
          </button>
        </div>

        {straddle.active && (
          <label className="hero-setup__stack-input-wrap">
            <span className="hero-setup__dollar">Straddle $</span>
            <input
              className="hero-setup__stack-input"
              type="text"
              inputMode="decimal"
              value={straddle.amount ?? ''}
              placeholder="0.00"
              onChange={(event) =>
                updateHand({
                  straddle: { ...straddle, amount: event.target.value },
                })
              }
            />
          </label>
        )}
      </section>

      <button
        type="button"
        className="hero-setup__next-btn"
        disabled={!canProceed}
        onClick={onNext}
      >
        Next
      </button>
    </div>
  )
}
