import Phaser from 'phaser';

export class AnimationViewerScene extends Phaser.Scene {
    constructor() {
        super('AnimationViewerScene');
    }

    preload() {
        // Preload everything just like BattleScene, plus the new idle animation
        this.load.image('stage_girl', '../assests/stages/paradise.png');
        this.load.image('stage_officer', '../assests/stages/ximending.png');
        this.load.image('stage_man', '../assests/stages/mardi_gras.png');

        this.load.image('char_Girl', '../assests/characters/girl/girl.png');
        this.load.image('char_Officer', '../assests/characters/officer/officer.png');
        this.load.image('char_Man', '../assests/characters/man/man.png');

        // We will generate this spritesheet shortly with a script
        // Assuming it will be exactly 4 frames. Will calculate frameWidth based on image size later, but for now we'll dynamically create the spritesheet.
        // Actually, we can load it as an image first, determine its width, or better yet, just hardcode if we know. Let's load it as a standard spritesheet.
        // For a generic idle testing, we will just use Officer now.
        // We will update the frameWidth/Height dynamically or via Python script config.
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.bgStage = this.add.image(width / 2, height / 2, 'stage_officer');
        this.bgStage.setDisplaySize(width, height);
        this.bgStage.setDepth(-1);
        this.bgStage.setAlpha(0.2); // Dimmed background for better contrast

        this.centerEntity = this.add.sprite(width / 2, height / 2, 'char_Officer');
        
        // Listen from the DOM UI
        this.events.on('play-animation', this.handlePlayAnimation, this);
        
        this.add.text(10, 10, 'Use the Sidebar to Preview', { fill: '#fff' });
    }

    handlePlayAnimation(data) {
        if (data.type === 'stage') {
            const mapName = data.name === 'paradise' ? 'girl' : (data.name === 'ximending' ? 'officer' : 'man');
            this.bgStage.setTexture(`stage_${mapName}`);
        } else if (data.type === 'character') {
            const key = `char_${data.name}`;
            const animKey = `${data.name}_${data.animation}`;
            
            // Try to load the animation if it exists
            if (data.animation === 'idle') {
                if (!this.textures.exists(`sheet_${data.name}_idle`)) {
                    // Start loading the spritesheet
                    const imgPath = `../assests/characters/${data.name.toLowerCase()}/${data.name.toLowerCase()}_idle.png`;
                    
                    // We must guess or know the frameWidth. We will just load as image, find width/4, and then create spritesheet
                    this.load.image(`temp_${data.name}_idle`, imgPath);
                    this.load.once('complete', () => {
                        const tex = this.textures.get(`temp_${data.name}_idle`);
                        const w = tex.getSourceImage().width;
                        const h = tex.getSourceImage().height;
                        const frameWidth = w / 4; // Assuming 4 frames
                        
                        this.textures.addSpriteSheet(`sheet_${data.name}_idle`, tex.getSourceImage(), { frameWidth: frameWidth, frameHeight: h });
                        
                        this.anims.create({
                            key: animKey,
                            frames: this.anims.generateFrameNumbers(`sheet_${data.name}_idle`, { start: 0, end: 3 }),
                            frameRate: 6,
                            repeat: -1
                        });
                        
                        this.centerEntity.setTexture(`sheet_${data.name}_idle`);
                        this.centerEntity.play(animKey);
                    });
                    this.load.start();
                } else {
                    this.centerEntity.setTexture(`sheet_${data.name}_idle`);
                    this.centerEntity.play(animKey);
                }
            } else {
                this.centerEntity.stop();
                this.centerEntity.setTexture(key);
            }
        }
    }
}
