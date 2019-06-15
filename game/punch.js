/**
 * Used to track the state of a "punch" attack in the game
 */
export function Punch() {
    var animationSpeed = 60; // 15 fps
    var animationUpdateTime = 1.0 / 60;
    var timeSinceLastFrameSwap = 0;
    var punchSizePixels = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
    var animFrame = 0;
    var punchSize = punchSizePixels[0];
    var punchEnded = false;
    this.update = function (deltaTime) {
        timeSinceLastFrameSwap += deltaTime;
        if (timeSinceLastFrameSwap > animationUpdateTime) {
            animFrame++;
            timeSinceLastFrameSwap = 0.0;
            punchSize = punchSizePixels[animFrame];
            if (animFrame === 14)
                punchEnded = true;
        }
        return {
            punchSize,
            punchEnded
        };
    };
    this.getCurrentState = function () {
        return {
            punchSize,
            punchEnded
        };
    };
}
