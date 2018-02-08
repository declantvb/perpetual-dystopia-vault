Game.Screen.butcherScreen = new Game.Screen.ItemListScreen({
    caption: 'What do you want to butcher?',
    canSelect: true,
    canSelectMultipleItems: true,
    ok: function (selectedGroups) {
        var keys = Object.keys(selectedGroups);
        if (!this._player.canAddItems(keys.length)) {
            Game.sendMessage(this._player, "You cannot hold that many items!");
        }
        var player = this._player;
        var butcherable = this.butcherable;
        //todo variable time for butchering
        Game.Screen.waitScreen.setup({
            turnsToWait: keys.length * 5,
            action: 'Butchering',
            onComplete: function () {
                var remaining = [];
                for (let i = 0; i < keys.length; i++) {
                    const group = selectedGroups[keys[i]];
                    var count = 0;
                    group.forEach(item => {
                        if (!butcherable.removeItem(item)) {
                            console.log('failed to remove item when butchering');
                        }
                        if (player.addItem(item)) {
                            count++;
                        } else {
                            remaining.push(item);
                        }
                    });
                    if (count == 1) {
                        Game.sendMessage(player, "You pick up %s.", [group[0].describeA()]);
                    } else if (count > 1) {
                        Game.sendMessage(player, "You pick up %s %s.", [count, group[0].describe(false, true)]);
                    }
                }
                if (remaining.length > 0) {
                    Game.sendMessage(player, "Your inventory is full! Some items have been dropped");
                    player.getMap().setItemsAt(player.getX(), player.getY(), player.getZ(), remaining);
                }
            }
        });
        Game.Screen.playScreen.setSubScreen(Game.Screen.waitScreen);
        return true;
    }
});