import { io, Socket } from 'socket.io-client';
import { Game } from './game';

function getServerUrl() {
    let domain = window.location.host.split(":")[0];
            return domain + ':3001';
}

export function initializeSocket(): Socket {
    const serverUrl: string = getServerUrl();
    return io(serverUrl);
}

export function configureSocketEvents(socket: Socket, game: Game): void {
    socket.on('update_players', (data: { newpos: [number, number], newHP: number, enemies: Record<string, [number, number]>, enemyHealth: Record<string, number>, canShoot: boolean }): void => {
        game.updateGameFromServer(data);
    });
    
    socket.on('current_leaderboard', (data: { 
        leaderboard: [string, number][] 
    }): void => {
        game.updateLeaderboard(data.leaderboard);
    });
}