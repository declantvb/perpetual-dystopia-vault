Game.Screen.eatScreen = new Game.Screen.ItemListScreen({
    caption: 'Choose the item you wish to eat',
    canSelect: true,
    canSelectMultipleItems: false,
    isAcceptable: function (item) {
        return item && item.hasMixin('Edible');
    },
    ok: function (selectedGroups) {
        // Eat the item, removing it if there are no consumptions remaining.
        var group = selectedGroups[Object.keys(selectedGroups)[0]];
        var item = group[0];
        Game.sendMessage(this._player, "You eat %s.", [item.describeThe()]);
        item.eat(this._player);
        if (!item.hasRemainingConsumptions()) {
            this._player.removeItem(item);
        }
        return true;
    }
});