Game.Screen.helpScreen = {
    render: function (display) {
        var text = 'Help';
        var border = '-------------';
        var y = 1;
        display.drawText(Game.getScreenWidth() / 2 - text.length / 2, y++, text);
        display.drawText(Game.getScreenWidth() / 2 - border.length / 2, y++, border);
        y += 2;
        display.drawText(3, y++, '[g] to get items');
        display.drawText(3, y++, '[d] to drop items');
        display.drawText(3, y++, '[e] to eat items');
        display.drawText(3, y++, '[i] to show inventory');
        display.drawText(3, y++, '[f] to fire a ranged weapon');
        display.drawText(3, y++, '[b] to butcher a corpse');
        display.drawText(3, y++, '[w] to wear or wield items');
        display.drawText(3, y++, '[t] to take off items');
        display.drawText(3, y++, '[x] to examine items');
        display.drawText(3, y++, '[l] to look around you');
        display.drawText(3, y++, '[r] to rest for a time');
        display.drawText(3, y++, '[?] to show this help screen');
        y += 3;
        text = '--- press any key to continue ---';
        display.drawText(Game.getScreenWidth() / 2 - text.length / 2, y++, text);
    },
    handleInput: function (inputType, inputData) {
        Game.Screen.playScreen.setSubScreen(null);
    }
};