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
        offsetX: 140,   // left/right
        offsetY: -220   // up/down from tiger back
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
    drawUnit(unit, frame, 80, 260);

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
    const tigerFrame = frame % unit.tiger.frameCount;
    const girlFrame = frame % unit.girl.frameCount;

    // --- TIGER (grounded) ---
    const tigerX = x;
    const tigerY = y;

    ctx.drawImage(
        unit.tiger.image,
        tigerFrame * unit.tiger.frameWidth,
        0,
        unit.tiger.frameWidth,
        unit.tiger.frameHeight,
        tigerX,
        tigerY,
        unit.tiger.frameWidth,
        unit.tiger.frameHeight
    );

    // --- GIRL (aligned by FEET, not top) ---
    const girlX = x + unit.offsetX;

    const girlY =
        tigerY + unit.tiger.frameHeight   // bottom of tiger
        - unit.girl.frameHeight           // move up by girl's height
        + unit.offsetY;                   // fine tuning

    ctx.drawImage(
        unit.girl.image,
        girlFrame * unit.girl.frameWidth,
        0,
        unit.girl.frameWidth,
        unit.girl.frameHeight,
        girlX,
        girlY,
        unit.girl.frameWidth,
        unit.girl.frameHeight
    );

    // --- DEBUG ---
    ctx.strokeStyle = "orange";
    ctx.strokeRect(tigerX, tigerY, unit.tiger.frameWidth, unit.tiger.frameHeight);

    ctx.strokeStyle = "cyan";
    ctx.strokeRect(girlX, girlY, unit.girl.frameWidth, unit.girl.frameHeight);
}

// ========================
init();