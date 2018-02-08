Game.ItemMixins.Ammunition = {
    name: 'Ammunition',
    init: function (template) {
        this._attackValue = template['attackValue'] || 0;
        this._ammunitionType = template['ammunitionType'] || 0;
    },
    getAttackValue: function () {
        return this._attackValue;
    },
    getAmmunitionType: function () {
        return this._ammunitionType;
    },
    listeners: {
        details: function () {
            var results = [];
            results.push({ key: 'ranged attack', value: this.getAttackValue() });
            results.push({ key: 'type', value: this.getAmmunitionType() });
            return results;
        }
    }
};