(function(Phaser) {

    var GRAVITY = 1.5;
    var VELOCITY = 3;
    var BLOCKS_INTERVAL = 180;
    var BIRD_SIZE = { "w": 34, "h": 24};
    var BLOCK_GATE_SIZE = { "w": 54, "h": 91};
    var GAME_FIELD_SIZE = { "w": 288, "h": 360};
    var BLOCK_SHIFT = 20;
    var JUMP_SPEED = 10;

    var container = document.getElementById("container");

    var width = container.clientWidth;
    var height = container.clientHeight;

    var dX = width / 288.0;
    var dY = height / 360.0;

    var bg;
    var Bird;
    var BirdMirror;
    var BirdRect;
    var BlockRect;
    var blocks;
    var ticks;
    var difficult = 30;
    var blocksHistory = [];
    var clickHistory = [];
    var playHistory = [];
    var graphics;
    var indexBlock = 0;

    var gameScene = {
        key: "Game",

        preload: function () {
            this.load.image('background', 'assets/bg1.png');
            this.load.spritesheet('bird', 'assets/spr_b1_strip4.png', { frameWidth: 34, frameHeight: 24, endFrame: 3 });
            this.load.image('block', 'assets/spr_block.png');
        },

        create: function () {

            playHistory = clickHistory;
            clickHistory = [];
            difficult = 30;
            ticks = 0;
            indexBlock = 0;

            bg = this.add.tileSprite(width / 2, height / 2, width, height, 'background');
            bg.tileScaleX = dX;
            bg.tileScaleY = dY;

            this.anims.create({
                key: 'fly',
                frames: this.anims.generateFrameNumbers('bird', { start: 0, end: 3, first: 0}),
                frameRate: 20,
                repeat: -1
            });

            Bird = this.add.sprite(width/2, height/2, 'bird');
            Bird.scaleX = dX;
            Bird.scaleY = dY;
            Bird.setOrigin(0.5, 0.5);
            Bird.anims.play('fly');
            Bird.velocity = { x: VELOCITY, y: 0};
            Bird.position = { x: 0, y: 0};

            if (BirdMirror !== undefined) {
                BirdMirror.destroy();
                delete(BirdMirror);
            }

            if (playHistory.length > 0) {
                BirdMirror = this.add.sprite(width/2, height/2, 'bird');
                BirdMirror.scaleX = dX;
                BirdMirror.scaleY = dY;
                BirdMirror.setOrigin(0.5, 0.5);
                BirdMirror.anims.play('fly');
                BirdMirror.velocity = { x: VELOCITY, y: 0};
                BirdMirror.position = { x: 0, y: 0};
                BirdMirror.alpha = 0.5;
            }

            BirdRect = new Phaser.Geom.Rectangle(0, 0, 34*dX, 24*dY);
            BlockRect = new Phaser.Geom.Rectangle(0, 0, 52*dX, 91*dY);

            ScoreText = this.add.text(10, 10, "Дистанция: 0", {
                font: '24pt "Arial"',
                fill: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center'
            });
            ScoreText.setOrigin(0, 0);

            timedEvent = this.time.addEvent({ delay:25, callback: gameScene.onTimer, callbackScope: this, loop: true });

            this.input.on('pointerdown', function () {
                clickHistory.push(ticks);
                Bird.velocity.y = -JUMP_SPEED;
            }, this);


            var Block = new Phaser.Class({
                Extends: Phaser.GameObjects.Image,

                initialize: function(scene)
                {
                    Phaser.GameObjects.Image.call(this, scene, 0, 0, 'block');
                    this.setOrigin(0.5, 0.5);
                    this.scaleX = dX;
                    this.scaleY = dY;
                },

                create: function(position) {
                    var new_block = Math.random() * difficult * 2 - difficult;

                    if (indexBlock === blocksHistory.length)
                        blocksHistory.push(new_block);
                    else
                        new_block = blocksHistory[indexBlock];

                    indexBlock++;

                    this.setActive(true);
                    this.setVisible(true);
                    this.position = { x: position, y: new_block};
                    this.update();
                },

                update: function (time, delta)
                {
                    this.x = width / 2 + (this.position.x - Bird.position.x) * dX;
                    this.y = (this.position.y) * dY + height / 2;
                },

                timer: function() {
                    if (Bird.position.x - this.position.x > BLOCKS_INTERVAL * 2) {
                        this.setActive(false);
                        this.setVisible(false);
                    }
                }
            });

            blocks = this.add.group({
                classType: Block,
                maxSize: 10,
                runChildUpdate: true
            });

            blocks.get().create(BLOCKS_INTERVAL);
            blocks.get().create(BLOCKS_INTERVAL * 2);

            graphics = this.add.graphics({ lineStyle: { color: 0xff0000 } });
        },

        update: function () {
            Bird.angle = 90 * (Math.atan(Bird.velocity.y / 10) * 2 / Math.PI);
            Bird.y = Bird.position.y * dY + height / 2;

            if (BirdMirror !== undefined) {
                BirdMirror.angle = 90 * (Math.atan(BirdMirror.velocity.y / 10) * 2 / Math.PI);
                BirdMirror.y = BirdMirror.position.y * dY + height / 2;
            }

            bg.tilePositionX = Bird.position.x * 0.5;

            graphics.clear();
            graphics.strokeRectShape(BirdRect);
            graphics.strokeRectShape(BlockRect);
        },

        onTimer: function() {

            Bird.velocity.y += GRAVITY;
            Bird.position.y += Bird.velocity.y;
            Bird.position.x += Bird.velocity.x;

            if (BirdMirror !== undefined) {
                if (playHistory.includes(ticks))
                    BirdMirror.velocity.y = -JUMP_SPEED;

                BirdMirror.velocity.y += GRAVITY;
                BirdMirror.position.y += BirdMirror.velocity.y;
            }

            var next_block_index = Math.floor(Bird.position.x / BLOCKS_INTERVAL);

            BirdRect.setPosition(width / 2 - (BIRD_SIZE.w / 2)*dX, (Bird.position.y - BIRD_SIZE.h/2)*dY + height / 2);
            if (blocksHistory.length >= next_block_index) {
                BlockRect.setPosition(((next_block_index + 1) * BLOCKS_INTERVAL - Bird.position.x - BLOCK_GATE_SIZE.w / 2)*dX + width / 2,
                    (blocksHistory[next_block_index] - BLOCK_GATE_SIZE.h / 2)*dY + height / 2);

                cblock = blocksHistory[next_block_index];

                if (Math.abs(Bird.position.x - (next_block_index + 1) * BLOCKS_INTERVAL) - (BIRD_SIZE.w + BLOCK_GATE_SIZE.w - BLOCK_SHIFT) / 2 < 0 &&
                    ( cblock - BLOCK_GATE_SIZE.h / 2 >= Bird.position.y - BIRD_SIZE.h / 2 ||
                      cblock + BLOCK_GATE_SIZE.h / 2 <= Bird.position.y + BIRD_SIZE.h / 2) ) {

                    this.input.stopPropagation();
                    this.scene.restart();
                    this.scene.switch("MainMenu");
                }
            }

            if (Math.abs(Bird.position.y) > (GAME_FIELD_SIZE.h - BIRD_SIZE.h) / 2) {
                this.input.stopPropagation();
                this.scene.restart();
                this.scene.switch("MainMenu");
            }

            ScoreText.setText("Дистанция: " + Bird.position.x);

            blocks.children.iterate(function(block) {
               block.timer();
            });

            if (blocksHistory.length > 0 && indexBlock * BLOCKS_INTERVAL - Bird.position.x < BLOCKS_INTERVAL * 3) {
                if (difficult < 100)
                    difficult += 1;

                blocks.get().create((indexBlock + 1) * BLOCKS_INTERVAL);
            }

            ticks++;
        }
    };

    var menuScene = {
        key: "MainMenu",
        preload: function () {
            this.load.image('background', 'assets/bg1.png');
            this.load.image('background', 'assets/spr_b1_strip4.png');
        },
        create: function () {
            bg = this.add.tileSprite(width / 2, height / 2, width, height, 'background');
            bg.tileScaleX = width / 288.0;
            bg.tileScaleY = height / 360.0;

            LoadingText = this.add.text(width / 2, height / 2, "Кликни для начала", {
                font: '32px "Arial"',
                fill: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center'
            });
            LoadingText.setOrigin(0.5, 0.5);

            this.input.on('pointerdown', function () {

                this.input.stopPropagation();

                this.scene.switch('Game');

            }, this);
        },
        update: function () {
        }
    };

    var config = {
        type: Phaser.CANVAS,
        canvas: container,
        width: width,
        height: height,
        scene: [menuScene, gameScene],
    };

    var game = new Phaser.Game(config);

    game.scene.start('MainMenu');

})(Phaser);