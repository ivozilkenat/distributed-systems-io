import { io, Socket } from 'socket.io-client';
import { Game } from './game';

function getServerUrl() {
    let domain = window.location.host.split(":")[0];
    let protocol = window.location.protocol;
    let port = '';

    if (domain === 'localhost') {
        port = '3001';
    } else {
        port = (protocol === 'https:') ? '443' : '80';
    }

    return `${protocol}//${domain}:${port}`;
}


export function initializeSocket(): Socket {
    const serverUrl: string = getServerUrl();
    return io(serverUrl);
}

export function configureSocketEvents(socket: Socket, game: Game): void {
    socket.on('update_players', (data: { gameState: any, canShoot: boolean , playerId: string}): void => {
        game.updateGameFromServer(data);
    });
}