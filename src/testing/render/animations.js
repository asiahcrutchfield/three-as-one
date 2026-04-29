const activeAnimations = new Map();

function cancelAllAnimations() {
    activeAnimations.forEach(id => cancelAnimationFrame(id));
    activeAnimations.clear();
}

function createAnimSprite(container, characterData, characterId, animationName, leftOffset, zIndex) {
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
    charEl.className = `character-sprite-part ${characterId}`;

    charEl.style.position = 'absolute';
    charEl.style.bottom = '0px';
    charEl.style.left = leftOffset;
    charEl.style.zIndex = zIndex;

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
            charEl.style.backgroundPosition = `-${col * animInfo.frameWidth}px -${row * animInfo.frameHeight}px`;
        }

        showFrame(currentFrame);

        function animate(time) {
            if (time - lastTime >= frameDuration) {
                currentFrame = (currentFrame + 1) % totalFrames;
                showFrame(currentFrame);
                lastTime = time;
            }
            const frameId = requestAnimationFrame(animate);
            activeAnimations.set(characterId, frameId);
        }

        const frameId = requestAnimationFrame(animate);
        activeAnimations.set(characterId, frameId);
    };

    img.onerror = () => {
        console.error('Image failed to load:', animInfo.src);
    };

    img.src = animInfo.src;
}

export function renderCharacter(container, characterData, characterId, animationName) {
    const existingChars = container.querySelectorAll('.character-sprite');
    existingChars.forEach(el => el.remove());
    cancelAllAnimations();

    const charContainer = document.createElement('div');
    charContainer.className = 'character-sprite';
    charContainer.style.position = 'absolute';
    charContainer.style.bottom = '0px';
    charContainer.style.left = '25px';

    container.appendChild(charContainer);
    createAnimSprite(charContainer, characterData, characterId, animationName, '0px', 1);
}

export function renderDuo(container, characterData, backId, frontId, animationName) {
    const existingChars = container.querySelectorAll('.character-sprite');
    existingChars.forEach(el => el.remove());
    cancelAllAnimations();

    const duoContainer = document.createElement('div');
    duoContainer.className = 'character-sprite';
    duoContainer.style.position = 'absolute';
    duoContainer.style.bottom = '0px';
    duoContainer.style.left = '25px';

    container.appendChild(duoContainer);

    // Render back character (Tiger)
    createAnimSprite(duoContainer, characterData, backId, animationName, '0px', 1);

    // Render front character (Girl) positioned at ~25% from left
    // Since Tiger scaled width is 1024 * 0.4 = ~409px, 25% is ~100px.
    createAnimSprite(duoContainer, characterData, frontId, animationName, '25px', 2);
}

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
