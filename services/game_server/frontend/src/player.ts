import * as PIXI from 'pixi.js';
import { Entity } from './entity.ts';

import { MAXHP as MAX_HP } from './constants.ts';

export class Player extends Entity {
    hp: number;
    name: string = "Unknown Player";
    healthBar: PIXI.Container;
    canShoot: boolean = false;
    graphicsContext: PIXI.Graphics;

    constructor(x: number, y: number, app: PIXI.Application, barContext: PIXI.Graphics) {
        super(x, y, app, '/dist/platypus.png');
        this.hp = MAX_HP;
        this.graphicsContext = barContext;
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

    
}
