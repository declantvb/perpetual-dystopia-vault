Game.EntityMixins.CorpseDropper = {
    name: 'CorpseDropper',
    init: function (template) {
        // Chance of dropping a cropse (out of 100).
        this._corpseDropRate = template['corpseDropRate'] || 100;
        this._corpseButcherTemplates = template['corpseButcherTemplates'] || [];
    },
    listeners: {
        onDeath: function (attacker) {
            // Check if we should drop a corpse.
            if (Math.round(Math.random() * 100) <= this._corpseDropRate) {
                // Create a new corpse item and drop it.
                this._map.addItem(this.getX(), this.getY(), this.getZ(),
                    Game.ItemRepository.create('corpse', {
                        name: this._name + ' corpse',
                        foreground: this._foreground,
                        potentialTemplates: this._corpseButcherTemplates,
                        x: this._x,
                        y: this._y,
                        z: this._z,
                        map: this._map
                    }));
            }
        }
    }
};