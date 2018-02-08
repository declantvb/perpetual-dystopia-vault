Game.Screen.examineScreen = new Game.Screen.ItemListScreen({
    caption: 'Choose the item you wish to examine',
    canSelect: true,
    canSelectMultipleItems: false,
    isAcceptable: function (item) {
        return true;
    },
    ok: function (selectedGroups) {
        var keys = Object.keys(selectedGroups);
        if (keys.length > 0) {
            var group = selectedGroups[keys[0]];
            item = group[0];
            if (group.length == 1) {
                Game.sendMessage(this._player, "It's %s (%s).",
                [
                    item.describeA(false),
                    item.details()
                ]);
            } else if (group.length > 1) {
                Game.sendMessage(this._player, "It's %s %s (%s).",
                [
                    group.length,
                    item.describe(false, true),
                    item.details()
                ]); 
            }
        }
        return true;
    }
});