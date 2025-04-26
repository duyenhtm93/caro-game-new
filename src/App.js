import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserProvider, Contract, parseEther } from 'ethers';
import { networks, getNetworkParams, contractAddresses } from './networks';

const BOARD_SIZE = 5;
const WIN_LENGTH = 4;

const generateBoard = () => {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
};

const App = () => {
  const [board, setBoard] = useState(generateBoard);
  const [playerTurn, setPlayerTurn] = useState(true);
  const [winner, setWinner] = useState(null);
  const [winningCells, setWinningCells] = useState([]);
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [hasTurn, setHasTurn] = useState(false);
  const [playsPurchased, setPlaysPurchased] = useState(0);
  const [playsUsed, setPlaysUsed] = useState(0);
  const [currentNetwork, setCurrentNetwork] = useState('monad');

  useEffect(() => {
    if (window.ethereum) {
      switchNetwork(currentNetwork);
    }
  }, [currentNetwork]);

  const switchNetwork = async (network) => {
    const params = getNetworkParams(network);
    try {
      await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [params] });
    } catch (switchError) {
      console.error(switchError);
    }
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        setAccount(accounts[0]);
        setSigner(signer);
      } catch (err) {
        console.error("Wallet connection error:", err);
      }
    } else {
      alert("🦊 Please install Metamask to use this feature.");
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
    setHasTurn(false);
    setPlaysPurchased(0);
    setPlaysUsed(0);
  };

  const purchaseGame = async () => {
    if (!signer) {
      alert("Please connect your wallet first.");
      return;
    }
    const abi = [
      {
        inputs: [],
        name: "buyTurns",
        outputs: [],
        stateMutability: "payable",
        type: "function",
      },
    ];
    const contract = new Contract(contractAddresses[currentNetwork], abi, signer);
    try {
      const tx = await contract.buyTurns({ value: parseEther("0.05") }); // giá 0.05
      await tx.wait();
      alert("✅ Purchase successful! You received 5 turns.");
      setHasTurn(true);
      setPlaysPurchased((prev) => prev + 5);
    } catch (error) {
      console.error("Purchase failed:", error);
      alert("❌ Transaction failed. See console for details.");
    }
  };

  const checkWin = (newBoard) => {
    const directions = [
      [0, 1], [1, 0], [1, 1], [1, -1],
    ];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (newBoard[r][c]) {
          for (let [dr, dc] of directions) {
            const cells = [];
            for (let i = 0; i < WIN_LENGTH; i++) {
              const nr = r + dr * i;
              const nc = c + dc * i;
              if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && newBoard[nr][nc] === newBoard[r][c]) {
                cells.push([nr, nc]);
              }
            }
            if (cells.length === WIN_LENGTH) return { winner: newBoard[r][c], cells };
          }
        }
      }
    }
    return null;
  };

  const botMove = (newBoard) => {
    let emptyCells = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (!newBoard[r][c]) emptyCells.push([r, c]);
      }
    }
    if (emptyCells.length === 0) return;

    const [r, c] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    newBoard[r][c] = 'O';
    setBoard(newBoard);
    const result = checkWin(newBoard);
    if (result) {
      setWinner(result.winner);
      setWinningCells(result.cells);
      setPlaysUsed(prev => prev + 1);
    } else {
      setPlayerTurn(true);
    }
  };

  const handleClick = (r, c) => {
    if (!hasTurn || winner || !playerTurn) return;
    const newBoard = board.map(row => row.slice());
    if (newBoard[r][c]) return;
    newBoard[r][c] = 'X';
    setBoard(newBoard);
    const result = checkWin(newBoard);
    if (result) {
      setWinner(result.winner);
      setWinningCells(result.cells);
      setPlaysUsed(prev => prev + 1);
    } else {
      setPlayerTurn(false);
      setTimeout(() => botMove(newBoard), 500);
    }
  };

  const resetGame = () => {
    setBoard(generateBoard());
    setWinner(null);
    setWinningCells([]);
    setPlayerTurn(true);
    setHasTurn(playsPurchased - playsUsed - 1 >= 0);
  };

  const playsRemaining = Math.max(playsPurchased - playsUsed, 0);

  return (
    <div className="game">
      <div className="wallet-bar">
        <button onClick={account ? disconnectWallet : connectWallet} className="wallet-button">
          {account ? `🔗 ${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Wallet"}
        </button>
        {account && !hasTurn && (
          <button onClick={purchaseGame} className="wallet-button">
            🎟️ Purchase Turn (0.05 {networks[currentNetwork].nativeCurrency.symbol})
          </button>
        )}
        <select
          value={currentNetwork}
          onChange={(e) => setCurrentNetwork(e.target.value)}
          className="network-selector"
        >
          {Object.keys(networks).map((net) => (
            <option key={net} value={net}>
              {networks[net].chainName}
            </option>
          ))}
        </select>
      </div>

      <h1>Caro Game 5x5 🎯</h1>

      <div className="play-stats">
        <span>🎟️ Purchased: {playsPurchased}</span>
        <span>🎮 Played: {playsUsed}</span>
        <span>⏳ Remaining: {playsRemaining}</span>
      </div>

      {winner && <h2 className="status">🏆 {winner === 'X' ? 'You Win!' : 'Bot Wins!'}</h2>}
      {!winner && playsRemaining === 0 && <h2 className="status">🎟️ Please Purchase to Play</h2>}

      <div className="board">
        {board.map((row, r) => (
          <div key={r} className="row">
            {row.map((cell, c) => {
              const isWinningCell = winningCells.some(([wr, wc]) => wr === r && wc === c);
              return (
                <div key={c} className="cell" onClick={() => handleClick(r, c)}>
                  {cell === 'X' && <span className={`x ${isWinningCell ? 'win' : ''}`}>X</span>}
                  {cell === 'O' && <span className={`o ${isWinningCell ? 'win' : ''}`}>O</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <button className="reset" onClick={resetGame}>🔄 Reset Game</button>
    </div>
  );
};

export default App;
