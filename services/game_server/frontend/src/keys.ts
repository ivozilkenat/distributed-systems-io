export function initializeKeyMapping(): Record<string, boolean> {
    const keyMap: Record<string, string> = {
        Space: 'space', KeyW: 'up', ArrowUp: 'up',
        KeyA: 'left', ArrowLeft: 'left',
        KeyS: 'down', ArrowDown: 'down',
        KeyD: 'right', ArrowRight: 'right',
        Tab: 'tab'
    };

    const keys: Record<string, boolean> = {
        up: false, down: false, right: false, left: false
    };

    window.addEventListener('keydown', (evt: KeyboardEvent): void => {
        const keyAction: string | undefined = keyMap[evt.code];
        if (keyAction) keys[keyAction] = true;
    });

    window.addEventListener('keyup', (evt: KeyboardEvent): void => {
        const keyAction: string | undefined = keyMap[evt.code];
        if (keyAction) keys[keyAction] = false;
    });

    return keys;
}