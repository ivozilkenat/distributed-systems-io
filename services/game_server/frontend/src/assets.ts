import * as PIXI from 'pixi.js';

export async function loadAssets() {
    await PIXI.Assets.load('/dist/platypus.png');
    await PIXI.Assets.load('/dist/map.png');
    await PIXI.Assets.load('/dist/leaveButton.png');
    await PIXI.Assets.load('/dist/joinButton.png');
}

export const leaveButton = PIXI.Sprite.from('/dist/leaveButton.png');
export const joinButton = PIXI.Sprite.from('/dist/joinButton.png');
