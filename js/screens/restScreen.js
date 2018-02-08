Game.Screen.restScreen = {
    setup: function () {
        this._inputString = '';
    },
    render: function (display) {
        var playScreen = Game.Screen.playScreen;
        playScreen.renderTiles.call(playScreen, display);
        display.drawText(0, Game.getScreenHeight() - 1, 'Turns to rest: ' + this._inputString);
    },
    handleInput: function (inputType, inputData) {
        // input wait time
        if (inputType == 'keydown') {
            if (inputData.keyCode === ROT.VK_RETURN) {
                var num = parseInt(this._inputString, 10);
                if (isNaN(num)) {
                    //bad number
                } else {
                    Game.Screen.playScreen._player.setBusy(true);
                    Game.Screen.waitScreen.setup({ turnsToWait: num, action: 'Resting' });
                    Game.Screen.playScreen.setSubScreen(Game.Screen.waitScreen);
                }
            } else if (inputData.keyCode === ROT.VK_BACK_SPACE) {
                this._inputString = this._inputString.slice(0, -1)
            }
        } else if (inputType == 'keypress') {
            var keyChar = String.fromCharCode(inputData.charCode);
            if (!isNaN(parseInt(keyChar))) {
                this._inputString += keyChar;
            }
        }
        Game.refresh();
    }
};