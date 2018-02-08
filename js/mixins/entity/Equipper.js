Game.EntityMixins.Equipper = {
    name: 'Equipper',
    init: function (template) {
        this._slots = {};
        for (const key in Game.ItemSlots) {
            this._slots[Game.ItemSlots[key]] = null;
        }
    },
    equip: function (item) {
        this._slots[item.getSlot()] = item;
    },
    unequip: function (item) {
        this._slots[item.getSlot()] = null;
    },
    getEquippedItems: function () {
        var items = [];
        for (const key in this._slots) {
            if (this._slots.hasOwnProperty(key)) {
                const item = this._slots[key];
                if (item) {
                    items.push(item);
                }
            }
        }
        return items;
    },
    isEquipped: function (item) {
        if (!item.hasMixin(Game.ItemMixins.Equippable)) return false;
        return this._slots[item.getSlot()] == item;
    },
    getWeapons: function (type) {
        var weapons = [];
        for (const key in this._slots) {
            const item = this._slots[key];
            if (item && item.hasMixin('Wieldable') &&
                (!type || item.hasMixin(type))) {
                weapons.push(item);
            }
        }
        return weapons;
    },
    getArmor: function () {
        var armor = [];
        for (const key in this._slots) {
            const item = this._slots[key];
            if (item && item.hasMixin(Game.ItemMixins.Wearable)) {
                armor.push(item);
            }
        }
        return armor;
    }
};