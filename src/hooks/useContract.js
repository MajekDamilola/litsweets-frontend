import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'

const LITVM_CHAIN_ID = 4441
const CONTRACT_ADDRESS = '0x96c48360431Ed2676D33D944D06a38d0B5d544C8'

const LITVM_CHAIN = {
  chainId: '0x115D',
  chainName: 'LitVM',
  nativeCurrency: { name: 'zkLTC', symbol: 'zkLTC', decimals: 18 },
  rpcUrls: ['https://rpc.litvm.io'],
  blockExplorerUrls: ['https://explorer.litvm.io'],
}

const ABI = [
  'function startSession(uint8 difficulty) external payable',
  'function submitScore(uint256 score) external',
  'function feeFor(uint8 difficulty) public pure returns (uint256)',
  'function getSession(address player) external view returns (tuple(bool active, uint8 difficulty, uint8 livesRemaining, uint256 sessionFee, uint256 startTime))',
  'function getPersonalBest(address player, uint8 difficulty) external view returns (uint256)',
  'function getLeaderboard(uint8 difficulty) external view returns (tuple(address player, uint256 score, uint256 timestamp)[])',
]

export const DIFFICULTIES = [
  { id: 0, label: 'Easy',      emoji: '🟢', fee: '0.1' },
  { id: 1, label: 'Medium',    emoji: '🟡', fee: '0.3' },
  { id: 2, label: 'Hard',      emoji: '🟠', fee: '0.5' },
  { id: 3, label: 'Very Hard', emoji: '🔴', fee: '0.7' },
]

function getProvider() {
  // Rabby injects as window.rabby or window.ethereum
  if (window.rabby) return window.rabby
  if (window.ethereum) return window.ethereum
  return null
}

export function useContract() {
  const [signer, setSigner] = useState(null)
  const [contract, setContract] = useState(null)
  const [account, setAccount] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isCorrectChain = chainId === LITVM_CHAIN_ID

  const connectWallet = useCallback(async () => {
    const provider = getProvider()
    if (!provider) { setError('No wallet found. Please install Rabby or MetaMask.'); return }
    setLoading(true); setError(null)
    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' })
      const web3Provider = new ethers.BrowserProvider(provider)
      const web3Signer = await web3Provider.getSigner()
      const network = await web3Provider.getNetwork()
      setSigner(web3Signer)
      setAccount(accounts[0])
      setChainId(Number(network.chainId))
      setContract(new ethers.Contract(CONTRACT_ADDRESS, ABI, web3Signer))
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  const switchToLitVM = useCallback(async () => {
    const provider = getProvider()
    if (!provider) return
    setError(null)
    try {
      await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: LITVM_CHAIN.chainId }] })
    } catch (e) {
      if (e.code === 4902 || e.code === -32603) {
        try {
          await provider.request({ method: 'wallet_addEthereumChain', params: [LITVM_CHAIN] })
        } catch (e2) { setError(e2.message) }
      } else { setError(e.message) }
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
    const provider = getProvider()
    if (!provider) return
    const onAccounts = (accounts) => {
      setAccount(accounts[0] || null)
      if (!accounts[0]) { setSigner(null); setContract(null) }
    }
    const onChain = (id) => setChainId(Number(id))
    provider.on('accountsChanged', onAccounts)
    provider.on('chainChanged', onChain)
    return () => { provider.removeListener('accountsChanged', onAccounts); provider.removeListener('chainChanged', onChain) }
  }, [])

  return {
    account, chainId, isCorrectChain, loading, error,
    connectWallet, switchToLitVM,
    startSession, submitScore, getSession, getPersonalBest, getLeaderboard,
    contract,
  }
}
