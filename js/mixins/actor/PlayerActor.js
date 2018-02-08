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