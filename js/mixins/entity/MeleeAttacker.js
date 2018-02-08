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