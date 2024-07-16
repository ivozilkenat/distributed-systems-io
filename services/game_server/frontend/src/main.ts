import { Socket } from 'socket.io-client';
import * as PIXI from 'pixi.js';
import { configureSocketEvents, initializeSocket } from './network';
import { createApp, Game } from './game'; 
import { initializeKeyMapping } from './keys';
import { loadAssets } from './assets';

async function main(): Promise<void> {
    await loadAssets()
    const app: PIXI.Application = await createApp();
    const keys: Record<string, boolean> = initializeKeyMapping();
    const socket: Socket = initializeSocket();
    const game: Game = new Game(app, socket, keys);

    configureSocketEvents(socket, game);

    console.log("Starting game loop");
    game.loop();
}

console.log("Starting main");
main();
