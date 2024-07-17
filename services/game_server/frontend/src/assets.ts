import * as PIXI from 'pixi.js';

export async function loadAssets() {
    await PIXI.Assets.load('/dist/platypus.png');
    await PIXI.Assets.load('/dist/map.png');
    await PIXI.Assets.load('/dist/leaveButton.png');
    await PIXI.Assets.load('/dist/joinButton.png');
    await PIXI.Assets.load('/dist/bullet.png');
    await PIXI.Assets.load('/dist/pistol.png');
    await PIXI.Assets.load('/dist/health.png');
    await PIXI.Assets.load('/dist/speed.png');
}

export const leaveButton = PIXI.Sprite.from('/dist/leaveButton.png');
export const joinButton = PIXI.Sprite.from('/dist/joinButton.png');
