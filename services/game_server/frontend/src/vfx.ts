import * as PIXI from 'pixi.js';

export class popupMessageQueue {
    app: PIXI.Application;
    importantMessages: popupMessage[];
    interestingMessages: popupMessage[];
    boringMessages: popupMessage[];
    wait : number;

    constructor(app: PIXI.Application) {
        this.app = app;
        this.importantMessages = [];
        this.interestingMessages = [];
        this.boringMessages = [];
        this.wait = 0;
        this.app.ticker.add(() => {
            this.showNextMessageWithDelay();
        });
    }

    showNextMessageWithDelay(){
        if (this.wait > 0) {
            this.wait -= 1;
            return
        }
        this.showNextMessage();
    }

    addMessage(content: string, colour: string, droptime: number, priority: number) {
        let message = new popupMessage(content, colour, droptime, this.app, this);

        if (priority === 0) {
            this.importantMessages.push(message);
        } else if (priority === 1) {
            this.interestingMessages.push(message);
        } else {
            this.boringMessages.push(message);
        }
    }

    showNextMessage() {
        let currentMessage : popupMessage | undefined;
        if(this.importantMessages.length > 0) {
            currentMessage = this.importantMessages.shift();
        }
        else if(this.interestingMessages.length > 0) {
            currentMessage = this.interestingMessages.shift();
        }
        else if(this.boringMessages.length > 0) {
            currentMessage = this.boringMessages.shift();
        }

        if(currentMessage) {
            currentMessage.dropIn();
            this.wait = 30;
        }
    }

}

class popupMessage extends PIXI.Text {
    droptime: number;
    app: PIXI.Application;
    lifeTime: number = 0;
    spawnPos: [number, number];
    bounceFactor: number = 400;
    handler: popupMessageQueue;


    constructor(content: string, colour: string, droptime: number, app: PIXI.Application, handler: popupMessageQueue) {
        super(content, {fill: colour, fontSize: 64});
        this.anchor.set(0.5, 0.5);
        this.droptime = 3 * droptime / droptime;
        this.app = app;
        this.spawnPos = [this.app.renderer.width / 2, 100];
        this.handler = handler;
    }

    // todo create a function that will draw the message on the screen (large) and move it down a bit, then remove it after a certain amount of time

    dropIn() {
        this.x = this.spawnPos[0];
        this.move();
        this.alpha = 1;
        this.app.stage.addChild(this);
        // move down slowly
        this.app.ticker.add(() => {
            this.move();
        });
    }

    move() {
        this.lifeTime += 1 / 30;
        let t = this.lifeTime / this.droptime;

        let f1 = (t: number) => 0.7834*t**4 + 0.8224*t**3 + 0.6357*t**2 + -0.1860*t**1
        let f2 = (t: number) => 3.2973*t**4 + -1.0792*t**3 + -3.1441*t**2 + -1.9411*t**1 + 3.7671

        if(this.lifeTime > this.droptime) {
                this.app.stage.removeChild(this);
                this.app.ticker.remove(this.move);
        }

        this.y = this.spawnPos[1] + this.bounceFactor * (t <= 0.8 ? f1(t) : f2(t));
        if(t > 0.8) {
            this.alpha = 1 - (t - 0.8) / 0.2;
        }
    }

}
