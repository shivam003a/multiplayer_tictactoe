import { useEffect, useState } from 'react'
import io from 'socket.io-client'
import './App.css'

const socket = io(import.meta.env.VITE_BACKEND_URL)

function App() {
  const [gameState, setGameState] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [player, setPlayer] = useState(null);
  const [status, setStatus] = useState('Waiting for another player...');
  const [isGameActive, setIsGameActive] = useState(false);



  useEffect(() => {
    socket.on('player-assign', (assignedPlayer) => {
      setPlayer(assignedPlayer)
      setStatus(`You are Player: ${assignedPlayer}`);
    })

    socket.on('game-update', ({ gameState, currentPlayer }) => {
      setGameState(gameState);
      setCurrentPlayer(currentPlayer);
      setStatus(`Next Player: ${currentPlayer}`);
    });

    socket.on('game-start', () => {
      setIsGameActive(true);
      setStatus('Game has started! Make your move.');
    });

    socket.on('game-over', ({ winner }) => {
      if (winner === 'Draw') {
        setStatus('Game over: It\'s a draw!');
      } else {
        setStatus(`Game over: Player ${winner} wins!`);
      }
      setIsGameActive(false);
    });

    socket.on('room-full', () => {
      setStatus('Room is full. Please wait for the next game.');
    });

    // return () => {
    //   socket.disconnect();
    // };
  }, [])

  const handleClick = (index) => {
    if (!isGameActive || gameState[index] || player !== currentPlayer) {
      return
    }

    socket.emit('make-move', { index, player });
  };


  return (
    <>
      <div className='wrapper'>
        {status}
        <div className='container'>
          {
            gameState.map((s, index) => {
              return <span
                key={index}
                onClick={() => handleClick(index)}
              >{s}</span>
            })
          }
        </div>
      </div>
    </>
  )
}

export default App
