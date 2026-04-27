let currentAnimationInterval = null;

export function renderCharacter(container, characterData, characterId, animationName) {
    container.innerHTML = '';

    if (currentAnimationInterval) {
        clearInterval(currentAnimationInterval);
        currentAnimationInterval = null;
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

    console.log('Rendering:', characterId, animationName);
    console.log('Animation info:', animInfo);

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
        console.log('Image loaded:', img.width, img.height);

        const totalFrames = Math.floor(img.width / animInfo.frameWidth);
        let currentFrame = 0;
        const intervalTime = 1000 / animInfo.fps;

        if (totalFrames > 1) {
            currentAnimationInterval = setInterval(() => {
                currentFrame = (currentFrame + 1) % totalFrames;
                charEl.style.backgroundPosition = `-${currentFrame * animInfo.frameWidth}px 0px`;
            }, intervalTime);
        }
    };

    img.onerror = () => {
        console.error('Image failed to load:', animInfo.src);
    };

    img.src = animInfo.src;
}