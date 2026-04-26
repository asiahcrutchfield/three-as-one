const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

// ========================
// LOAD CHARACTER DATA
// ========================
async function loadCharacter(characterId, animationName = "idle") {
    const res = await fetch("/assets/characters/index.json");
    const data = await res.json();

    const animation = data.characters[characterId].animations[animationName];

    const image = new Image();
    image.src = animation.src;

    await new Promise(resolve => {
        image.onload = resolve;
    });

    return {
        image,
        frameWidth: animation.frameWidth,
        frameHeight: animation.frameHeight,
        fps: animation.fps,
        frameCount: Math.floor(image.width / animation.frameWidth)
    };
}

// ========================
// GLOBAL STATE
// ========================
let officer, man, unit;

let frame = 0;
let lastTime = 0;

// ========================
// INIT
// ========================
async function init() {
    officer = await loadCharacter("officer");
    man = await loadCharacter("man");

    const tiger = await loadCharacter("tiger");
    const girl = await loadCharacter("girl");

    unit = {
        tiger,
        girl,
        offsetX: 0,
        offsetY: -260 // adjust this if needed
    };

    requestAnimationFrame(loop);
}

// ========================
// MAIN LOOP
// ========================
function loop(timestamp) {
    const fps = 8;
    const frameDuration = 1000 / fps;

    if (timestamp - lastTime >= frameDuration) {
        frame++;
        lastTime = timestamp;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw characters
    drawSprite(officer, frame, 50, 50);
    drawSprite(man, frame, 200, 50);

    // draw unit (tiger + girl)
    drawUnit(unit, frame, 400, 250);

    requestAnimationFrame(loop);
}

// ========================
// DRAW SINGLE SPRITE
// ========================
function drawSprite(sprite, frame, x, y) {
    const cycle = sprite.frameCount * 2 - 2;
    let f = frame % cycle;
    if (f >= sprite.frameCount) f = cycle - f;

    ctx.drawImage(
        sprite.image,
        f * sprite.frameWidth,
        0,
        sprite.frameWidth,
        sprite.frameHeight,
        x,
        y,
        sprite.frameWidth,
        sprite.frameHeight
    );
}

// ========================
// DRAW UNIT (TIGER + GIRL)
// ========================
function drawUnit(unit, frame, x, y) {
    const tigerCycle = unit.tiger.frameCount * 2 - 2;
    let tigerFrame = frame % tigerCycle;
    if (tigerFrame >= unit.tiger.frameCount) tigerFrame = tigerCycle - tigerFrame;

    const girlCycle = unit.girl.frameCount * 2 - 2;
    let girlFrame = frame % girlCycle;
    if (girlFrame >= unit.girl.frameCount) girlFrame = girlCycle - girlFrame;

    // anchor: tiger feet
    const baseY = y + unit.tiger.frameHeight;

    // 🐯 draw tiger (BACK)
    ctx.drawImage(
        unit.tiger.image,
        tigerFrame * unit.tiger.frameWidth,
        0,
        unit.tiger.frameWidth,
        unit.tiger.frameHeight,
        x,
        y,
        unit.tiger.frameWidth,
        unit.tiger.frameHeight
    );

    // 👧 draw girl (FRONT)
    ctx.drawImage(
        unit.girl.image,
        girlFrame * unit.girl.frameWidth,
        0,
        unit.girl.frameWidth,
        unit.girl.frameHeight,
        x + unit.offsetX,
        baseY - unit.girl.frameHeight + unit.offsetY,
        unit.girl.frameWidth,
        unit.girl.frameHeight
    );

    // ========================
    // DEBUG BOXES (optional)
    // ========================
    ctx.strokeStyle = "red";
    ctx.strokeRect(x, y, unit.tiger.frameWidth, unit.tiger.frameHeight);

    ctx.strokeStyle = "blue";
    ctx.strokeRect(
        x + unit.offsetX,
        baseY - unit.girl.frameHeight + unit.offsetY,
        unit.girl.frameWidth,
        unit.girl.frameHeight
    );

    // Draw unit box (union of both)
    const minX = Math.min(x, x + unit.offsetX);
    const minY = Math.min(y, baseY - unit.girl.frameHeight + unit.offsetY);
    const maxX = Math.max(x + unit.tiger.frameWidth, x + unit.offsetX + unit.girl.frameWidth);
    const maxY = Math.max(y + unit.tiger.frameHeight, baseY - unit.girl.frameHeight + unit.offsetY + unit.girl.frameHeight);
    
    ctx.strokeStyle = "green";
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
}

// ========================
init();