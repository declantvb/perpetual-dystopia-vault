Game.ItemMixins.Wearable = {
    name: 'Wearable',
    init: function (template) {
        this._defenseValue = template['defenseValue'] || 0;
    },
    getDefenseValue: function () {
        return this._defenseValue;
    },
    listeners: {
        details: function () {
            var results = [];
            results.push({ key: 'defense', value: this.getDefenseValue() });
            return results;
        }
    }
};