import * as PIXI from 'pixi.js';

import { UPDATE_INTERVAL_MS, MAXHP as MAX_HP } from './constants.ts';

export class Player {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    lastUpdateTime: number;
    hp: number;
    container: PIXI.Container;
    healthBar: PIXI.Container;
    canShoot: boolean = false;
    graphicsContext: PIXI.Graphics;
    app: PIXI.Application;
    gameSize: number[];

    constructor(x: number, y: number, app: PIXI.Application, barContext: PIXI.Graphics, gameSize: number[]) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.lastUpdateTime = Date.now();
        this.hp = MAX_HP;
        this.graphicsContext = barContext;
        this.app = app;
        this.gameSize = gameSize;
        this.container = this.initContainer();
        this.healthBar = this.initHealthBar();
        this.updateHealthBar();
    }

    initHealthBar(): PIXI.Container {
        let hpBar: PIXI.Container = new PIXI.Container();
        hpBar.addChild(new PIXI.Graphics(this.graphicsContext));
        hpBar.addChild(new PIXI.Graphics());
        hpBar.pivot.set(0.5, 0.5);
        this.container.addChild(hpBar);
        hpBar.x = -62;
        hpBar.y = 20;
        return hpBar;
    }

    updateHealthBar(): void {
        this.redrawBar(this.healthBar.getChildAt(1), this.hp / MAX_HP, "red");
    }

    redrawBar(bar: PIXI.Graphics, fill: number, color: string) {
        bar.clear();
        bar.poly([
            12, 10, 
            12 + (100 * fill), 10,
            8 + (100 * fill), 20, 
            8, 20
        ]);
        bar.fill(color);
    }

    initContainer(): PIXI.Container{
        let container: PIXI.Container = new PIXI.Container();
        container.addChild(this.initSprite());
        this.app.stage.addChild(container);
        return container;
    }

    initSprite(): PIXI.Sprite {
        const sprite: PIXI.Sprite = PIXI.Sprite.from('/dist/platypus.png');
        sprite.anchor.set(0.5, 0.5);
        sprite.scale.set(0.1, 0.1); //TODO remove magic numbers
        return sprite;
    }

    updatePosition(newX: number, newY: number): void {
        this.x = this.targetX;
        this.y = this.targetY;
        this.targetX = newX;
        this.targetY = newY;
        this.lastUpdateTime = Date.now();
    }

    interpolatePosition(): void {
        const now: number = Date.now();
        const timeSinceUpdate: number = now - this.lastUpdateTime;
        const t: number = Math.min(1, timeSinceUpdate / UPDATE_INTERVAL_MS);
        this.x = this.x + (this.targetX - this.x) * t;
        this.y = this.y + (this.targetY - this.y) * t;
    }

    drawImage(translation: (x: number, y: number) => [number, number]): void {
        [this.container.x, this.container.y] = translation(this.x, this.y);
    }

    updateDraw(translation: (x: number, y: number) => [number, number]): void {
        this.interpolatePosition();
        this.drawImage(translation);
    }

    canvasCenterTranslation(): [number, number] {
        return [this.gameSize[0] / 2, this.gameSize[1] / 2];
    }

    relativeToPlayerTranslation(player: Player): (x: number, y: number) => [number, number] {
        return (x: number, y: number): [number, number] => [x - player.x + this.gameSize[0] / 2, y - player.y + this.gameSize[1] / 2];
    }

    removeFromCanvas(): void {
        this.app.stage.removeChild(this.container);
    }

    readdToCanvas(): void {
        this.app.stage.addChild(this.container);
    }
}
