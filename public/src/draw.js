import { socket } from './clientGame'
import { MAP, TILE, HEIGHT, WIDTH } from '../../game/tileMapConfig'

export function drawPlayer(playerState, ctx) {
    ctx.beginPath();
    ctx.arc(playerState.x, playerState.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "purple";
    ctx.fill();
}

export function drawMyServerPosition(gameState, ctx) {
    if (!gameState || !gameState.playerStates) return
    let myServerPosition = gameState.playerStates[socket.id];
    
    ctx.beginPath();
    ctx.arc(myServerPosition.x, myServerPosition.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
}

export function drawGameState(gameState, ctx) {
    for (let playerSocketId in gameState.playerStates) {
        if (playerSocketId == socket.id) continue;
        let playerData = gameState.playerStates[playerSocketId];
        ctx.beginPath();
        ctx.arc(playerData.x, playerData.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = "blue";
        ctx.fill();
    }
}

export function drawTileGrid(ctx) {
    for (let counter = 0; counter <= MAP.tw; counter++) {
        ctx.beginPath();
        ctx.moveTo(counter * TILE, 0);
        ctx.lineTo(counter * TILE, HEIGHT)
        ctx.stroke();
    }
    for (let counter = 0; counter <= MAP.th; counter++) {
        ctx.beginPath();
        ctx.moveTo(0, counter * TILE);
        ctx.lineTo(WIDTH, counter * TILE)
        ctx.stroke();
    }
}