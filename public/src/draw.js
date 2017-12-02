import { socket } from './clientGame'
import { MAP, TILE, HEIGHT, WIDTH } from '../../game/tileMapConfig'
import { tcell, p2t } from '../../game/tileUtils'
import { getSurroundingTiles, getTilesUnderPlayer } from '../../game/playerStateHandler'
import { getHeightOfPlayerPixels, getWidthOfPlayerPixels } from '../../game/playerUtils'

export function drawPlayer(playerState, ctx) {
    let surrTiles = getSurroundingTiles(playerState, true);
    for (let tile of surrTiles) {
        ctx.fillStyle = "yellow";
        ctx.fillRect(p2t(tile.x) * TILE, p2t(tile.y) * TILE, TILE, TILE);
    }

    ctx.fillStyle = "purple";
    _fillPlayerRectangle(playerState.x, playerState.y, ctx);

    let tilesUnderPlayer = getTilesUnderPlayer(playerState, true);
    for (let tile of tilesUnderPlayer) {
        ctx.fillStyle = "green";
        ctx.fillRect(p2t(tile.x) * TILE, p2t(tile.y) * TILE, TILE, TILE);
    }
}

export function drawMyServerPosition(gameState, ctx) {
    if (!gameState || !gameState.playerStates) return
    let myServerPosition = gameState.playerStates[socket.id];
    ctx.fillStyle = "red";
    _fillPlayerRectangle(myServerPosition.x, myServerPosition.y, ctx);
}

export function drawGameState(gameState, ctx) {
    for (let playerSocketId in gameState.playerStates) {
        if (playerSocketId == socket.id) continue;
        let playerData = gameState.playerStates[playerSocketId];
        ctx.fillStyle = "blue";
        _fillPlayerRectangle(playerData.x, playerData.y, ctx);
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

export function drawTiles(ctx) {
    for (let tileRow = 0; tileRow < MAP.th; tileRow++) {
        for (let tileColumn = 0; tileColumn < MAP.tw; tileColumn++) {
            if (tcell(tileColumn, tileRow) === 10) {
                ctx.fillStyle = "#D95B43";
                ctx.fillRect(tileColumn * TILE, tileRow * TILE, TILE, TILE);
            }
        }
    }
}

function _fillPlayerRectangle(x, y, ctx) {
    ctx.fillRect(x, y, getWidthOfPlayerPixels(), getHeightOfPlayerPixels());
}