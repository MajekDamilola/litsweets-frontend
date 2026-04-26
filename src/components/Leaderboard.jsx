import React, { useState, useEffect, useCallback } from 'react'
import { DIFFICULTIES } from '../hooks/useContract'

const MEDALS = ['🥇','🥈','🥉']

export default function Leaderboard({ getLeaderboard, getPersonalBest, account }) {
  const [entries, setEntries] = useState([])
  const [diff, setDiff] = useState(0)
  const [pb, setPb] = useState(0)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    const [lb, best] = await Promise.all([getLeaderboard(diff), getPersonalBest(diff)])
    setEntries(lb); setPb(best); setLoading(false)
  }, [diff, getLeaderboard, getPersonalBest])

  useEffect(()=>{refresh()},[refresh])

  const short = a => `${a.slice(0,6)}…${a.slice(-4)}`
  const isMe = a => account && a.toLowerCase()===account.toLowerCase()

  return (
    <div className="leaderboard-card">
      <div className="lb-header">
        <span>🏅 Leaderboard</span>
        <button className="btn-icon" onClick={refresh} disabled={loading}>↻</button>
      </div>
      <div className="diff-tabs">
        {DIFFICULTIES.map(d=>(
          <button key={d.id} className={`diff-tab ${diff===d.id?'diff-tab-active':''}`} onClick={()=>setDiff(d.id)}>
            {d.emoji} {d.label}
          </button>
        ))}
      </div>
      {pb > 0 && <div className="my-pb">Your best: <strong>{pb.toLocaleString()}</strong></div>}
      {loading ? <div className="lb-loading">Loading…</div>
       : entries.length===0 ? <div className="lb-empty">No scores yet!</div>
       : <ol className="lb-list">
          {entries.map((e,i)=>(
            <li key={e.address+i} className={`lb-row ${isMe(e.address)?'lb-me':''}`}>
              <span className="lb-rank">{MEDALS[i]||`#${i+1}`}</span>
              <span className="lb-addr">{isMe(e.address)?'You':short(e.address)}</span>
              <span className="lb-score">{e.score.toLocaleString()}</span>
            </li>
          ))}
        </ol>
      }
    </div>
  )
}
