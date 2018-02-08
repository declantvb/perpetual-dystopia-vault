Game.Screen.waitScreen = {
    setup: function (template) {
        this._turnsToWait = template['turnsToWait'] || 0;
        this._action = template['action'] || 'Waiting';
        this._onComplete = template['onComplete'] || function () { };
        this._exiting = false;
        this._cancel = false;
    },
    render: function (display) {
        var playScreen = Game.Screen.playScreen;
        playScreen.renderTiles.call(playScreen, display);

        //Check for seen attackers
        // todo replace with check for hostiles
        var seenEnemies = playScreen._player.seenEntitiesWith(Game.EntityMixins.Attacker);

        var alerts = playScreen._player.getAlerts();

        display.drawText(0, Game.getScreenHeight() - 1, vsprintf('%s for %s turns...', [this._action, this._turnsToWait]));

        // Escape from screen
        if (seenEnemies.length > 0) {
            this._exiting = true;
            Game.sendMessage(playScreen._player, '%s interrupted by %s!', [this._action, seenEnemies[0].describeA()]);
        }
        if (alerts.length > 0) {
            this._exiting = true;
            Game.sendMessage(playScreen._player, '%s interrupted because %s!', [this._action, alerts.join(', ')]);
        }
        if (this._cancel) {
            this._exiting = true;
            Game.sendMessage(playScreen._player, '%s canceled', [this._action]);
        }
        if (this._turnsToWait <= 0) {
            this._exiting = true;
            this._onComplete();
        }
        if (this._exiting) {
            Game.Screen.playScreen.setSubScreen(null);
        }
        else {
            // delay unlocking to slow down the speed
            setTimeout(() => {
                this._turnsToWait--;

                if (!this._exiting) playScreen._player.getMap().getEngine().unlock();
            }, 100);
        }
    },
    handleInput: function (inputType, inputData) {
        //cancel
        if (inputType == 'keydown') {
            this._cancel = true;
        }
        return;
    }
};