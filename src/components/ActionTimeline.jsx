import { useState } from 'react'
import { ACTIONS } from '../constants'

const ACTION_LABELS = {
  fold: 'folds',
  check: 'checks',
  call: 'calls',
  bet: 'bets',
  raise: 'raises',
  'all-in': 'goes all-in',
}

function formatAction(actionItem) {
  if (!actionItem) return ''
  const verb = ACTION_LABELS[actionItem.action] ?? actionItem.action
  if (actionItem.sizingType === 'percent' && actionItem.sizingValue != null) {
    const dollars = actionItem.rawDollars != null ? ` ($${actionItem.rawDollars})` : ''
    return `${actionItem.position} ${verb} ${actionItem.sizingValue}%${dollars}`
  }
  if (actionItem.sizingType === 'dollars' && actionItem.rawDollars != null) {
    return `${actionItem.position} ${verb} $${actionItem.rawDollars}`
  }
  return `${actionItem.position} ${verb}`
}

function toNumberOrNull(value) {
  if (value == null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export default function ActionTimeline({ actions = [], onDelete, onUpdate }) {
  const [expandedFor, setExpandedFor] = useState(null)
  const [draftDollar, setDraftDollar] = useState('')

  if (actions.length === 0) {
    return <p className="action-timeline__empty">No actions yet.</p>
  }

  const updateAction = (index, patch) => {
    const current = actions[index]
    if (!current) return
    onUpdate?.(index, { ...current, ...patch })
  }

  return (
    <div className="action-timeline">
      {actions.map((actionItem, index) => {
        const isOpen = expandedFor === index
        const hasPercent = actionItem.sizingType === 'percent' && actionItem.sizingValue != null
        const hasDollars = actionItem.sizingType === 'dollars' || actionItem.rawDollars != null
        return (
          <div key={actionItem.id ?? `${actionItem.position}-${index}`} className="action-timeline__row action-timeline__row--stacked">
            <button
              type="button"
              className="action-timeline__item"
              onClick={() => {
                setExpandedFor(isOpen ? null : index)
                setDraftDollar(actionItem.rawDollars != null ? String(actionItem.rawDollars) : '')
              }}
            >
              {formatAction(actionItem)}
            </button>
            {isOpen && (
              <div className="action-timeline__editor">
                <div className="action-timeline__action-types">
                  {ACTIONS.map((action) => (
                    <button
                      key={action}
                      type="button"
                      className={`action-timeline__type-btn ${
                        actionItem.action === action ? 'action-timeline__type-btn--active' : ''
                      }`}
                      onClick={() => {
                        if (action === 'fold' || action === 'check' || action === 'call') {
                          updateAction(index, {
                            action,
                            sizingType: null,
                            sizingValue: null,
                            rawDollars: null,
                          })
                          return
                        }
                        updateAction(index, { action })
                      }}
                    >
                      {action}
                    </button>
                  ))}
                </div>

                {(hasPercent || hasDollars) && (
                  <div className="action-timeline__dollar-edit">
                    <label className="hero-setup__stack-input-wrap">
                      <span className="hero-setup__dollar">$</span>
                      <input
                        className="hero-setup__stack-input"
                        type="text"
                        inputMode="decimal"
                        placeholder="raw dollars"
                        value={draftDollar}
                        onChange={(event) => setDraftDollar(event.target.value)}
                      />
                    </label>
                    <button
                      type="button"
                      className="action-builder__confirm-btn"
                      onClick={() => {
                        updateAction(index, { rawDollars: toNumberOrNull(draftDollar) })
                      }}
                    >
                      Set $
                    </button>
                  </div>
                )}

                <div className="action-timeline__editor-footer">
                  <button
                    type="button"
                    className="action-timeline__delete"
                    onClick={() => {
                      onDelete?.(index)
                      setExpandedFor(null)
                    }}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    className="hero-setup__position-btn"
                    onClick={() => setExpandedFor(null)}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
