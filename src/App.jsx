import React, { useState, useEffect, useCallback } from 'react'
import { useContract } from './hooks/useContract'
import Wallet from './components/Wallet'
import Game from './components/Game'
import Session from './components/Session'
import Leaderboard from './components/Leaderboard'
import './app.css'

export default function App() {
  const {
    account, isCorrectChain, loading, error,
    connectWallet, switchToLitVM,
    startSession, submitScore, getSession, getPersonalBest, getLeaderboard,
  } = useContract()

  const [lastScore, setLastScore] = useState(null)
  const [sessionActive, setSessionActive] = useState(false)
  const [livesLeft, setLivesLeft] = useState(3)
  const [submitMsg, setSubmitMsg] = useState(null)

  const refreshSession = useCallback(async () => {
    const s = await getSession()
    if (s) { setSessionActive(s.active); setLivesLeft(Number(s.livesRemaining)) }
  }, [getSession])

  useEffect(() => { if (account) refreshSession() }, [account, refreshSession])

  const handleStart = async (diff) => {
    const tx = await startSession(diff)
    if (tx) { setSubmitMsg(null); await refreshSession() }
  }

  const handleSubmit = async (score) => {
    setSubmitMsg(null)
    const tx = await submitScore(score)
    if (tx) { setSubmitMsg('✓ Score submitted on-chain!'); await refreshSession() }
    else setSubmitMsg('✗ Submission failed')
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">🍬</span>
          <span className="logo-text">LitSweets</span>
          <span className="logo-sub">LitVM LiteForge</span>
        </div>
        <Wallet account={account} isCorrectChain={isCorrectChain} loading={loading} onConnect={connectWallet} onSwitch={switchToLitVM}/>
      </header>

      {error && <div className="error-banner">⚠ {error}</div>}
      {submitMsg && <div className={`submit-banner ${submitMsg.startsWith('✓')?'success':''}`}>{submitMsg}</div>}

      <main className="app-main">
        <div className="left-col">
          <Session
            account={account} isCorrectChain={isCorrectChain}
            onStart={handleStart} onSubmit={handleSubmit}
            loading={loading} lastScore={lastScore}
            sessionActive={sessionActive} livesLeft={livesLeft}
          />
          <Leaderboard getLeaderboard={getLeaderboard} getPersonalBest={getPersonalBest} account={account}/>
        </div>
        <div className="center-col">
          <Game account={account} sessionActive={sessionActive} livesLeft={livesLeft} onScoreUpdate={setLastScore}/>
        </div>
      </main>
    </div>
  )
}
