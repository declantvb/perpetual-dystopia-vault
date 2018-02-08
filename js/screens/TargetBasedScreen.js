Game.Screen.TargetBasedScreen = function (template) {
    template = template || {};
    // By default, our ok return does nothing and does not consume a turn.
    this._okFunction = template['okFunction'] || function (x, y) {
        return false;
    };
    // The defaut caption function simply returns an empty string.
    this._captionFunction = template['captionFunction'] || function (x, y) {
        return '';
    }
};

Game.Screen.TargetBasedScreen.prototype.setup = function (player, startX, startY, offsetX, offsetY) {
    this._player = player;
    // Store original position. Subtract the offset to make life easy so we don't
    // always have to remove it.
    this._startX = startX - offsetX;
    this._startY = startY - offsetY;
    // Store current cursor position
    this._cursorX = this._startX;
    this._cursorY = this._startY;
    // Store map offsets
    this._offsetX = offsetX;
    this._offsetY = offsetY;
    // Cache the FOV
    var visibleCells = {};
    this._player.getMap().getFov(this._player.getZ()).compute(
        this._player.getX(), this._player.getY(),
        this._player.getSightRadius(),
        function (x, y, radius, visibility) {
            visibleCells[x + "," + y] = true;
        });
    this._visibleCells = visibleCells;
};

Game.Screen.TargetBasedScreen.prototype.render = function (display) {
    var playScreen = Game.Screen.playScreen;
    playScreen.renderTiles.call(playScreen, display);

    // Draw a line from the start to the cursor.
    var points = Game.Geometry.getLine(this._startX, this._startY, this._cursorX, this._cursorY);

    var offsets = playScreen.getScreenOffsets();
    var topLeftX = offsets.x;
    var topLeftY = offsets.y;
    var currentDepth = playScreen._player.getZ();
    var map = playScreen._player.getMap();

    // This object will keep track of all visible map cells
    var visibleCells = {};
    // Find all visible cells and update the object
    map.getFov(currentDepth).compute(
        this._player.getX(), this._player.getY(),
        this._player.getSightRadius(),
        function (x, y, radius, visibility) {
            visibleCells[x + "," + y] = true;
        });

    // Render stars along the line.
    for (var i = 0, l = points.length; i < l; i++) {
        // Get the underlying glyph
        var glyph = Game.Glyph.unknown;
        var mapX = points[i].x + topLeftX;
        var mapY = points[i].y + topLeftY;
        if (map.isExplored(mapX, mapY, currentDepth)) {
            // Fetch the glyph for the tile and render it to the screen
            // at the offset position.
            glyph = map.getTile(mapX, mapY, currentDepth);
            var foreground = glyph.getForeground();
            // If we are at a cell that is in the field of vision, we need
            // to check if there are items or entities.
            if (visibleCells[mapX + ',' + mapY]) {
                // Check for entities first, since we want to draw entities over items.
                var entity = map.getEntityAt(mapX, mapY, currentDepth);
                if (entity) {
                    glyph = entity;
                } else {
                    var items = map.getItemsAt(mapX, mapY, currentDepth);
                    // If we have items, we want to render the top most item
                    if (items) {
                        glyph = items[items.length - 1];
                    }
                }
                // Update the foreground color in case our glyph changed
                foreground = glyph.getForeground();
            }
        }
        display.draw(points[i].x, points[i].y, glyph.getChar(), 'white', 'darkgreen');
    }

    // Render the caption at the bottom.
    display.drawText(0, Game.getScreenHeight() - 1,
        this._captionFunction(this._cursorX + this._offsetX, this._cursorY + this._offsetY));
};

Game.Screen.TargetBasedScreen.prototype.handleInput = function (inputType, inputData) {
    // Move the cursor
    var refresh = true;
    if (inputType == 'keydown') {
        if (inputData.keyCode === ROT.VK_LEFT) {
            this.moveCursor(-1, 0);
        } else if (inputData.keyCode === ROT.VK_RIGHT) {
            this.moveCursor(1, 0);
        } else if (inputData.keyCode === ROT.VK_UP) {
            this.moveCursor(0, -1);
        } else if (inputData.keyCode === ROT.VK_DOWN) {
            this.moveCursor(0, 1);
        } else if (inputData.keyCode === ROT.VK_ESCAPE) {
            Game.Screen.playScreen.setSubScreen(undefined);
        } else if (inputData.keyCode === ROT.VK_RETURN) {
            this.executeOkFunction();
            refresh = false;
        }
    }
    if (refresh) Game.refresh();
};

Game.Screen.TargetBasedScreen.prototype.moveCursor = function (dx, dy) {
    // Make sure we stay within bounds.
    this._cursorX = Math.max(0, Math.min(this._cursorX + dx, Game.getScreenWidth()));
    // We have to save the last line for the caption.
    this._cursorY = Math.max(0, Math.min(this._cursorY + dy, Game.getScreenHeight() - 1));
};

Game.Screen.TargetBasedScreen.prototype.executeOkFunction = function () {
    // Switch back to the play screen.
    Game.Screen.playScreen.setSubScreen(undefined);
    // Call the OK function and end the player's turn if it return true.
    if (this._okFunction(this._cursorX + this._offsetX, this._cursorY + this._offsetY)) {
        this._player.getMap().getEngine().unlock();
    }
};