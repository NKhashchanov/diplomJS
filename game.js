'use strict';

class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    plus(objVector) {
        if (!(objVector instanceof Vector)) {
            throw new Error('Можно прибавлять к вектору только вектор типа Vector');
        }
        return new Vector(this.x + objVector.x, this.y + objVector.y);
    }

    times(factor) {
        return new Vector(this.x * factor, this.y * factor);
    }
}

class Actor {
    constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
        if (!(pos instanceof Vector) || !(size instanceof Vector) || !(speed instanceof Vector)) {
            throw new Error('Можно передавать только объект типа Vector');
        }
        this.pos = pos;
        this.size = size;
        this.speed = speed;
    }

    act() {

    }

    get type() {
        return 'actor';
    }

    get left() {
        return this.pos.x;
    }

    get top() {
        return this.pos.y;
    }

    get right() {
        return this.pos.x + this.size.x;
    }

    get bottom() {
        return this.pos.y + this.size.y;
    }

    isIntersect(objActor) {
        if (!(objActor instanceof Actor)) {
            throw new Error('Можно передавать только объект типа Actor');
        }

        if (objActor === this) {
            return false;
        }

        if (objActor.left >= this.right) {
            return false;
        }

        if (objActor.top >= this.bottom) {
            return false;
        }

        if (objActor.right <= this.left) {
            return false;
        }

        if (objActor.bottom <= this.top) {
            return false;
        }

        return true;
    }
}

class Level {
    constructor(grid = [], actors = []) {
        this.grid = grid;
        this.actors = actors;
        this.height = this.grid.length;
        this.width = this.grid.reduce((i, j) => {
                if (j.length > i) {
                   return j.length;
                } else {
                   return i;
                };
            }, 0);
        this.player = this.actors.find(player => player.type === 'player');
        this.status = null;
        this.finishDelay = 1;
    }

    isFinished() {
        if (this.status !== null && this.finishDelay < 0) {
            return true;
        } else {
            return false;
        }
    }

    actorAt(objActor) {
        if (!(objActor instanceof Actor) || !objActor) {
            throw new Error('Можно передавать только объект типа Actor');
        }
        return this.actors.find(el => el.isIntersect(objActor));
    }

    obstacleAt(where, size) {
        if (!(where instanceof Vector) && !(size instanceof Vector)) {
            throw new Error('Можно передавать только объект типа Vector.');
        }

        if (where.x < 0 || where.y < 0 || where.x + size.x > this.width) {
            return 'wall';
        }

        if ((where.y + size.y) >= this.height) {
            return 'lava';
        }

        let xMin = Math.floor(where.x);
        let xMax = Math.ceil(where.x + size.x);
        let yMin = Math.floor(where.y);
        let yMax = Math.ceil(where.y + size.y);
        for (let i = yMin; i < yMax; i++) {
            for (let j = xMin; j < xMax; j++) {
                return this.grid[i][j];
            }
        }
    }

    removeActor(objActor) {
        let act = this.actors.indexOf(objActor);
        if(act !== -1) {
            this.actors.splice(act, 1);
        }
        return this.actors;
    }

    noMoreActors(type) {
        return !this.actors.find(el => el.type === type);
    }

    playerTouched(type, objActor) {
        if (this.status !== null) {
            return;
        }

        if (type === 'lava' || type === 'fireball') {
            this.status = 'lost';
        }

        if (type === 'coin' && objActor.type === 'coin') {
            this.removeActor(objActor);
            if(this.noMoreActors(objActor.type)) {
                this.status = 'won';
            }
        }
    }
}
