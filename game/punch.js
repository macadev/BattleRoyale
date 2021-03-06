const getHeightOfPlayerPixels = require('./playerUtils').getHeightOfPlayerPixels;
const getWidthOfPlayerPixels = require('./playerUtils').getWidthOfPlayerPixels;

/**
 * Used to track the state of a "punch" attack in the game
 */
function Punch() {
    var animationSpeed = 60; // 15 fps
    var animationUpdateTime = 1.0 / 60;
    var timeSinceLastFrameSwap = 0;
    var punchSizePixels = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
    
    var animFrame = 0;
    var punchSize = punchSizePixels[0];
    var punchInProgress = false;
    
    this.update = function(deltaTime) {
        timeSinceLastFrameSwap += deltaTime;
        if (timeSinceLastFrameSwap > animationUpdateTime) {
            animFrame++;
            timeSinceLastFrameSwap = 0.0;
            punchSize = punchSizePixels[animFrame];
            if (animFrame === 14) {
                punchInProgress = false;
            }
        }
        return {
            punchSize,
            punchInProgress
        };
    };
    
    this.getCurrentState = function() {
        return {
            punchSize,
            punchInProgress
        };
    };

    this.getCurrentPunchSize = function() {
        return punchSize
    }

    this.resetPunch = function() {
        animFrame = 0
        punchSize = punchSizePixels[0]
        punchInProgress = true
    };
}

function getDataForDrawingPunch(playerState) {
    let punchXCoord;
    let punchSize;
    if (!playerState.punchState.getCurrentPunchSize) {
        punchSize = playerState.punchSize;
    } else {
        punchSize = playerState.punchState.getCurrentPunchSize()
    }
    
    if (playerState.velX >= 0) {
        punchXCoord = playerState.x + getWidthOfPlayerPixels();
    } else {
        punchXCoord = playerState.x - punchSize - 5;
    }

    return {
        x: punchXCoord,
        y: playerState.y + 20,
        width: punchSize + 5,
        height: 20
    }
}

module.exports = {
    Punch,
    getDataForDrawingPunch
}