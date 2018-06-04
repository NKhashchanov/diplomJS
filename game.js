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
        } else if (objActor.left >= this.right) {
            return false;
        } else if (objActor.top >= this.bottom) {
            return false;
        } else if (objActor.right <= this.left) {
            return false;
        } else if (objActor.bottom <= this.top) {
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
        this.width = this.grid.reduce((x, y) => {return Math.max(y.length, x)}, 0);
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
                if (this.grid[i][j] !== undefined) {
                    return this.grid[i][j];
                }
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

class LevelParser {
    constructor(dictionary) {
        this.dictionary = dictionary;
    }

    actorFromSymbol(symbol) {
        if (!symbol) {
            return undefined;
        } else {
            return this.dictionary[symbol];
        }
    }

    obstacleFromSymbol(symbol) {
        if (symbol === 'x') {
            return 'wall';
        } else if(symbol === '!') {
            return 'lava';
        } else {
            return undefined;
        }
    }

    createGrid(arr) {
        return arr.map(cell => cell.split('').map(symbol => this.obstacleFromSymbol(symbol)));
    }

    createActors(array = []) {
        if (!this.dictionary) {
            return [];
        }
        const actors = [];
        array.forEach((cell, y) => cell.split('').forEach((symbol, x) => {
            let symbolClass = this.actorFromSymbol(symbol);
        if (typeof symbolClass === 'function') {
            let obj = new symbolClass(new Vector(x, y));
            if (obj instanceof Actor) {
                actors.push(obj);
            }
        }
    }));
        return actors;
    }

    parse(array) {
        return new Level(this.createGrid(array), this.createActors(array));
    }
}

class Fireball extends Actor {
    constructor(pos, speed) {
        super(pos, new Vector(1, 1), speed);
    }

    get type() {
        return 'fireball';
    }

    getNextPosition(time = 1) {
        return this.pos.plus(this.speed.times(time));
    }

    handleObstacle() {
        this.speed = this.speed.times(-1);
    }

    act(time, obj) {
        let position = this.getNextPosition(time);
        let obstacle = obj.obstacleAt(position, this.size);
        if (obstacle) {
            this.handleObstacle();
        } else {
            this.pos = position;
        }
    }
}

class HorizontalFireball extends Fireball {
    constructor (pos) {
        super(pos, new Vector(2, 0));
    }
}

class VerticalFireball extends Fireball {
    constructor (pos) {
        super(pos, new Vector(0, 2));
    }
}

class FireRain extends Fireball {
    constructor(pos) {
        super(pos, new Vector(0, 3));
        this.startPos = pos;
    }

    handleObstacle() {
        this.pos = this.startPos;
    }
}

class Coin extends Actor {
    constructor(pos = new Vector()) {
        super(pos.plus(new Vector(0.2, 0.1)), new Vector (0.6, 0.6));
        this.startPos = this.pos;
        this.springSpeed = 8;
        this.springDist = 0.07;
        this.spring = Math.random() * 2 * Math.PI;
    }

    get type() {
        return 'coin';
    }

    updateSpring(time = 1) {
        this.spring += this.springSpeed * time;
    }

    getSpringVector() {
        return new Vector(0, (Math.sin(this.spring) * this.springDist));
    }

    getNextPosition(time = 1) {
        this.updateSpring(time);
        let i = this.getSpringVector();
        return this.startPos.plus(i);
    }

    act(time) {
        this.pos = this.getNextPosition(time);
    }
}

class Player extends Actor {
    constructor(pos = new Vector()) {
        super(pos.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5), new Vector(0, 0));
    }

    get type() {
        return 'player';
    }
}

const actorDict = {
    '@': Player,
    'o': Coin,
    '=': HorizontalFireball,
    '|': VerticalFireball,
    'v': FireRain
}

const parser = new LevelParser(actorDict);

loadLevels()
    .then(JSON.parse)
    .then(levels => runGame(levels, parser, DOMDisplay)
    .then(() => alert('Победа')));