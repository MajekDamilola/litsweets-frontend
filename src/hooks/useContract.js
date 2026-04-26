import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'

const LITVM_CHAIN_ID = 4441
const CONTRACT_ADDRESS = '0x96c48360431Ed2676D33D944D06a38d0B5d544C8'

const LITVM_CHAIN = {
  chainId: '0x115D',
  chainName: 'LitVM LiteForge',
  nativeCurrency: { name: 'zkLTC', symbol: 'zkLTC', decimals: 18 },
  rpcUrls: ['https://rpc.liteforge.litvm.io'],
  blockExplorerUrls: ['https://explorer.liteforge.litvm.io'],
}

const ABI = [
  'function startSession(uint8 difficulty) external payable',
  'function submitScore(uint256 score) external',
  'function feeFor(uint8 difficulty) public pure returns (uint256)',
  'function getSession(address player) external view returns (tuple(bool active, uint8 difficulty, uint8 livesRemaining, uint256 sessionFee, uint256 startTime))',
  'function getPersonalBest(address player, uint8 difficulty) external view returns (uint256)',
  'function getLeaderboard(uint8 difficulty) external view returns (tuple(address player, uint256 score, uint256 timestamp)[])',
  'event SessionStarted(address indexed player, uint8 difficulty, uint256 fee)',
  'event LiveUsed(address indexed player, uint8 livesRemaining)',
  'event ScoreSubmitted(address indexed player, uint8 difficulty, uint256 score, bool isPersonalBest)',
  'event LeaderboardUpdated(address indexed player, uint8 difficulty, uint256 score, uint8 position)',
]

export const DIFFICULTIES = [
  { id: 0, label: 'Easy',      emoji: '🟢', fee: '0.1' },
  { id: 1, label: 'Medium',    emoji: '🟡', fee: '0.3' },
  { id: 2, label: 'Hard',      emoji: '🟠', fee: '0.5' },
  { id: 3, label: 'Very Hard', emoji: '🔴', fee: '0.7' },
]

export function useContract() {
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [contract, setContract] = useState(null)
  const [account, setAccount] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isCorrectChain = chainId === LITVM_CHAIN_ID

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) { setError('MetaMask not found. Please install it.'); return }
    setLoading(true); setError(null)
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const web3Provider = new ethers.BrowserProvider(window.ethereum)
      const web3Signer = await web3Provider.getSigner()
      const network = await web3Provider.getNetwork()
      setProvider(web3Provider); setSigner(web3Signer)
      setAccount(accounts[0]); setChainId(Number(network.chainId))
      setContract(new ethers.Contract(CONTRACT_ADDRESS, ABI, web3Signer))
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  const switchToLitVM = useCallback(async () => {
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: LITVM_CHAIN.chainId }] })
    } catch (e) {
      if (e.code === 4902) await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [LITVM_CHAIN] })
    }
  }, [])

  const startSession = useCallback(async (difficulty) => {
    if (!contract) return
    setLoading(true); setError(null)
    try {
      const fee = await contract.feeFor(difficulty)
      const tx = await contract.startSession(difficulty, { value: fee })
      await tx.wait(); return tx
    } catch (e) { setError(e.reason || e.message) }
    finally { setLoading(false) }
  }, [contract])

  const submitScore = useCallback(async (score) => {
    if (!contract) return
    setLoading(true); setError(null)
    try {
      const tx = await contract.submitScore(score)
      await tx.wait(); return tx
    } catch (e) { setError(e.reason || e.message) }
    finally { setLoading(false) }
  }, [contract])

  const getSession = useCallback(async () => {
    if (!contract || !account) return null
    try { return await contract.getSession(account) }
    catch { return null }
  }, [contract, account])

  const getPersonalBest = useCallback(async (difficulty) => {
    if (!contract || !account) return 0
    try { return Number(await contract.getPersonalBest(account, difficulty)) }
    catch { return 0 }
  }, [contract, account])

  const getLeaderboard = useCallback(async (difficulty) => {
    if (!contract) return []
    try {
      const entries = await contract.getLeaderboard(difficulty)
      return entries.map(e => ({ address: e.player, score: Number(e.score), timestamp: Number(e.timestamp) }))
        .sort((a, b) => b.score - a.score)
    } catch { return [] }
  }, [contract])

  useEffect(() => {
    if (!window.ethereum) return
    window.ethereum.on('accountsChanged', (accounts) => {
      setAccount(accounts[0] || null)
      if (!accounts[0]) { setSigner(null); setContract(null) }
    })
    window.ethereum.on('chainChanged', (id) => setChainId(Number(id)))
    return () => window.ethereum.removeAllListeners()
  }, [])

  return {
    account, chainId, isCorrectChain, loading, error,
    connectWallet, switchToLitVM,
    startSession, submitScore, getSession, getPersonalBest, getLeaderboard,
    contract,
  }
}
