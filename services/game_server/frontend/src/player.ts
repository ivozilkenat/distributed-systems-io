import * as PIXI from 'pixi.js';
import { Entity } from './entity.ts';

import { MAXHP as MAX_HP } from './constants.ts';

export class Player extends Entity {
    hp: number;
    healthBar: PIXI.Container;
    canShoot: boolean = false;

    constructor(x: number, y: number, app: PIXI.Application) {
        super(x, y, app, '/dist/platypus.png');
        this.hp = MAX_HP;
        this.healthBar = this.initHealthBar();
        this.updateHealthBar();
    }

    get gameSize(): number[] {
        return [this.app.canvas.width, this.app.canvas.height];
    }

    createHpBarGraphics(): PIXI.Graphics {
        let graphics = new PIXI.Graphics();
        return graphics.poly([
            12, 10,
            12 + (100), 10,
            8 + (100), 20,
            8, 20
        ]).fill('white')
    }

    initHealthBar(): PIXI.Container {
        let hpBar: PIXI.Container = new PIXI.Container();
        hpBar.addChild(new PIXI.Graphics(this.createHpBarGraphics()));
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

    relativeToPlayerTranslation(player: Player): (x: number, y: number) => [number, number] {
        return (x: number, y: number): [number, number] => [x - player.x + this.gameSize[0] / 2, y - player.y + this.gameSize[1] / 2];
    }


}
