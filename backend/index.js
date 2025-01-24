// importing dependencies
import http from 'node:http'
import express from 'express'
import cors from 'cors'
import { Server } from 'socket.io'
import dotenv from 'dotenv'

// initialization
const app = express()
const server = http.createServer(app)
dotenv.config()
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        methods: ['GET', 'PUT', 'POST', 'DELETE']
    }
})

// constant
const PORT = process.env.PORT || 3000

// middlewares
app.use(express.json())
app.use(express.urlencoded({
    extended: true
}))
app.use(cors())

app.get('/', (req, res) => {
    res.status(200).json({
        status: '200'
    })
})

const calculateWinner = (squares) => {
    const winningPos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6],
    ];

    for (let line of winningPos) {
        const [a, b, c] = line;
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return squares[a];
        }
    }
    return null;
};

const resetGame = () => {
    gameState = Array(9).fill(null);
    currentPlayer = 'X';
};

let players = []
let gameState = Array(9).fill(null)
let currentPlayer = 'X'

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    if (players.length < 2) {
        players.push(socket.id)
        socket.emit('player-assign', players.length === 1 ? 'X' : 'O')
        io.emit('player-update', players)

        if (players.length === 2) {
            io.emit('game-start')
        }
    } else {
        io.emit('room-full')
    }

    socket.on('make-move', ({ index, player }) => {
        if (gameState[index] || player !== currentPlayer) return;

        gameState[index] = player
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X'

        io.emit('game-update', { gameState, currentPlayer })

        const winner = calculateWinner(gameState)
        if (winner) {
            io.emit('game-over', { winner })
            resetGame()
            io.emit('game-update', { gameState, currentPlayer })
        } else if (gameState.every(Boolean)) {
            io.emit('game-over', { winner: 'Draw' })
            resetGame()
            io.emit('game-update', { gameState, currentPlayer })
        }
    })

    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`)
        players = players.filter(id => id !== socket.id)
        io.emit('player-update', players)
        resetGame()
    })
})


server.listen(PORT, () => {
    console.log(`server is running at port ${PORT}`)
})