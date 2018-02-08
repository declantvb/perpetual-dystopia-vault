Game.Screen.rangedAttackScreen = new Game.Screen.TargetBasedScreen({
    captionFunction: function (x, y) {
        var z = this._player.getZ();
        var map = this._player.getMap();
        // If the tile is explored, we can give a better capton
        if (map.isExplored(x, y, z)) {
            // If the tile isn't explored, we have to check if we can actually 
            // see it before testing if there's an entity or item.
            if (this._visibleCells[x + ',' + y]) {
                var entity = map.getEntityAt(x, y, z);
                if (entity && entity.hasMixin(Game.EntityMixins.Destructible)) {
                    return String.format('%s - hp: %s, defense: %s',
                        entity.describeA(true),
                        entity.getHp(),
                        entity.getDefenseValue());
                } else {
                    // If the tile is not explored, show the null tile description.
                    return 'There is nothing to fire at there';
                }
            }
        }

        return 'You cannot see there';
    },
    okFunction: function (x, y) {
        var z = this._player.getZ();
        var map = this._player.getMap();
        var entity = map.getEntityAt(x, y, z);
        if (entity) {
            this._player.rangedAttack(entity);
        } else {
            // todo put an ammunition here
        }
        return true;
    }
});