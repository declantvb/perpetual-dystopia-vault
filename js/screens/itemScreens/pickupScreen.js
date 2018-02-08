Game.Screen.pickupScreen = new Game.Screen.ItemListScreen({
    caption: 'Choose the items you wish to pickup',
    canSelect: true,
    canSelectMultipleItems: true,
    ok: function (selectedGroups, unSelectedGroups) {
        //try add all, if can't add, put back on ground
        var remaining = [];
        for (const groupKey in selectedGroups) {
            if (selectedGroups.hasOwnProperty(groupKey)) {
                const group = selectedGroups[groupKey];
                group.forEach(item => {
                    if (!this._player.addItem(item)) {
                        remaining.push(item);
                    }
                });
            }
        }

        if (remaining.length > 0) {
            Game.sendMessage(this._player, "Your inventory is full! Not all items were picked up.");
        }

        // add back the unselected items
        for (const groupKey in unSelectedGroups) {
            if (unSelectedGroups.hasOwnProperty(groupKey)) {
                const group = unSelectedGroups[groupKey];
                group.forEach(item => {
                    remaining.push(item);
                });
            }
        }

        // put the remaining back down
        this._map.setItemsAt(this._player.getX(), this._player.getY(), this._player.getZ(), remaining);
        return true;
    }
});