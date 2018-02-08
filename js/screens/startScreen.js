Game.Screen.startScreen = {
    enter: function () { console.log("Entered start screen."); },
    exit: function () { console.log("Exited start screen."); },
    render: function (display) {
        // Render our prompt to the screen
        var title = 'Perpetual Dystopia Vault';
        var prompt = 'Press [Enter] to start!';
        var y = 5;
        display.drawText(Game.getScreenWidth() / 2 - title.length / 2, y++, '%c{yellow}' + title);
        display.drawText(Game.getScreenWidth() / 2 - prompt.length / 2, y++, prompt);
    },
    handleInput: function (inputType, inputData) {
        // When [Enter] is pressed, go to the play screen
        if (inputType === 'keydown') {
            if (inputData.keyCode === ROT.VK_RETURN) {
                Game.switchScreen(Game.Screen.playScreen);
            }
        }
    }
};