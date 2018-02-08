Game.ItemMixins.Melee = {
    name: 'Melee',
    groupName: 'Wieldable',
    init: function (template) {
        this._attackValue = template['attackValue'] || 0;
    },
    getAttackValue: function () {
        return this._attackValue;
    },
    listeners: {
        details: function () {
            var results = [];
            results.push({ key: 'melee attack', value: this.getAttackValue() });
            return results;
        }
    }
};