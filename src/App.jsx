import { useMemo, useState } from 'react'
import logger from './utils/logger'
import TableSetup from './components/TableSetup'
import PreflopAction from './components/PreflopAction'
import FlopStep from './components/FlopStep'
import TurnStep from './components/TurnStep'
import RiverStep from './components/RiverStep'
import ResultStep from './components/ResultStep'
import HandList from './components/HandList'
import HandDetail from './components/HandDetail'
import { useLocalStorage } from './hooks/useLocalStorage'
import {
  collectUsedCards,
  getActivePositionsAfterActions,
  getInitialPot,
  getOrderedHandPositions,
} from './utils/handMath'

function createNewHand() {
  return {
    id: null,
    createdAt: null,
    updatedAt: null,
    blinds: { sb: '', bb: '' },
    straddle: { active: false, position: null, amount: null },
    emptyPositions: [],
    heroPosition: null,
    heroStack: '',
    heroCards: [null, null],
    villains: [],
    flop: null,
    turn: null,
    river: null,
    preflopActions: [],
    flopActions: [],
    turnActions: [],
    riverActions: [],
    result: null,
    potSize: null,
    villainShowdown: [],
    notes: '',
  }
}

function cloneHand(hand) {
  if (typeof structuredClone === 'function') return structuredClone(hand)
  return JSON.parse(JSON.stringify(hand))
}

const LOGGER_STEPS = ['Table', 'Preflop', 'Flop', 'Turn', 'River', 'Result']

function HandLoggerView({ hand, onChange, onExit, onSaveHand, editMode = false }) {
  const [step, setStep] = useState(0)
  const orderedPositions = getOrderedHandPositions(hand)
  const flopPositions = getActivePositionsAfterActions(orderedPositions, [hand.preflopActions ?? []])
  const turnPositions = getActivePositionsAfterActions(orderedPositions, [
    hand.preflopActions ?? [],
    hand.flopActions ?? [],
  ])
  const riverPositions = getActivePositionsAfterActions(orderedPositions, [
    hand.preflopActions ?? [],
    hand.flopActions ?? [],
    hand.turnActions ?? [],
  ])
  const showdownPositions = getActivePositionsAfterActions(orderedPositions, [
    hand.preflopActions ?? [],
    hand.flopActions ?? [],
    hand.turnActions ?? [],
    hand.riverActions ?? [],
  ]).filter((position) => position !== hand.heroPosition)
  const usedCards = collectUsedCards(hand)
  const latestStreetStep = (() => {
    if (hand.river || (hand.riverActions ?? []).length > 0 || hand.result != null) return 4
    if (hand.turn || (hand.turnActions ?? []).length > 0) return 3
    if ((hand.flop ?? []).some(Boolean) || (hand.flopActions ?? []).length > 0) return 2
    return 1
  })()

  const goBack = () => {
    if (step === 0) {
      onExit?.()
      return
    }
    setStep((prev) => prev - 1)
  }

  return (
    <div className="view logger-flow">
      <div className="logger-flow__stepper">
        {LOGGER_STEPS.map((label, index) => (
          <button
            key={label}
            type="button"
            className={`logger-flow__step ${index === step ? 'logger-flow__step--active' : ''}`}
            disabled={!editMode}
            onClick={() => editMode && setStep(index)}
          >
            <span className="logger-flow__dot" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {step === 0 && (
        <TableSetup hand={hand} onChange={onChange} onBack={goBack} onNext={() => setStep(1)} />
      )}
      {step === 1 && (
        <PreflopAction
          hand={hand}
          onChange={onChange}
          onBack={goBack}
          positions={orderedPositions}
          initialPot={getInitialPot(hand)}
          editable={step === latestStreetStep}
          onDealFlop={() => setStep(2)}
          onHandOver={() => setStep(5)}
        />
      )}
      {step === 2 && (
        <FlopStep
          hand={hand}
          onChange={onChange}
          onBack={goBack}
          usedCards={usedCards}
          positions={flopPositions}
          editable={step === latestStreetStep}
          onDealTurn={() => setStep(3)}
          onHandOver={() => setStep(5)}
        />
      )}
      {step === 3 && (
        <TurnStep
          hand={hand}
          onChange={onChange}
          onBack={goBack}
          usedCards={usedCards}
          positions={turnPositions}
          editable={step === latestStreetStep}
          onDealRiver={() => setStep(4)}
          onHandOver={() => setStep(5)}
        />
      )}
      {step === 4 && (
        <RiverStep
          hand={hand}
          onChange={onChange}
          onBack={goBack}
          usedCards={usedCards}
          positions={riverPositions}
          editable={step === latestStreetStep}
          onShowdown={() => setStep(5)}
          onHandOver={() => setStep(5)}
        />
      )}
      {step === 5 && (
        <ResultStep
          hand={hand}
          onChange={onChange}
          onBack={goBack}
          usedCards={usedCards}
          remainingVillains={showdownPositions}
          onSaveHand={() => onSaveHand?.(hand)}
        />
      )}
    </div>
  )
}

// ── App shell ─────────────────────────────────────────────────────────────────

const VIEW_TITLES = {
  list:   'Hand Tracker',
  logger: 'Log Hand',
  detail: 'Hand Detail',
}

export default function App() {
  const [view, setView]     = useState('list')   // 'list' | 'logger' | 'detail'
  const [detailId, setDetailId] = useState(null)
  const [activeHand, setActiveHand] = useState(() => createNewHand())
  const [loggerMode, setLoggerMode] = useState('create') // 'create' | 'edit'
  const [savedHands, setSavedHands] = useLocalStorage('hand-tracker-hands', [])
  const selectedHand = useMemo(
    () => (savedHands ?? []).find((hand) => hand.id === detailId) ?? null,
    [savedHands, detailId]
  )

  const saveHand = (draftHand) => {
    const now = new Date().toISOString()
    const heroStack = draftHand.heroStack === '' ? null : Number(draftHand.heroStack)
    const potSize = draftHand.potSize === '' ? null : Number(draftHand.potSize)
    const sb = draftHand.blinds?.sb === '' ? null : Number(draftHand.blinds?.sb)
    const bb = draftHand.blinds?.bb === '' ? null : Number(draftHand.blinds?.bb)
    const straddleAmount =
      draftHand.straddle?.amount === '' || draftHand.straddle?.amount == null
        ? null
        : Number(draftHand.straddle.amount)
    const normalizedHand = {
      ...draftHand,
      heroStack: Number.isFinite(heroStack) ? heroStack : null,
      potSize: Number.isFinite(potSize) ? potSize : null,
      blinds: {
        sb: Number.isFinite(sb) ? sb : null,
        bb: Number.isFinite(bb) ? bb : null,
      },
      straddle: {
        active: Boolean(draftHand.straddle?.active),
        position: draftHand.straddle?.active ? draftHand.straddle?.position ?? null : null,
        amount:
          draftHand.straddle?.active && Number.isFinite(straddleAmount) ? straddleAmount : null,
      },
    }

    if (loggerMode === 'edit' && normalizedHand.id) {
      const updatedHand = {
        ...normalizedHand,
        updatedAt: now,
        createdAt: normalizedHand.createdAt ?? now,
      }
      setSavedHands((prev) =>
        (prev ?? []).map((hand) => (hand.id === updatedHand.id ? updatedHand : hand))
      )
      logger.info('Hand updated', updatedHand.id)
    } else {
      const createdHand = {
        ...normalizedHand,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      }
      setSavedHands((prev) => [createdHand, ...(prev ?? [])])
      logger.info('Hand saved', createdHand.id)
    }

    setActiveHand(createNewHand())
    setLoggerMode('create')
    setDetailId(null)
    setView('list')
  }

  const startCreateHand = () => {
    setLoggerMode('create')
    setActiveHand(createNewHand())
    setView('logger')
  }

  const startEditHand = (hand) => {
    if (!hand) return
    setLoggerMode('edit')
    setActiveHand(cloneHand(hand))
    setView('logger')
  }

  const deleteHand = (id) => {
    setSavedHands((prev) => (prev ?? []).filter((hand) => hand.id !== id))
    setDetailId(null)
    setView('list')
  }

  const showBack = view === 'detail'

  return (
    <div className="app-shell">
      {/* ── Top bar ── */}
      <header className="top-bar">
        {showBack ? (
          <button className="top-bar__back" onClick={() => setView('list')}>
            ← Back
          </button>
        ) : (
          <span />
        )}
        <h1 className="top-bar__title">{VIEW_TITLES[view]}</h1>
        {/* Spacer to keep title centred when back button is shown */}
        <span style={{ minWidth: 44 }} />
      </header>

      {/* ── View content ── */}
      {view === 'list' && (
        <HandList hands={savedHands ?? []} onSelect={(id) => {
          setDetailId(id)
          setView('detail')
        }} />
      )}
      {view === 'logger' && (
        <HandLoggerView
          hand={activeHand}
          onChange={setActiveHand}
          editMode={loggerMode === 'edit'}
          onExit={() => setView(loggerMode === 'edit' ? 'detail' : 'list')}
          onSaveHand={saveHand}
        />
      )}
      {view === 'detail' && (
        <HandDetail
          hand={selectedHand}
          onEdit={() => startEditHand(selectedHand)}
          onDelete={() => selectedHand && deleteHand(selectedHand.id)}
        />
      )}

      {/* ── FAB (only on list view) ── */}
      {view === 'list' && (
        <button
          className="fab"
          aria-label="Log new hand"
          onClick={startCreateHand}
        >
          +
        </button>
      )}
    </div>
  )
}
