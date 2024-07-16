import * as PIXI from 'pixi.js';
import { Game } from './game';

export function setupButtons(app: PIXI.Application, game: Game): void {
    const gameSize = [app.canvas.width, app.canvas.height]
    const joinButton: PIXI.Sprite = createButton('/dist/joinButton.png',  [gameSize[0] / 2, gameSize[1] / 2 + 150], () => {
        game.joinGame();
    });
    const leaveButton: PIXI.Sprite = createButton('/dist/leaveButton.png',  [gameSize[0] / 2, gameSize[1] / 2 + 250], () => {
        game.leaveGame();
    });

    leaveButton.eventMode = "static";
    leaveButton.anchor.set(0.5,0.5);
    joinButton.eventMode = "static";
    joinButton.anchor.set(0.5,0.5);
    app.stage.addChild(joinButton, leaveButton);
}

function createButton(imagePath: string, position: [number, number], onClickFunction: () => void): PIXI.Sprite {
    const button: PIXI.Sprite = PIXI.Sprite.from(imagePath);
    button.anchor.set(0.5, 0.5);
    button.x = position[0];
    button.y = position[1];
    button.interactive = true;
    button.on('click', onClickFunction);
    return button;
}