Game.Item = function(properties) {
    properties = properties || {};
    // Call the dynamic glyph's construtor with our set of properties
    Game.DynamicGlyph.call(this, properties);
    // Instantiate any properties from the passed object
    this._x = properties['x'] || 0;
    this._y = properties['y'] || 0;
    this._z = properties['z'] || 0;
    this._map = null;

    this._destroyed = false;
};
// Make items inherit all the functionality from dynamic glyphs
Game.Item.extend(Game.DynamicGlyph);

Game.Item.prototype.setX = function(x) {
    this._x = x;
};
Game.Item.prototype.setY = function(y) {
    this._y = y;
};
Game.Item.prototype.setZ = function(z) {
    this._z = z;
};
Game.Item.prototype.setPosition = function(pos) {
    this._x = pos.x;
    this._y = pos.y;
    this._z = pos.z;
};
Game.Item.prototype.setMap = function(map) {
    this._map = map;
};
Game.Item.prototype.getX = function() {
    return this._x;
};
Game.Item.prototype.getY   = function() {
    return this._y;
};
Game.Item.prototype.getZ = function() {
    return this._z;
};
Game.Item.prototype.getMap = function() {
    return this._map;
};
Game.Item.prototype.destroy = function(message) {
    // Only destroy once!
    if (this._destroyed) {
        return;
    }
    this._destroyed = true;
    this.getMap().removeItem(this);
};
Game.Item.prototype.stackableWith = function (other) {
    return this.describe() == other.describe() && this.details() == other.details();
}