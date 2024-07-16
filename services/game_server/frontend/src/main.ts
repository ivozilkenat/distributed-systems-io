import { Socket } from 'socket.io-client';
import * as PIXI from 'pixi.js';
import { configureSocketEvents, initializeSocket } from './network';
import { createApp, Game } from './game';
import { setupButtons } from './buttons';
import { initializeKeyMapping } from './keys';
import { loadAssets } from './assets';

async function main(): Promise<void> {
    const GAME_SIZE: [number, number] = [800, 800];
    await loadAssets()
    const app: PIXI.Application = await createApp(GAME_SIZE);
    const keys: Record<string, boolean> = initializeKeyMapping();
    const socket: Socket = initializeSocket();
    const game: Game = new Game(app, socket, keys, GAME_SIZE);

    configureSocketEvents(socket, game);
    setupButtons(app, GAME_SIZE, game);

    console.log("Starting game loop");
    game.loop();
}

console.log("Starting main");
main();
