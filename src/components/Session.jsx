import React, { useState, useEffect } from 'react'
import { DIFFICULTIES } from '../hooks/useContract'

export default function Session({ account, isCorrectChain, onStart, onSubmit, loading, lastScore, sessionActive, livesLeft }) {
  const [selectedDiff, setSelectedDiff] = useState(0)

  return (
    <div className="session-card">
      <div className="session-icon">🎮</div>
      <h3>Session</h3>

      {!account ? (
        <p className="muted">Connect wallet to play on-chain</p>
      ) : !isCorrectChain ? (
        <p className="muted warn">Switch to LitVM network</p>
      ) : sessionActive ? (
        <div className="session-active">
          <div className="session-status">
            <span className="dot-green"/> Session Active
          </div>
          <div className="lives-row">Lives: {'❤️'.repeat(Math.max(0,livesLeft))}{'🖤'.repeat(Math.max(0,3-livesLeft))}</div>
          {lastScore !== null && (
            <button className="btn-primary" onClick={() => onSubmit(lastScore)} disabled={loading}>
              {loading ? <span className="spinner"/> : `⬆ Submit Score: ${lastScore.toLocaleString()}`}
            </button>
          )}
        </div>
      ) : (
        <div className="session-start">
          <div className="diff-grid">
            {DIFFICULTIES.map(d => (
              <button key={d.id} className={`diff-btn ${selectedDiff===d.id?'diff-selected':''}`} onClick={()=>setSelectedDiff(d.id)}>
                <span>{d.emoji}</span>
                <span>{d.label}</span>
                <span className="diff-fee">{d.fee} zkLTC</span>
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={()=>onStart(selectedDiff)} disabled={loading}>
            {loading ? <span className="spinner"/> : `Start Session (${DIFFICULTIES[selectedDiff].fee} zkLTC)`}
          </button>
        </div>
      )}
    </div>
  )
}
