Game.Screen.dropScreen = new Game.Screen.ItemListScreen({
    caption: 'Choose the item you wish to drop',
    canSelect: true,
    canSelectMultipleItems: false,
    ok: function (selectedGroups) {
        // Drop the selected item
        var items = selectedGroups[Object.keys(selectedGroups)[0]];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            this._player.removeItem(item);
            this._map.addItem(this._player.getX(), this._player.getY(), this._player.getZ(), item);
        }
        return true;
    }
});