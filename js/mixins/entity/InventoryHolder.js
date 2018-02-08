Game.EntityMixins.InventoryHolder = {
    name: 'InventoryHolder',
    init: function (template) {
        // Set up an empty inventory.
        this._items = [];
    },
    getItems: function () {
        return this._items;
    },
    addItem: function (item) {
        if (!item instanceof Game.Item) return false;
        this._items.push(item);
        return true;
    },
    removeItem: function (item) {
        var index = this._items.indexOf(item);
        if (index >= 0) {
            // Simply clear the inventory slot.
            this._items.splice(index, 1);
            return true;
        }
        return false;
    },
    canAddItem: function () {
        return true;
    },
    canAddItems: function (num) {
        return true;
    }
};