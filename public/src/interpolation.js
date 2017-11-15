import { socket } from './clientGame'
import serverConfig from '../../game/serverConfig'

export function interpolateEntities(gameState) {
    let interp_timestamp = (new Date().getTime()) - serverConfig.TIMESTEP;
    
    for (let playerSocketId in gameState.playerStates) {
        // don't interpolate local player
        if (playerSocketId === socket.id) continue;
        
        let playerEntity = gameState.playerStates[playerSocketId];
        let posBuffer = playerEntity.posBuffer;
        while (posBuffer.length >= 2 && posBuffer[1].timestamp <= interp_timestamp) {
            posBuffer.shift();
        }

        if (
            posBuffer.length >= 2 && 
            posBuffer[0].timestamp <= interp_timestamp &&
            interp_timestamp <= posBuffer[1].timestamp
        ) {
            let x0 = posBuffer[0].x;
            let x1 = posBuffer[1].x;
            let y0 = posBuffer[0].y;
            let y1 = posBuffer[1].y;
            let t0 = posBuffer[0].timestamp;
            let t1 = posBuffer[1].timestamp;
      
            playerEntity.x = x0 + (x1 - x0) * (interp_timestamp - t0) / (t1 - t0);
            playerEntity.y = y0 + (y1 - y0) * (interp_timestamp - t0) / (t1 - t0);
        }
    }
}