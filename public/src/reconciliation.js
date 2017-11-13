import playerStateHandler from '../../game/playerStateHandler'
import { socket } from './clientGame'

export function serverReconciliation(clientInputs, gameState, localPlayerState) {
    var inputToProcessIndex = 0;
    // Number of inputs in queue hovers around 4. This is not as expensive
    // as it seems.
    for (let input of clientInputs) {
        if (input.sequenceNumber <= gameState.playerStates[socket.id].lastSeqNumber) {
            inputToProcessIndex++;
            continue;
        } else {
            // Found new input that hasn't been acknowledged
            break;
        }
    }
    // Remove inputs that have been acknowledged by the server
    clientInputs.splice(0, inputToProcessIndex);

    // Apply un-acked inputs on position indicated by server
    var serverPlayerState = Object.assign({}, gameState.playerStates[socket.id])
    for (let input of clientInputs) {
        playerStateHandler.processInputs(input, serverPlayerState)
    }

    if (
        serverPlayerState.x !== localPlayerState.x || 
        serverPlayerState.y !== localPlayerState.y
    ) {
        // Client and server do not coincide on the client position.
        // Enforce position dictated by the server.
        localPlayerState.x = serverPlayerState.x;
        localPlayerState.y = serverPlayerState.y;
    }
}