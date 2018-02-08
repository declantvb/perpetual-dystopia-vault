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