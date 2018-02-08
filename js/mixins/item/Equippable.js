Game.ItemMixins.Equippable = {
    name: 'Equippable',
    init: function (template) {
        this._slot = template['slot'];
    },
    getSlot: function () {
        return this._slot;
    },
    listeners: {
        details: function () {
            var results = [];
            results.push({ key: 'slot', value: this.getSlot() });
            return results;
        }
    }
};