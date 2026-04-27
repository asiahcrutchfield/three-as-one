let currentAnimationFrameId = null;

// Character animations
export function renderCharacter(container, characterData, characterId, animationName) {
    const existingChar = container.querySelector('.character-sprite');
    if (existingChar) {
        existingChar.remove();
    }

    if (currentAnimationFrameId) {
        cancelAnimationFrame(currentAnimationFrameId);
        currentAnimationFrameId = null;
    }

    const charInfo = characterData.characters[characterId];

    if (!charInfo) {
        console.error(`Character "${characterId}" not found`);
        return;
    }

    const animInfo = charInfo.animations[animationName];

    if (!animInfo) {
        console.error(`Animation "${animationName}" not found for "${characterId}"`);
        return;
    }

    const charEl = document.createElement('div');
    charEl.className = 'character-sprite';

    charEl.style.position = 'absolute';
    charEl.style.bottom = '0px';
    charEl.style.left = '25px';

    charEl.style.width = `${animInfo.frameWidth}px`;
    charEl.style.height = `${animInfo.frameHeight}px`;
    charEl.style.backgroundImage = `url("${animInfo.src}")`;
    charEl.style.backgroundRepeat = 'no-repeat';
    charEl.style.backgroundPosition = '0px 0px';
    charEl.style.backgroundSize = 'auto';
    charEl.style.transformOrigin = 'bottom left';

    const scale = animInfo.scale || 1;
    charEl.style.transform = `scale(${scale})`;

    container.appendChild(charEl);

    const img = new Image();

    img.onload = () => {
        const columns = animInfo.columns;
        const totalFrames = animInfo.frames;
        const frameDuration = 1000 / animInfo.fps;

        let currentFrame = 0;
        let lastTime = 0;

        function showFrame(frameIndex) {
            const col = frameIndex % columns;
            const row = Math.floor(frameIndex / columns);

            charEl.style.backgroundPosition =
                `-${col * animInfo.frameWidth}px -${row * animInfo.frameHeight}px`;
        }

        showFrame(currentFrame);

        function animate(time) {
            if (time - lastTime >= frameDuration) {
                currentFrame = (currentFrame + 1) % totalFrames;
                showFrame(currentFrame);
                lastTime = time;
            }

            currentAnimationFrameId = requestAnimationFrame(animate);
        }

        currentAnimationFrameId = requestAnimationFrame(animate);
    };

    img.onerror = () => {
        console.error('Image failed to load:', animInfo.src);
    };

    img.src = animInfo.src;
}

// Enemy animations
export function renderEnemy(container, enemyData, enemyId, animationName) {
    const existingEnemy = container.querySelector('.enemy-sprite');
    if (existingEnemy) {
        existingEnemy.remove();
    }

    const enemyEl = document.createElement('div');
    enemyEl.className = 'enemy-sprite';

    enemyEl.style.position = 'absolute';
    enemyEl.style.bottom = '0px';
    enemyEl.style.right = '25px';
    enemyEl.style.width = '80px';
    enemyEl.style.height = '180px';
    enemyEl.style.backgroundColor = '#d32f2f'; // Tall red rectangle for testing

    container.appendChild(enemyEl);
}