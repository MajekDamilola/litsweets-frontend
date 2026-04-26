import React from 'react'

export default function Wallet({ account, isCorrectChain, loading, onConnect, onSwitch }) {
  const short = (addr) => addr ? `${addr.slice(0,6)}…${addr.slice(-4)}` : ''
  return (
    <div className="wallet-bar">
      {!account ? (
        <button className="btn-primary" onClick={onConnect} disabled={loading}>
          {loading ? <span className="spinner"/> : '⬡ Connect Wallet'}
        </button>
      ) : !isCorrectChain ? (
        <button className="btn-warn" onClick={onSwitch}>⚠ Switch to LitVM</button>
      ) : (
        <div className="wallet-connected">
          <span className="dot-green"/>
          <span className="wallet-addr">{short(account)}</span>
          <span className="chain-badge">LitVM</span>
        </div>
      )}
    </div>
  )
}
