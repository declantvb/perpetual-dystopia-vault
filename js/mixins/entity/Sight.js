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