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