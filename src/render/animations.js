const activeAnimations = new Map();

export function playSpriteAnimation(sprite, animation, options = {}) {
    const {
        loop = true,
        onComplete = null
    } = options;

    stopSpriteAnimation(sprite);

    let frame = 0;
    let lastTime = 0;
    const frameDuration = 1000 / animation.fps;

    function update(timestamp) {
        if (!lastTime) lastTime = timestamp;

        const elapsed = timestamp - lastTime;

        if (elapsed >= frameDuration) {
            setSpriteFrame(sprite, animation, frame);

            frame++;
            lastTime = timestamp;

            if (frame >= animation.frames) {
                if (loop) {
                    frame = 0;
                } else {
                    frame = animation.frames - 1;
                    setSpriteFrame(sprite, animation, frame);

                    activeAnimations.delete(sprite);

                    if (onComplete) onComplete();
                    return;
                }
            }
        }

        const animationId = requestAnimationFrame(update);
        activeAnimations.set(sprite, animationId);
    }

    const animationId = requestAnimationFrame(update);
    activeAnimations.set(sprite, animationId);
}

export function stopSpriteAnimation(sprite) {
    const animationId = activeAnimations.get(sprite);

    if (animationId) {
        cancelAnimationFrame(animationId);
        activeAnimations.delete(sprite);
    }
}

export function setSpriteFrame(sprite, animation, frameIndex) {
    const columns = animation.columns;
    const frameWidth = animation.frameWidth;
    const frameHeight = animation.frameHeight;
    const scale = getResponsiveAnimationScale(animation);

    const col = frameIndex % columns;
    const row = Math.floor(frameIndex / columns);

    sprite.style.width = `${frameWidth * scale}px`;
    sprite.style.height = `${frameHeight * scale}px`;

    sprite.style.backgroundSize = `${columns * frameWidth * scale}px auto`;

    sprite.style.backgroundPosition = `-${col * frameWidth * scale}px -${row * frameHeight * scale}px`;
}
export function getResponsiveAnimationScale(animation) {
    if (typeof animation.scale === "number") {
        return animation.scale;
    }

    const battleUI = document.querySelector("#battle-ui");
    const viewportHeight = battleUI.clientHeight;

    const minHeight = 599;
    const maxHeight = 900;

    const minScale = animation.scale.min;
    const maxScale = animation.scale.max;

    const t = Math.min(
        1,
        Math.max(0, (viewportHeight - minHeight) / (maxHeight - minHeight))
    );

    return minScale + (maxScale - minScale) * t;
}
