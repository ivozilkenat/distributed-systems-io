import * as PIXI from 'pixi.js';
import { Game } from './game';

export function setupButtons(app: PIXI.Application, GAME_SIZE: [number, number], game: Game): void {
    const joinButton: PIXI.Sprite = createButton('/dist/joinButton.png',  [GAME_SIZE[0] / 2, GAME_SIZE[1] / 2 + 150], () => {
        game.joinGame();
    });
    const leaveButton: PIXI.Sprite = createButton('/dist/leaveButton.png',  [GAME_SIZE[0] / 2, GAME_SIZE[1] / 2 + 250], () => {
        game.leaveGame();
    });

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