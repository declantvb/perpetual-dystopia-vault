Game.ItemMixins.Edible = {
    name: 'Edible',
    init: function (template) {
        // Number of points to add to hunger
        this._foodValue = template['foodValue'] || 5;
        // Number of times the item can be consumed
        this._maxConsumptions = template['consumptions'] || 1;
        this._remainingConsumptions = this._maxConsumptions;
    },
    eat: function (entity) {
        if (entity.hasMixin('FoodConsumer')) {
            if (this.hasRemainingConsumptions()) {
                entity.modifyFullnessBy(this._foodValue);
                this._remainingConsumptions--;
            }
        }
    },
    hasRemainingConsumptions: function () {
        return this._remainingConsumptions > 0;
    },
    describe: function (capitalize, plural) {
        if (this._maxConsumptions != this._remainingConsumptions) {
            return (capitalize ? 'P' : 'p') +'artly eaten ' + Game.Item.prototype.describe.call(this, false, plural);
        } else {
            return Game.Item.prototype.describe.call(this, capitalize, plural);
        }
    },
    listeners: {
        details: function () {
            return [{ key: 'food', value: this._foodValue + 'x' + this._remainingConsumptions }];
        }
    }
};