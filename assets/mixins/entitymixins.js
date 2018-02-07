// Create our Mixins namespace
Game.EntityMixins = {};

//Mixin template
// Game.EntityMixins.Mixin = {
//     name: 'Mixin',
//     groupName: 'Mixin',
//     init: function (template) { },
//     listeners: {
//         details: function () { },
//         update: function () { }
//     }
// }

// This signifies our entity can attack basic destructible enities
Game.EntityMixins.MeleeAttacker = {
    name: 'MeleeAttacker',
    groupName: 'Attacker',
    init: function (template) {
        this._attackValue = template['attackValue'] || 1;
    },
    getMeleeAttackValue: function () {
        var modifier = 0;
        // If we can equip items, then have to take into 
        // consideration weapons
        if (this.hasMixin(Game.EntityMixins.Equipper)) {
            this.getWeapons().forEach(weapon => {
                if (weapon.hasMixin(Game.ItemMixins.Melee)) {
                    modifier += weapon.getAttackValue();
                }
            });
        }
        return this._attackValue + modifier;
    },
    increaseAttackValue: function (value) {
        // If no value was passed, default to 2.
        value = value || 2;
        // Add to the attack value.
        this._attackValue += value;
        Game.sendMessage(this, "You look stronger!");
    },
    meleeAttack: function (target) {
        // If the target is destructible, calculate the damage
        // based on attack and defense value
        if (target.hasMixin('Destructible')) {
            var attack = this.getMeleeAttackValue();
            var defense = target.getDefenseValue();
            var max = Math.max(0, attack - defense);
            var damage = 1 + Math.floor(Math.random() * max);

            Game.sendMessage(this, 'You strike the %s for %d damage!',
                [target.getName(), damage]);
            Game.sendMessage(target, 'The %s strikes you for %d damage!',
                [this.getName(), damage]);

            target.takeDamage(this, damage);
        }
    },
    listeners: {
        details: function () {
            return [{ key: 'melee attack', value: this.getMeleeAttackValue() }];
        }
    }
};

Game.EntityMixins.RangedAttacker = {
    name: 'RangedAttacker',
    groupName: 'Attacker',
    init: function (template) {
        this._attackValue = template['attackValue'] || 1;
    },
    getRangedAttackValue: function () {
        var modifier = 0;
        // If we can equip items, then have to take into 
        // consideration weapons
        if (this.hasMixin(Game.EntityMixins.Equipper)) {
            this.getWeapons().forEach(weapon => {
                if (weapon.hasMixin(Game.ItemMixins.Ranged)) {
                    modifier += weapon.getAttackValue();
                }
            });
        }
        return this._attackValue + modifier;
    },
    increaseAttackValue: function (value) {
        // If no value was passed, default to 2.
        value = value || 2;
        // Add to the attack value.
        this._attackValue += value;
        Game.sendMessage(this, "You look stronger!");
    },
    rangedAttack: function (target) {
        // If the target is destructible, calculate the damage
        // based on attack and defense value
        if (target.hasMixin('Destructible')) {
            var attack = this.getRangedAttackValue();
            var defense = target.getDefenseValue();
            var max = Math.max(0, attack - defense);
            var damage = 1 + Math.floor(Math.random() * max);

            Game.sendMessage(this, 'You strike the %s for %d damage!',
                [target.getName(), damage]);
            Game.sendMessage(target, 'The %s strikes you for %d damage!',
                [this.getName(), damage]);

            target.takeDamage(this, damage);
        }
    },
    listeners: {
        details: function () {
            return [{ key: 'ranged attack', value: this.getRangedAttackValue() }];
        }
    }
};

// This mixin signifies an entity can take damage and be destroyed
Game.EntityMixins.Destructible = {
    name: 'Destructible',
    init: function (template) {
        this._maxHp = template['maxHp'] || 10;
        // We allow taking in health from the template incase we want
        // the entity to start with a different amount of HP than the 
        // max specified.
        this._hp = template['hp'] || this._maxHp;
        this._defenseValue = template['defenseValue'] || 0;
    },
    getDefenseValue: function () {
        var modifier = 0;
        // If we can equip items, then have to take into 
        // consideration armor
        if (this.hasMixin(Game.EntityMixins.Equipper)) {
            this.getArmor().forEach(armor => {
                modifier += armor.getDefenseValue();
            });
        }
        return this._defenseValue + modifier;
    },
    getHp: function () {
        return this._hp;
    },
    getMaxHp: function () {
        return this._maxHp;
    },
    setHp: function (hp) {
        this._hp = hp;
    },
    increaseDefenseValue: function (value) {
        // If no value was passed, default to 2.
        value = value || 2;
        // Add to the defense value.
        this._defenseValue += value;
        Game.sendMessage(this, "You look tougher!");
    },
    increaseMaxHp: function (value) {
        // If no value was passed, default to 10.
        value = value || 10;
        // Add to both max HP and HP.
        this._maxHp += value;
        this._hp += value;
        Game.sendMessage(this, "You look healthier!");
    },
    takeDamage: function (attacker, damage) {
        this._hp -= damage;
        // If have 0 or less HP, then remove ourseles from the map
        if (this._hp <= 0) {
            Game.sendMessage(attacker, 'You kill the %s!', [this.getName()]);
            // Raise events
            this.raiseEvent('onDeath', attacker);
            attacker.raiseEvent('onKill', this);
            this.kill();
        }
    },
    listeners: {
        onGainLevel: function () {
            // Heal the entity.
            this.setHp(this.getMaxHp());
        },
        details: function () {
            return [
                { key: 'defense', value: this.getDefenseValue() },
                { key: 'hp', value: this.getHp() }
            ];
        }
    }
};

Game.EntityMixins.MessageRecipient = {
    name: 'MessageRecipient',
    init: function (template) {
        this._messages = [];
    },
    receiveMessage: function (message) {
        this._messages.push(message);
    },
    getMessages: function () {
        return this._messages;
    },
    clearMessages: function () {
        this._messages = [];
    }
};

Game.EntityMixins.Alertable = {
    name: 'Alertable',
    init: function () {
        this._alerts = [];
    },
    getAlerts: function () {
        return this._alerts;
    },
    clearAlerts: function () {
        this._alerts = [];
    },
    listeners: {
        alert: function (text) {
            this._alerts.push(text);
        }
    }
}

// This signifies our entity posseses a field of vision of a given radius.
Game.EntityMixins.Sight = {
    name: 'Sight',
    groupName: 'Sight',
    init: function (template) {
        this._sightRadius = template['sightRadius'] || 5;
        this._seenEntities = [];
        this._seenItems = [];
    },
    getSightRadius: function () {
        return this._sightRadius;
    },
    getSeenEntities: function () {
        return this._seenEntities;
    },
    getSeenItems: function () {
        return this._seenItems;
    },
    increaseSightRadius: function (value) {
        // If no value was passed, default to 1.
        value = value || 1;
        // Add to sight radius.
        this._sightRadius += value;
        Game.sendMessage(this, "You are more aware of your surroundings!");
    },
    canSee: function (entity) {
        return this._seenEntities.indexOf(entity) >= 0;
    },
    seenEntitiesWith: function (mixin) {
        var seen = [];
        this._seenEntities.forEach(entity => {
            if (entity.hasMixin(mixin)) {
                seen.push(entity);
            }
        });
        return seen;
    },
    listeners: {
        update: function () {
            var seenEntities = [];
            var seenItems = [];

            var map = this.getMap();
            var currentDepth = this.getZ();
            var me = this;

            map.getFov(currentDepth).compute(
                this.getX(), this.getY(),
                this.getSightRadius(),
                function (x, y, radius, visibility) {
                    var entity = map.getEntityAt(x, y, currentDepth);
                    if (entity && entity != me) {
                        seenEntities.push(entity);
                    }

                    var items = map.getItemsAt(x, y, currentDepth);
                    // If we have items, we want to render the top most item
                    if (items) {
                        Array.prototype.push.apply(seenItems, items);
                    }
                });

            this._seenEntities = seenEntities;
            this._seenItems = seenItems;
        }
    }
};

// Message sending functions
Game.sendMessage = function (recipient, message, args) {
    // Make sure the recipient can receive the message 
    // before doing any work.
    if (recipient.hasMixin(Game.EntityMixins.MessageRecipient)) {
        // If args were passed, then we format the message, else
        // no formatting is necessary
        if (args) {
            message = vsprintf(message, args);
        }
        recipient.receiveMessage(message);
    }
};
Game.sendMessageNearby = function (map, centerX, centerY, centerZ, message, args) {
    // If args were passed, then we format the message, else
    // no formatting is necessary
    if (args) {
        message = vsprintf(message, args);
    }
    // Get the nearby entities
    entities = map.getEntitiesWithinRadius(centerX, centerY, centerZ, 5);
    // Iterate through nearby entities, sending the message if
    // they can receive it.
    for (var i = 0; i < entities.length; i++) {
        if (entities[i].hasMixin(Game.EntityMixins.MessageRecipient)) {
            entities[i].receiveMessage(message);
        }
    }
};

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
        this._items.push(item);
        return true;
    },
    removeItem: function (item) {
        // If we can equip items, then make sure we unequip the item we are removing.
        var index = this._items.indexOf(item);
        if (index >= 0 && this.hasMixin(Game.EntityMixins.Equipper) && this.isEquipped(item)) {
            this.unequip(item);
        }
        // Simply clear the inventory slot.
        this._items.splice(index, 1);
    },
    canAddItem: function () {
        return true;
    },
    canAddItems: function (num) {
        return true;
    },
    pickupItems: function (indices) {
        // Allows the user to pick up items from the map, where indices is
        // the indices for the array returned by map.getItemsAt
        var mapItems = this._map.getItemsAt(this.getX(), this.getY(), this.getZ());
        var added = 0;
        // Iterate through all indices.
        for (var i = 0; i < indices.length; i++) {
            // Try to add the item. If our inventory is not full, then splice the 
            // item out of the list of items. In order to fetch the right item, we
            // have to offset the number of items already added.
            if (this.addItem(mapItems[indices[i] - added])) {
                mapItems.splice(indices[i] - added, 1);
                added++;
            } else {
                // Inventory is full
                break;
            }
        }
        // Update the map items
        this._map.setItemsAt(this.getX(), this.getY(), this.getZ(), mapItems);
        // Return true only if we added all items
        return added === indices.length;
    },
    dropItem: function (item) {
        // Drops an item to the current map tile
        if (this._items.indexOf(item) >= 0) {
            if (this._map) {
                this._map.addItem(this.getX(), this.getY(), this.getZ(), item);
            }
            this.removeItem(item);
        }
    }
};

Game.EntityMixins.FoodConsumer = {
    name: 'FoodConsumer',
    init: function (template) {
        this._maxFullness = template['maxFullness'] || 1000;
        // Start halfway to max fullness if no default value
        this._fullness = template['fullness'] || (this._maxFullness / 2);
        // Number of points to decrease fullness by every turn.
        this._fullnessDepletionRate = template['fullnessDepletionRate'] || 1;
    },
    modifyFullnessBy: function (points) {
        this._fullness = this._fullness + points;
        if (this._fullness <= 0) {
            this.kill("You have died of starvation!");
        } else if (this._fullness > this._maxFullness) {
            this.kill("You choke and die!");
        }
    },
    getHungerState: function () {
        // Fullness points per percent of max fullness
        var perPercent = this._maxFullness / 100;
        // 5% of max fullness or less = starving
        if (this._fullness <= perPercent * 5) {
            return 'Starving';
            // 25% of max fullness or less = hungry
        } else if (this._fullness <= perPercent * 25) {
            return 'Hungry';
            // 95% of max fullness or more = oversatiated
        } else if (this._fullness >= perPercent * 95) {
            return 'Oversatiated';
            // 75% of max fullness or more = full
        } else if (this._fullness >= perPercent * 75) {
            return 'Full';
            // Anything else = not hungry
        } else {
            return 'Not Hungry';
        }
    },
    listeners: {
        update: function () {
            // Remove the standard depletion points
            this.modifyFullnessBy(-this._fullnessDepletionRate);

            // Fullness points per percent of max fullness
            var perPercent = this._maxFullness / 100;
            if (this._fullness <= perPercent * 5) {
                this.raiseEvent('alert', 'you are starving');
            }
        }
    }
};

Game.EntityMixins.CorpseDropper = {
    name: 'CorpseDropper',
    init: function (template) {
        // Chance of dropping a cropse (out of 100).
        this._corpseDropRate = template['corpseDropRate'] || 100;
        this._corpseButcherTemplates = template['corpseButcherTemplates'] || [];
    },
    listeners: {
        onDeath: function (attacker) {
            // Check if we should drop a corpse.
            if (Math.round(Math.random() * 100) <= this._corpseDropRate) {
                // Create a new corpse item and drop it.
                this._map.addItem(this.getX(), this.getY(), this.getZ(),
                    Game.ItemRepository.create('corpse', {
                        name: this._name + ' corpse',
                        foreground: this._foreground,
                        potentialTemplates: this._corpseButcherTemplates,
                        x: this._x,
                        y: this._y,
                        z: this._z,
                        map: this._map
                    }));
            }
        }
    }
};

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

Game.EntityMixins.ExperienceGainer = {
    name: 'ExperienceGainer',
    init: function (template) {
        this._level = template['level'] || 1;
        this._experience = template['experience'] || 0;
        this._statPointsPerLevel = template['statPointsPerLevel'] || 1;
        this._statPoints = 0;
        // Determine what stats can be levelled up.
        this._statOptions = [];
        if (this.hasMixin('Attacker')) {
            this._statOptions.push(['Increase attack value', this.increaseAttackValue]);
        }
        if (this.hasMixin('Destructible')) {
            this._statOptions.push(['Increase defense value', this.increaseDefenseValue]);
            this._statOptions.push(['Increase max health', this.increaseMaxHp]);
        }
        if (this.hasMixin('Sight')) {
            this._statOptions.push(['Increase sight range', this.increaseSightRadius]);
        }
    },
    getLevel: function () {
        return this._level;
    },
    getExperience: function () {
        return this._experience;
    },
    getNextLevelExperience: function () {
        return (this._level * this._level) * 10;
    },
    getStatPoints: function () {
        return this._statPoints;
    },
    setStatPoints: function (statPoints) {
        this._statPoints = statPoints;
    },
    getStatOptions: function () {
        return this._statOptions;
    },
    giveExperience: function (points) {
        var statPointsGained = 0;
        var levelsGained = 0;
        // Loop until we've allocated all points.
        while (points > 0) {
            // Check if adding in the points will surpass the level threshold.
            if (this._experience + points >= this.getNextLevelExperience()) {
                // Fill our experience till the next threshold.
                var usedPoints = this.getNextLevelExperience() - this._experience;
                points -= usedPoints;
                this._experience += usedPoints;
                // Level up our entity!
                this._level++;
                levelsGained++;
                this._statPoints += this._statPointsPerLevel;
                statPointsGained += this._statPointsPerLevel;
            } else {
                // Simple case - just give the experience.
                this._experience += points;
                points = 0;
            }
        }
        // Check if we gained at least one level.
        if (levelsGained > 0) {
            Game.sendMessage(this, "You advance to level %d.", [this._level]);
            this.raiseEvent('onGainLevel');
        }
    },
    listeners: {
        onKill: function (victim) {
            var exp = victim.getMaxHp() + victim.getDefenseValue();
            if (victim.hasMixin('Attacker')) {
                exp += victim.getMeleeAttackValue();
            }
            // Account for level differences
            if (victim.hasMixin('ExperienceGainer')) {
                exp -= (this.getLevel() - victim.getLevel()) * 3;
            }
            // Only give experience if more than 0.
            if (exp > 0) {
                this.giveExperience(exp);
            }
        },
        details: function () {
            return [{ key: 'level', value: this.getLevel() }];
        }
    }
};

Game.EntityMixins.RandomStatGainer = {
    name: 'RandomStatGainer',
    groupName: 'StatGainer',
    listeners: {
        onGainLevel: function () {
            var statOptions = this.getStatOptions();
            // Randomly select a stat option and execute the callback for each
            // stat point.
            while (this.getStatPoints() > 0) {
                // Call the stat increasing function with this as the context.
                statOptions.random()[1].call(this);
                this.setStatPoints(this.getStatPoints() - 1);
            }
        }
    }
};

Game.EntityMixins.PlayerStatGainer = {
    name: 'PlayerStatGainer',
    groupName: 'StatGainer',
    listeners: {
        onGainLevel: function () {
            // Setup the gain stat screen and show it.
            Game.Screen.gainStatScreen.setup(this);
            Game.Screen.playScreen.setSubScreen(Game.Screen.gainStatScreen);
        }
    }
};