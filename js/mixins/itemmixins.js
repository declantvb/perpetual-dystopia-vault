Game.ItemMixins = {};

// Edible mixins
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

// Equipment mixins

Game.ItemSlots = {
    Head: 'head',
    Chest: 'chest',
    //Legs: 'legs',
    MainHand: 'main hand',
    //OffHand: 'off hand',
};

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

Game.AmmunitionTypes = {
    Shot: 'shot',
    Arrow: 'arrow',
};

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

Game.ItemMixins.Decays = {
    name: 'Decays',
    init: function (template) {
        this._maxFreshness = template['maxFreshness'] || 100;
        this._freshness = template['freshness'] || this._maxFreshness;
        this._decayRate = template['decayRate'] || 1;
        this._destroyTimeFactor = 0.1;
    },
    getFreshness: function () {
        return this._freshness;
    },
    getDecayLabel: function () {
        if (this._freshness < 0) {
            return 'Rotten';
        } else if (this._freshness < 25) {
            return 'Decaying'
        } else if (this._freshness < 50) {
            return 'Stale'
        } else {
            return 'Fresh'
        }
    },
    listeners: {
        details: function () {
            return [{ key: 'state', value: this.getDecayLabel() }];
        },
        update: function () {
            this._freshness -= this._decayRate;

            if (this._freshness < 0 && Math.random() < ((-this._freshness * this._destroyTimeFactor) / this._maxFreshness)) {
                Game.sendMessageNearby(this.getMap(), this.getX(), this.getY(), this.getZ(), 'The %s rotted away!', [this.getName()]);
                this.destroy();
            }
        }
    }
};