const sharp = require("sharp");
const fs = require("fs");

const input = "officer-2.png";
const output = "officer_idle_spritesheet.png";

const width = 620;
const height = 1330;

// adjust this if needed
const splitY = 690; // everything above this moves

async function createFrame(shiftY = 0) {
    const base = sharp(input);

    const upper = await base.extract({
        left: 0,
        top: 0,
        width: width,
        height: splitY
    }).toBuffer();

    const lower = await base.extract({
        left: 0,
        top: splitY,
        width: width,
        height: height - splitY
    }).toBuffer();

    return sharp({
        create: {
            width: width,
            height: height,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    })
        .composite([
            { input: upper, top: shiftY, left: 0 },
            { input: lower, top: splitY, left: 0 }
        ])
        .png()
        .toBuffer();
}

(async () => {
    const frame1 = await sharp(input).toBuffer();
    const frame2 = await createFrame(-1);
    const frame3 = await sharp(input).toBuffer();
    const frame4 = await createFrame(1);

    const spacing = 20;
    const sheetWidth = width * 4 + spacing * 3;

    const sheet = sharp({
        create: {
            width: sheetWidth,
            height: height,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    });

    await sheet
        .composite([
            { input: frame1, top: 0, left: 0 },
            { input: frame2, top: 0, left: width + spacing },
            { input: frame3, top: 0, left: (width + spacing) * 2 },
            { input: frame4, top: 0, left: (width + spacing) * 3 }
        ])
        .toFile(output);

    console.log("Spritesheet created:", output);
})();