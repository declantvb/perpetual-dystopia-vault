Game.ItemMixins.Ranged = {
    name: 'Ranged',
    groupName: 'Wieldable',
    init: function (template) {
        this._attackValue = template['attackValue'] || 0;
        this._range = template['range'] || 0;
        this._ammunitionType = template['ammunitionType'] || 0;
    },
    getAttackValue: function () {
        return this._attackValue;
    },
    getRange: function () {
        return this._range;
    },
    getAmmunitionType: function () {
        return this._ammunitionType;
    },
    listeners: {
        details: function () {
            var results = [];
            results.push({ key: 'ranged attack', value: this.getAttackValue() });
            results.push({ key: 'range', value: this.getRange() });
            results.push({ key: 'ammo', value: this.getAmmunitionType() });
            return results;
        }
    }
};