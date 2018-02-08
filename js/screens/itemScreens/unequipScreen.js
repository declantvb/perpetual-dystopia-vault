Game.Screen.unequipScreen = new Game.Screen.ItemListScreen({
    caption: 'Choose the item you wish to unequip',
    canSelect: true,
    canSelectMultipleItems: true,
    ok: function (selectedGroups, unSelectedGroups) {
        for (const key in selectedGroups) {
            const group = selectedGroups[key];
            const item = group[0];
            if (this._player.isEquipped(item)) {
                this._player.addItem(item);
                this._player.unequip(item);
                Game.sendMessage(this._player, "You put away %s.", [item.describeThe()]);
            }
        }
        return true;
    }
});