// todo you can currently wear/wield multiple items,
// if they fit in the same slots the last one will end up equipped
Game.Screen.equipScreen = new Game.Screen.ItemListScreen({
    caption: 'Choose the item you wish to equip',
    canSelect: true,
    canSelectMultipleItems: true,
    isAcceptable: function (item) {
        return item && item.hasMixin('Equippable');
    },
    ok: function (selectedGroups, unSelectedGroups) {
        for (const key in selectedGroups) {
            const group = selectedGroups[key];
            const item = group[0];
            if (!this._player.isEquipped(item)) {
                this._player.equip(item);
                this._player.removeItem(item);
                Game.sendMessage(this._player, "You equip %s.", [item.describeThe()]);
            }
        }
        return true;
    }
});