import React, { useState, useEffect, useCallback, useRef } from 'react'

const COLS = 8, ROWS = 8
const GEMS = ['🍬','🍭','🍡','🍮','🧁','🍩','🍪']
const TIME_LIMIT = 60

function makeBoard() {
  let b
  do { b = Array.from({length:ROWS},()=>Array.from({length:COLS},()=>GEMS[Math.floor(Math.random()*GEMS.length)])) }
  while (findMatches(b).length > 0)
  return b
}

function findMatches(board) {
  const m = new Set()
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS-2;c++)
    if (board[r][c]&&board[r][c]===board[r][c+1]&&board[r][c]===board[r][c+2])
      [c,c+1,c+2].forEach(i=>m.add(`${r},${i}`))
  for (let c=0;c<COLS;c++) for (let r=0;r<ROWS-2;r++)
    if (board[r][c]&&board[r][c]===board[r+1][c]&&board[r][c]===board[r+2][c])
      [r,r+1,r+2].forEach(i=>m.add(`${i},${c}`))
  return [...m].map(k=>k.split(',').map(Number))
}

function applyGravity(board) {
  const b = board.map(r=>[...r])
  for (let c=0;c<COLS;c++) {
    let e=ROWS-1
    for (let r=ROWS-1;r>=0;r--) if(b[r][c]){b[e][c]=b[r][c];if(e!==r)b[r][c]=null;e--}
    while(e>=0){b[e][c]=GEMS[Math.floor(Math.random()*GEMS.length)];e--}
  }
  return b
}

function resolveBoard(board) {
  let b=board.map(r=>[...r]),total=0,matches
  while((matches=findMatches(b)).length>0){
    total+=matches.length
    matches.forEach(([r,c])=>{b[r][c]=null})
    b=applyGravity(b)
  }
  return {board:b,cleared:total}
}

export default function Game({ account, sessionActive, livesLeft, onScoreUpdate, difficulty }) {
  const [board,setBoard]=useState(makeBoard)
  const [selected,setSelected]=useState(null)
  const [score,setScore]=useState(0)
  const [timeLeft,setTimeLeft]=useState(TIME_LIMIT)
  const [gameOver,setGameOver]=useState(false)
  const [combo,setCombo]=useState(0)
  const [flash,setFlash]=useState(null)
  const timerRef=useRef(null)

  useEffect(()=>{
    if(gameOver||!sessionActive)return
    timerRef.current=setInterval(()=>{
      setTimeLeft(t=>{if(t<=1){clearInterval(timerRef.current);setGameOver(true);return 0}return t-1})
    },1000)
    return()=>clearInterval(timerRef.current)
  },[gameOver,sessionActive])

  useEffect(()=>{if(gameOver&&onScoreUpdate)onScoreUpdate(score)},[gameOver,score])

  const swap=useCallback((r1,c1,r2,c2)=>{
    if(r2<0||r2>=ROWS||c2<0||c2>=COLS)return
    const b=board.map(r=>[...r]);[b[r1][c1],b[r2][c2]]=[b[r2][c2],b[r1][c1]]
    const matches=findMatches(b)
    if(!matches.length){setSelected(null);return}
    const{board:resolved,cleared}=resolveBoard(b)
    const pts=cleared*10*(combo+1)
    setBoard(resolved);setScore(s=>s+pts);setCombo(c=>c+1)
    setFlash(`+${pts}`);setTimeout(()=>setFlash(null),800);setSelected(null)
  },[board,combo])

  const handleCell=(r,c)=>{
    if(gameOver||!sessionActive)return
    if(!selected){setSelected([r,c]);setCombo(0);return}
    const[sr,sc]=selected
    if(sr===r&&sc===c){setSelected(null);return}
    if(Math.abs(sr-r)+Math.abs(sc-c)===1)swap(sr,sc,r,c)
    else setSelected([r,c])
  }

  const restart=()=>{setBoard(makeBoard());setScore(0);setTimeLeft(TIME_LIMIT);setGameOver(false);setSelected(null);setCombo(0)}
  const pct=(timeLeft/TIME_LIMIT)*100
  const timerColor=timeLeft>20?'#a8ff78':timeLeft>10?'#ffd700':'#ff4444'

  return (
    <div className="game-wrap">
      <div className="game-hud">
        <div className="hud-score"><span className="hud-label">SCORE</span><span className="hud-value">{score.toLocaleString()}</span></div>
        <div className="hud-timer">
          <div className="timer-bar-bg"><div className="timer-bar-fill" style={{width:`${pct}%`,background:timerColor}}/></div>
          <span className="timer-num" style={{color:timerColor}}>{timeLeft}s</span>
        </div>
        <div className="hud-lives">{'❤️'.repeat(Math.max(0,livesLeft||0))}{'🖤'.repeat(Math.max(0,3-(livesLeft||0)))}</div>
        {combo>1&&<div className="combo-badge">x{combo} COMBO!</div>}
      </div>

      {!sessionActive&&!gameOver&&(
        <div className="no-session-msg">Start a session to play on-chain →</div>
      )}

      <div className="board-wrap">
        {flash&&<div className="flash-pts">{flash}</div>}
        <div className="board" style={{opacity:gameOver?0.4:1,filter:!sessionActive?'grayscale(0.5)':'none'}}>
          {board.map((row,r)=>row.map((gem,c)=>{
            const isSel=selected&&selected[0]===r&&selected[1]===c
            return <div key={`${r}-${c}`} className={`cell ${isSel?'cell-selected':''}`} onClick={()=>handleCell(r,c)}>{gem}</div>
          }))}
        </div>
        {gameOver&&(
          <div className="gameover-overlay">
            <div className="gameover-box">
              <div className="gameover-title">TIME'S UP!</div>
              <div className="gameover-score">{score.toLocaleString()}</div>
              <div className="gameover-label">points</div>
              {!account&&<p className="gameover-hint">Connect wallet to submit score</p>}
              <button className="btn-primary" onClick={restart}>Play Again</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
