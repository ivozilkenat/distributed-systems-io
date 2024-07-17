import * as PIXI from 'pixi.js';

import { UPDATE_INTERVAL_MS } from './constants.ts';

export class Entity {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    lastUpdateTime: number;
    container: PIXI.Container;
    spritePath: string;
    app: PIXI.Application;

    constructor(x: number, y: number, app: PIXI.Application, spritePath: string) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.lastUpdateTime = Date.now();
        this.app = app;
        this.spritePath = spritePath;
        this.container = this.initContainer();
    }

    get gameSize(): number[] {
        return [this.app.canvas.width, this.app.canvas.height];
    }

    initContainer(): PIXI.Container{
        let container: PIXI.Container = new PIXI.Container();
        container.addChild(this.initSprite());
        this.app.stage.addChild(container);
        return container;
    }

    initSprite(): PIXI.Sprite {
        const sprite: PIXI.Sprite = PIXI.Sprite.from(this.spritePath);
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

    removeFromCanvas(): void {
        this.app.stage.removeChild(this.container);
    }

    readdToCanvas(): void {
        this.app.stage.addChild(this.container);
    }

    relativeToPlayerTranslation(player: any): (x: number, y: number) => [number, number] {
        return (x: number, y: number): [number, number] => [x - player.x + this.gameSize[0] / 2, y - player.y + this.gameSize[1] / 2];
    }
}
