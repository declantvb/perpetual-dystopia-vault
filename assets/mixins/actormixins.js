//Actor template
// Game.EntityMixins.Actor = {
//     name: 'Actor',
//     groupName: 'Actor',
//     init: function (template) { },
//     act: function () { },
// }

// Main player's actor mixin
Game.EntityMixins.PlayerActor = {
    name: 'PlayerActor',
    groupName: 'Actor',
    init: function () {
        this._visibleCells = [];
        this._busy = false;
    },
    act: function () {
        if (this._acting) {
            return;
        }
        this._acting = true;
        this.raiseEvent('update');
        // Detect if the game is over
        if (!this.isAlive()) {
            Game.Screen.playScreen.setGameEnded(true);
            // Send a last message to the player
            Game.sendMessage(this, 'Press [Enter] to continue!');
        }

        // Re-render the screen
        Game.refresh();
        // Lock the engine and wait asynchronously
        // for the player to press a key.
        this.getMap().getEngine().lock();

        if (!this.getBusy()) {
            // Clear the message queue
            this.clearMessages();
            this.clearAlerts();
        }

        this._acting = false;
    },
    getBusy: function () {
        return this._busy;
    },
    setBusy: function (value) {
        this._busy = value;
    },
};

Game.EntityMixins.FungusActor = {
    name: 'FungusActor',
    groupName: 'Actor',
    init: function () {
        this._growthsRemaining = 5;
    },
    act: function () {
        this.raiseEvent('update');
        // Check if we are going to try growing this turn
        if (this._growthsRemaining > 0) {
            if (Math.random() <= 0.02) {
                // Generate the coordinates of a random adjacent square by
                // generating an offset between [-1, 0, 1] for both the x and
                // y directions. To do this, we generate a number from 0-2 and then
                // subtract 1.
                var xOffset = Math.floor(Math.random() * 3) - 1;
                var yOffset = Math.floor(Math.random() * 3) - 1;
                // Make sure we aren't trying to spawn on the same tile as us
                if (xOffset != 0 || yOffset != 0) {
                    // Check if we can actually spawn at that location, and if so
                    // then we grow!
                    if (this.getMap().isEmptyFloor(this.getX() + xOffset,
                        this.getY() + yOffset,
                        this.getZ())) {
                        var entity = Game.EntityRepository.create('fungus');
                        entity.setPosition(this.getX() + xOffset, this.getY() + yOffset,
                            this.getZ());
                        this.getMap().addEntity(entity);
                        this._growthsRemaining--;
                        // Send a message nearby!
                        Game.sendMessageNearby(this.getMap(),
                            entity.getX(), entity.getY(), entity.getZ(),
                            'The fungus is spreading!');
                    }
                }
            }
        }
    }
};

Game.EntityMixins.TaskActor = {
    name: 'TaskActor',
    groupName: 'Actor',
    init: function (template) {
        // Load tasks
        this._tasks = template['tasks'] || ['wander'];
    },
    act: function () {
        this.raiseEvent('update');
        // Iterate through all our tasks
        for (var i = 0; i < this._tasks.length; i++) {
            if (this.canDoTask(this._tasks[i])) {
                // If we can perform the task, execute the function for it.
                this[this._tasks[i]]();
                return;
            }
        }
    },
    canDoTask: function (task) {
        if (task === 'hunt') {
            return this.hasMixin('Sight') && this.canSee(this.getMap().getPlayer());
        } else if (task === 'wander') {
            return true;
        } else {
            throw new Error('Tried to perform undefined task ' + task);
        }
    },
    hunt: function () {
        var player = this.getMap().getPlayer();

        // If we are adjacent to the player, then attack instead of hunting.
        var offsets = Math.abs(player.getX() - this.getX()) +
            Math.abs(player.getY() - this.getY());
        if (offsets === 1) {
            if (this.hasMixin('Attacker')) {
                this.attack(player);
                return;
            }
        }

        // Generate the path and move to the first tile.
        var source = this;
        var z = source.getZ();
        var path = new ROT.Path.AStar(player.getX(), player.getY(), function (x, y) {
            // If an entity is present at the tile, can't move there.
            var entity = source.getMap().getEntityAt(x, y, z);
            if (entity && entity !== player && entity !== source) {
                return false;
            }
            return source.getMap().getTile(x, y, z).isWalkable();
        }, { topology: 4 });
        // Once we've gotten the path, we want to move to the second cell that is
        // passed in the callback (the first is the entity's strting point)
        var count = 0;
        path.compute(source.getX(), source.getY(), function (x, y) {
            if (count == 1) {
                source.tryMove(x, y, z);
            }
            count++;
        });
    },
    wander: function () {
        // Flip coin to determine if moving by 1 in the positive or negative direction
        var moveOffset = (Math.round(Math.random()) === 1) ? 1 : -1;
        // Flip coin to determine if moving in x direction or y direction
        if (Math.round(Math.random()) === 1) {
            this.tryMove(this.getX() + moveOffset, this.getY(), this.getZ());
        } else {
            this.tryMove(this.getX(), this.getY() + moveOffset, this.getZ());
        }
    }
};