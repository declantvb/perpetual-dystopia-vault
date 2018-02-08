Game.ItemMixins.Butcherable = {
    name: 'Butcherable',
    init: function (template) {
        var potentialTemplates = template['potentialTemplates'] || [];
        this._items = potentialTemplates.map(element => {
            return Game.ItemRepository.create(element, { origin: this.getName() });
        });
    },
    getItems: function () {
        return this._items;
    },
    removeItem: function (item) {
        var index = this._items.indexOf(item);
        if (index >= 0) {
            this._items.splice(index, 1);
            return true;
        }
        return false;
    },
    listeners: {
        details: function () {
            var results = [];
            if (this.getItems().length > 0) {
                results.push({ key: 'butchering results', value: this.getItems().map(i => i.getName()) });
            }
            return results;
        }
    }
};