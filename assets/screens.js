Game.Screen = {};

// Define our initial start screen
Game.Screen.startScreen = {
    enter: function () { console.log("Entered start screen."); },
    exit: function () { console.log("Exited start screen."); },
    render: function (display) {
        // Render our prompt to the screen
        var title = 'Perpetual Dystopia Vault';
        var prompt = 'Press [Enter] to start!';
        var y = 5;
        display.drawText(Game.getScreenWidth() / 2 - title.length / 2, y++, '%c{yellow}' + title);
        display.drawText(Game.getScreenWidth() / 2 - prompt.length / 2, y++, prompt);
    },
    handleInput: function (inputType, inputData) {
        // When [Enter] is pressed, go to the play screen
        if (inputType === 'keydown') {
            if (inputData.keyCode === ROT.VK_RETURN) {
                Game.switchScreen(Game.Screen.playScreen);
            }
        }
    }
};

// Define our playing screen
Game.Screen.playScreen = {
    _player: null,
    _gameEnded: false,
    _subScreen: null,
    enter: function () {
        // Create a map based on our size parameters
        var width = 100;
        var height = 48;
        var depth = 6;
        // Create our map from the tiles and player
        this._player = new Game.Entity(Game.PlayerTemplate);
        //todo debug
        this._player.addItem(Game.ItemRepository.create('sling'));
        this._player.addItem(Game.ItemRepository.create('tunic'));
        var tiles = new Game.Builder(width, height, depth).getTiles();
        var map = new Game.Map.Cave(tiles, this._player);
        // Start the map's engine
        map.getEngine().start();
    },
    exit: function () { console.log("Exited play screen."); },
    render: function (display) {
        // Render subscreen if there is one
        if (this._subScreen) {
            this._subScreen.render(display);
            return;
        }

        var screenWidth = Game.getScreenWidth();
        var screenHeight = Game.getScreenHeight();

        // Render the tiles
        this.renderTiles(display);

        // Get the messages in the player's queue and render them
        var messages = this._player.getMessages();
        var messageY = 0;
        for (var i = 0; i < messages.length; i++) {
            // Draw each message, adding the number of lines
            messageY += display.drawText(
                0,
                messageY,
                '%c{white}%b{black}' + messages[i]
            );
        }

        // Render player stats
        var stats = '%c{white}%b{black}';
        stats += vsprintf('HP: %d/%d L: %d XP: %d',
            [this._player.getHp(), this._player.getMaxHp(),
            this._player.getLevel(), this._player.getExperience()]);
        display.drawText(0, screenHeight, stats);
        // Render hunger state
        var hungerState = this._player.getHungerState();
        display.drawText(screenWidth - hungerState.length, screenHeight, hungerState);
    },
    getScreenOffsets: function () {
        // Make sure we still have enough space to fit an entire game screen
        var topLeftX = Math.max(0, this._player.getX() - (Game.getScreenWidth() / 2));
        // Make sure we still have enough space to fit an entire game screen
        topLeftX = Math.min(topLeftX, this._player.getMap().getWidth() -
            Game.getScreenWidth());
        // Make sure the y-axis doesn't above the top bound
        var topLeftY = Math.max(0, this._player.getY() - (Game.getScreenHeight() / 2));
        // Make sure we still have enough space to fit an entire game screen
        topLeftY = Math.min(topLeftY, this._player.getMap().getHeight() - Game.getScreenHeight());
        return {
            x: topLeftX,
            y: topLeftY
        };
    },
    renderTiles: function (display) {
        var screenWidth = Game.getScreenWidth();
        var screenHeight = Game.getScreenHeight();
        var offsets = this.getScreenOffsets();
        var topLeftX = offsets.x;
        var topLeftY = offsets.y;
        // This object will keep track of all visible map cells
        var visibleCells = {};
        // Store this._player.getMap() and player's z to prevent losing it in callbacks
        var map = this._player.getMap();
        var currentDepth = this._player.getZ();
        // Find all visible cells and update the object		
        map.getFov(currentDepth).compute(
            this._player.getX(), this._player.getY(),
            this._player.getSightRadius(),
            function (x, y, radius, visibility) {
                visibleCells[x + "," + y] = true;
                // Mark cell as explored		
                map.setExplored(x, y, currentDepth, true);
            });
        // Render the explored map cells
        for (var x = topLeftX; x < topLeftX + screenWidth; x++) {
            for (var y = topLeftY; y < topLeftY + screenHeight; y++) {
                if (map.isExplored(x, y, currentDepth)) {
                    // Fetch the glyph for the tile and render it to the screen
                    // at the offset position.
                    var glyph = map.getTile(x, y, currentDepth);
                    var foreground = glyph.getForeground();
                    // If we are at a cell that is in the field of vision, we need
                    // to check if there are items or entities.
                    if (visibleCells[x + ',' + y]) {
                        // Check for entities first, since we want to draw entities over items.
                        var entity = map.getEntityAt(x, y, currentDepth);
                        if (entity) {
                            glyph = entity;
                        } else {
                            var items = map.getItemsAt(x, y, currentDepth);
                            // If we have items, we want to render the top most item
                            if (items) {
                                glyph = items[items.length - 1];
                            }
                        }
                        // Update the foreground color in case our glyph changed
                        foreground = glyph.getForeground();
                    } else {
                        // Since the tile was previously explored but is not 
                        // visible, we want to change the foreground color to
                        // dark gray.
                        foreground = 'darkGray';
                    }
                    display.draw(
                        x - topLeftX,
                        y - topLeftY,
                        glyph.getChar(),
                        foreground,
                        glyph.getBackground());
                }
            }
        }
    },
    handleInput: function (inputType, inputData) {
        // If the game is over, enter will bring the user to the losing screen.
        if (this._gameEnded) {
            if (inputType === 'keydown' && inputData.keyCode === ROT.VK_RETURN) {
                Game.switchScreen(Game.Screen.loseScreen);
            }
            // Return to make sure the user can't still play
            return;
        }
        // Handle subscreen input if there is one
        if (this._subScreen) {
            this._subScreen.handleInput(inputType, inputData);
            return;
        }
        if (inputType === 'keydown') {
            // Movement
            if (inputData.keyCode === ROT.VK_LEFT) {
                this.move(-1, 0, 0);
            } else if (inputData.keyCode === ROT.VK_RIGHT) {
                this.move(1, 0, 0);
            } else if (inputData.keyCode === ROT.VK_UP) {
                this.move(0, -1, 0);
            } else if (inputData.keyCode === ROT.VK_DOWN) {
                this.move(0, 1, 0);
            } else if (inputData.keyCode === ROT.VK_I) {
                // Show the inventory screen
                this.showItemsSubScreen(Game.Screen.inventoryScreen, this._player.getItems(),
                    'You are not carrying anything.');
                return;
            } else if (inputData.keyCode === ROT.VK_D) {
                // Show the drop screen
                this.showItemsSubScreen(Game.Screen.dropScreen, this._player.getItems(),
                    'You have nothing to drop.');
                return;
            } else if (inputData.keyCode === ROT.VK_E) {
                // Show the drop screen
                this.showItemsSubScreen(Game.Screen.eatScreen, this._player.getItems(),
                    'You have nothing to eat.');
                return;
            } else if (inputData.keyCode === ROT.VK_W) {
                if (inputData.shiftKey) {
                    // Show the wear screen
                    this.showItemsSubScreen(Game.Screen.wearScreen, this._player.getItems(),
                        'You have nothing to wear.');
                } else {
                    // Show the wield screen
                    this.showItemsSubScreen(Game.Screen.wieldScreen, this._player.getItems(),
                        'You have nothing to wield.');
                }
                return;
            } else if (inputData.keyCode === ROT.VK_X) {
                // Show the drop screen
                this.showItemsSubScreen(Game.Screen.examineScreen, this._player.getItems(),
                    'You have nothing to examine.');
                return;
            } else if (inputData.keyCode === ROT.VK_L) {
                // Setup the look screen.
                var offsets = this.getScreenOffsets();
                Game.Screen.lookScreen.setup(this._player,
                    this._player.getX(), this._player.getY(),
                    offsets.x, offsets.y);
                this.setSubScreen(Game.Screen.lookScreen);
                return;
            } else if (inputData.keyCode === ROT.VK_F) {
                // Setup the fire screen.
                var weapons = this._player.getWeapons(Game.ItemMixins.Ranged);
                if (weapons.length == 0) {
                    Game.sendMessage(this._player, "You do not have a ranged weapon equipped.");
                } else {
                    var offsets = this.getScreenOffsets();
                    Game.Screen.rangedAttackScreen.setup(this._player,
                        this._player.getX(), this._player.getY(),
                        offsets.x, offsets.y);
                    this.setSubScreen(Game.Screen.rangedAttackScreen);
                    return;
                }
            } else if (inputData.keyCode === ROT.VK_G) {
                var items = this._player.getMap().getItemsAt(this._player.getX(),
                    this._player.getY(), this._player.getZ());
                // If there is only one item, directly pick it up
                if (items && items.length === 1) {
                    var item = items[0];
                    if (this._player.pickupItems([0])) {
                        Game.sendMessage(this._player, "You pick up %s.", [item.describeA()]);
                    } else {
                        Game.sendMessage(this._player, "Your inventory is full! Nothing was picked up.");
                    }
                } else {
                    this.showItemsSubScreen(Game.Screen.pickupScreen, items,
                        'There is nothing here to pick up.');
                }
            } else if (inputData.keyCode === ROT.VK_B) {
                // Setup the butcher screen
                var items = this._player.getMap().getItemsAt(this._player.getPosition());

                if (items) {
                    var target = undefined;
                    for (let i = 0; i < items.length; i++) {
                        const item = items[i];
                        if (item.hasMixin(Game.ItemMixins.Butcherable)) {
                            target = item;
                            break;
                        }
                    }
                    if (target) {
                        var count = Game.Screen.butcherScreen.setup(this._player, target.getItems(), {
                            butcherable: target
                        });
                        if (count > 0) {
                            this.setSubScreen(Game.Screen.butcherScreen);
                        } else {
                            Game.sendMessage(this._player, "%s has been stripped bare, there is nothing left to take!", [target.describeThe(true)]);
                            Game.refresh();
                            return;
                        }
                    }
                    return;
                }

            } else if (inputData.keyCode === ROT.VK_R) {
                // Rest
                Game.Screen.restScreen.setup();
                this.setSubScreen(Game.Screen.restScreen);
                return;
            } else {
                // Not a valid key
                return;
            }
            // Unlock the engine
            this._player.getMap().getEngine().unlock();
        } else if (inputType === 'keypress') {
            var keyChar = String.fromCharCode(inputData.charCode);
            if (keyChar === '>') {
                this.move(0, 0, 1);
            } else if (keyChar === '<') {
                this.move(0, 0, -1);
            } else if (keyChar === '?') {
                // Setup the look screen.
                this.setSubScreen(Game.Screen.helpScreen);
                return;
            } else {
                // Not a valid key
                return;
            }
            // Unlock the engine
            this._player.getMap().getEngine().unlock();
        }
    },
    move: function (dX, dY, dZ) {
        var newX = this._player.getX() + dX;
        var newY = this._player.getY() + dY;
        var newZ = this._player.getZ() + dZ;
        // Try to move to the new cell
        this._player.tryMove(newX, newY, newZ, this._player.getMap());
    },
    setGameEnded: function (gameEnded) {
        this._gameEnded = gameEnded;
    },
    setSubScreen: function (subScreen) {
        this._subScreen = subScreen;
        // Refresh screen on changing the subscreen
        Game.refresh();
    },
    showItemsSubScreen: function (subScreen, items, emptyMessage) {
        if (items && subScreen.setup(this._player, items) > 0) {
            this.setSubScreen(subScreen);
        } else {
            Game.sendMessage(this._player, emptyMessage);
            Game.refresh();
        }
    }
};

// Define our winning screen
Game.Screen.winScreen = {
    enter: function () { console.log("Entered win screen."); },
    exit: function () { console.log("Exited win screen."); },
    render: function (display) {
        // Render our prompt to the screen
        for (var i = 0; i < 22; i++) {
            // Generate random background colors
            var r = Math.round(Math.random() * 255);
            var g = Math.round(Math.random() * 255);
            var b = Math.round(Math.random() * 255);
            var background = ROT.Color.toRGB([r, g, b]);
            display.drawText(2, i + 1, "%b{" + background + "}You win!");
        }
    },
    handleInput: function (inputType, inputData) {
        // Nothing to do here      
    }
};

// Define our winning screen
Game.Screen.loseScreen = {
    enter: function () { console.log("Entered lose screen."); },
    exit: function () { console.log("Exited lose screen."); },
    render: function (display) {
        // Render our prompt to the screen
        for (var i = 0; i < 22; i++) {
            display.drawText(2, i + 1, "%b{red}You lose! :(");
        }
    },
    handleInput: function (inputType, inputData) {
        // Nothing to do here      
    }
};

Game.Screen.ItemListScreen = function (template) {
    // Set up based on the template
    this._caption = template['caption'];
    this._okFunction = template['ok'];
    // By default, we use the identity function
    this._isAcceptableFunction = template['isAcceptable'] || (x => x);
    // By default, we don't preselect anything
    this._isSelectedFunction = template['isSelected'] || (x => false);
    // Whether the user can select items at all.
    this._canSelectItem = template['canSelect'];
    // Whether the user can select multiple items.
    this._canSelectMultipleItems = template['canSelectMultipleItems'];
    // Whether a 'no item' option should appear.
    this._hasNoItemOption = template['hasNoItemOption'];
};

Game.Screen.ItemListScreen.prototype.setup = function (player, items, extra) {
    this._player = player;
    // Should be called before switching to the screen.
    var count = 0;
    // Iterate over each item, keeping only the aceptable ones and counting
    // the number of acceptable items.
    var that = this;
    // Clean set of selected indices
    this._selectedIndices = {};
    this._items = items.map(function (item, index) {
        // Transform the item into null if it's not acceptable
        if (that._isAcceptableFunction(item)) {
            if (that._isSelectedFunction(item)) {
                that._selectedIndices[index] = true;
            }
            count++;
            return item;
        } else {
            return null;
        }
    });

    //Copy over extra properties
    for (var key in extra) {
        if (!this.hasOwnProperty(key)) {
            this[key] = extra[key];
        }
    }
    return count;
};

Game.Screen.ItemListScreen.prototype.render = function (display) {
    var letters = 'abcdefghijklmnopqrstuvwxyz';
    // Render the caption in the top row
    display.drawText(0, 0, this._caption);
    // Render the no item row if enabled
    if (this._hasNoItemOption) {
        display.drawText(0, 1, '0 - no item');
    }
    var row = 0;
    for (var i = 0; i < this._items.length; i++) {
        // If we have an item, we want to render it.
        if (this._items[i]) {
            // Get the letter matching the item's index
            var letter = letters.substring(i, i + 1);
            // If we have selected an item, show a +, else show a dash between
            // the letter and the item's name.
            var selectionState = (this._canSelectItem && this._canSelectMultipleItems &&
                this._selectedIndices[i]) ? '+' : '-';
            // Check if the item is worn or wielded
            var suffix = '';
            if (this._player.isEquipped(this._items[i])) {
                if (this._items[i].hasMixin(Game.ItemMixins.Wearable)) {
                    suffix = ' (wearing)';
                } else if (this._items[i].hasMixin('Wieldable')) {
                    suffix = ' (wielding)';
                } else {
                    console.log('somehow equipped an item that is not wearable or wieldable');
                }
            }
            // Render at the correct row and add 2.
            display.drawText(0, 2 + row, letter + ' ' + selectionState + ' ' +
                this._items[i].describe() + suffix);
            row++;
        }
    }
};

Game.Screen.ItemListScreen.prototype.executeOkFunction = function () {
    // Gather the selected and not selected items.
    var selectedItems = {};
    var unSelectedItems = {};
    for (const key in this._items) {
        if (!this._items.hasOwnProperty(key) || !this._items[key]) continue;
        if (this._selectedIndices[key]) {
            selectedItems[key] = this._items[key];
        } else {
            unSelectedItems[key] = this._items[key];
        }
    }
    // Switch back to the play screen.
    Game.Screen.playScreen.setSubScreen(undefined);
    // Call the OK function and end the player's turn if it return true.
    if (this._okFunction(selectedItems, unSelectedItems)) {
        this._player.getMap().getEngine().unlock();
    }
};
Game.Screen.ItemListScreen.prototype.handleInput = function (inputType, inputData) {
    if (inputType === 'keydown') {
        // If the user hit escape, hit enter and can't select an item, or hit
        // enter without any items selected, simply cancel out
        if (inputData.keyCode === ROT.VK_ESCAPE ||
            (inputData.keyCode === ROT.VK_RETURN && !this._canSelectItem)) {
            Game.Screen.playScreen.setSubScreen(undefined);
            // Handle pressing return when items are selected
        } else if (inputData.keyCode === ROT.VK_RETURN) {
            this.executeOkFunction();
            // Handle pressing zero when 'no item' selection is enabled
        } else if (this._canSelectItem && this._hasNoItemOption && inputData.keyCode === ROT.VK_0) {
            this._selectedIndices = {};
            this.executeOkFunction();
            // Handle pressing a letter if we can select
        } else if (this._canSelectItem && inputData.keyCode >= ROT.VK_A &&
            inputData.keyCode <= ROT.VK_Z) {
            // Check if it maps to a valid item by subtracting 'a' from the character
            // to know what letter of the alphabet we used.
            var index = inputData.keyCode - ROT.VK_A;
            if (this._items[index]) {
                // If multiple selection is allowed, toggle the selection status, else
                // select the item and exit the screen
                if (this._canSelectMultipleItems) {
                    if (this._selectedIndices[index]) {
                        delete this._selectedIndices[index];
                    } else {
                        this._selectedIndices[index] = true;
                    }
                    // Redraw screen
                    Game.refresh();
                } else {
                    this._selectedIndices[index] = true;
                    this.executeOkFunction();
                }
            }
        }
    }
};

Game.Screen.inventoryScreen = new Game.Screen.ItemListScreen({
    caption: 'Inventory',
    canSelect: false
});

Game.Screen.pickupScreen = new Game.Screen.ItemListScreen({
    caption: 'Choose the items you wish to pickup',
    canSelect: true,
    canSelectMultipleItems: true,
    ok: function (selectedItems) {
        // Try to pick up all items, messaging the player if they couldn't all be
        // picked up.
        if (!this._player.pickupItems(Object.keys(selectedItems))) {
            Game.sendMessage(this._player, "Your inventory is full! Not all items were picked up.");
        }
        return true;
    }
});

Game.Screen.dropScreen = new Game.Screen.ItemListScreen({
    caption: 'Choose the item you wish to drop',
    canSelect: true,
    canSelectMultipleItems: false,
    ok: function (selectedItems) {
        // Drop the selected item
        this._player.dropItem(Object.keys(selectedItems)[0]);
        return true;
    }
});

Game.Screen.eatScreen = new Game.Screen.ItemListScreen({
    caption: 'Choose the item you wish to eat',
    canSelect: true,
    canSelectMultipleItems: false,
    isAcceptable: function (item) {
        return item && item.hasMixin('Edible');
    },
    ok: function (selectedItems) {
        // Eat the item, removing it if there are no consumptions remaining.
        var key = Object.keys(selectedItems)[0];
        var item = selectedItems[key];
        Game.sendMessage(this._player, "You eat %s.", [item.describeThe()]);
        item.eat(this._player);
        if (!item.hasRemainingConsumptions()) {
            this._player.removeItem(key);
        }
        return true;
    }
});

// todo you can currently wield multiple items,
// if they fit in the same slots the last one will end up equipped
Game.Screen.wieldScreen = new Game.Screen.ItemListScreen({
    caption: 'Choose the item you wish to wield',
    canSelect: true,
    canSelectMultipleItems: true,
    isAcceptable: function (item) {
        return item && item.hasMixin('Wieldable');
    },
    isSelected: function (item) {
        return item && this._player.isEquipped(item);
    },
    ok: function (selectedItems, unSelectedItems) {
        for (const key in selectedItems) {
            const item = selectedItems[key];
            if (!this._player.isEquipped(item)) {
                this._player.equip(item);
                Game.sendMessage(this._player, "You wield %s.", [item.describeThe()]);
            }
        }

        for (const key in unSelectedItems) {
            const item = unSelectedItems[key];
            if (this._player.isEquipped(item)) {
                this._player.unequip(item);
                Game.sendMessage(this._player, "You put away %s.", [item.describeThe()]);
            }
        }
        return true;
    }
});

// todo you can currently wear multiple items,
// if they fit in the same slots the last one will end up equipped
Game.Screen.wearScreen = new Game.Screen.ItemListScreen({
    caption: 'Choose the item you wish to wear',
    canSelect: true,
    canSelectMultipleItems: true,
    isAcceptable: function (item) {
        return item && item.hasMixin('Wearable');
    },
    isSelected: function (item) {
        return this._player.isEquipped(item);
    },
    ok: function (selectedItems, unSelectedItems) {
        for (const key in selectedItems) {
            const item = selectedItems[key];
            if (!this._player.isEquipped(item)) {
                this._player.equip(item);
                Game.sendMessage(this._player, "You put on %s.", [item.describeThe()]);
            }
        }

        for (const key in unSelectedItems) {
            const item = unSelectedItems[key];
            if (this._player.isEquipped(item)) {
                this._player.unequip(item);
                Game.sendMessage(this._player, "You take off %s.", [item.describeThe()]);
            }
        }
        return true;
    }
});

Game.Screen.examineScreen = new Game.Screen.ItemListScreen({
    caption: 'Choose the item you wish to examine',
    canSelect: true,
    canSelectMultipleItems: false,
    isAcceptable: function (item) {
        return true;
    },
    ok: function (selectedItems) {
        var keys = Object.keys(selectedItems);
        if (keys.length > 0) {
            var item = selectedItems[keys[0]];
            Game.sendMessage(this._player, "It's %s (%s).",
                [
                    item.describeA(false),
                    item.details()
                ]);
        }
        return true;
    }
});

Game.Screen.gainStatScreen = {
    setup: function (entity) {
        // Must be called before rendering.
        this._entity = entity;
        this._options = entity.getStatOptions();
    },
    render: function (display) {
        var letters = 'abcdefghijklmnopqrstuvwxyz';
        display.drawText(0, 0, 'Choose a stat to increase: ');

        // Iterate through each of our options
        for (var i = 0; i < this._options.length; i++) {
            display.drawText(0, 2 + i,
                letters.substring(i, i + 1) + ' - ' + this._options[i][0]);
        }

        // Render remaining stat points
        display.drawText(0, 4 + this._options.length,
            "Remaining points: " + this._entity.getStatPoints());
    },
    handleInput: function (inputType, inputData) {
        if (inputType === 'keydown') {
            // If a letter was pressed, check if it matches to a valid option.
            if (inputData.keyCode >= ROT.VK_A && inputData.keyCode <= ROT.VK_Z) {
                // Check if it maps to a valid item by subtracting 'a' from the character
                // to know what letter of the alphabet we used.
                var index = inputData.keyCode - ROT.VK_A;
                if (this._options[index]) {
                    // Call the stat increasing function
                    this._options[index][1].call(this._entity);
                    // Decrease stat points
                    this._entity.setStatPoints(this._entity.getStatPoints() - 1);
                    // If we have no stat points left, exit the screen, else refresh
                    if (this._entity.getStatPoints() == 0) {
                        Game.Screen.playScreen.setSubScreen(undefined);
                    } else {
                        Game.refresh();
                    }
                }
            }
        }
    }
};


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

Game.Screen.lookScreen = new Game.Screen.TargetBasedScreen({
    captionFunction: function (x, y) {
        var z = this._player.getZ();
        var map = this._player.getMap();
        // If the tile is explored, we can give a better capton
        if (map.isExplored(x, y, z)) {
            // If the tile isn't explored, we have to check if we can actually 
            // see it before testing if there's an entity or item.
            if (this._visibleCells[x + ',' + y]) {
                var items = map.getItemsAt(x, y, z);
                // If we have items, we want to render the top most item
                // TODO option to see more
                if (items) {
                    var item = items[items.length - 1];
                    return String.format('%s - %s (%s)',
                        item.getRepresentation(),
                        item.describeA(true),
                        item.details());
                    // Else check if there's an entity
                } else if (map.getEntityAt(x, y, z)) {
                    var entity = map.getEntityAt(x, y, z);
                    return String.format('%s - %s (%s)',
                        entity.getRepresentation(),
                        entity.describeA(true),
                        entity.details());
                }
            }
            // If there was no entity/item or the tile wasn't visible, then use
            // the tile information.
            return String.format('%s - %s',
                map.getTile(x, y, z).getRepresentation(),
                map.getTile(x, y, z).getDescription());

        } else {
            // If the tile is not explored, show the null tile description.
            return String.format('%s - %s',
                Game.Tile.nullTile.getRepresentation(),
                Game.Tile.nullTile.getDescription());
        }
    }
});

Game.Screen.rangedAttackScreen = new Game.Screen.TargetBasedScreen({
    captionFunction: function (x, y) {
        var z = this._player.getZ();
        var map = this._player.getMap();
        // If the tile is explored, we can give a better capton
        if (map.isExplored(x, y, z)) {
            // If the tile isn't explored, we have to check if we can actually 
            // see it before testing if there's an entity or item.
            if (this._visibleCells[x + ',' + y]) {
                var entity = map.getEntityAt(x, y, z);
                if (entity && entity.hasMixin(Game.EntityMixins.Destructible)) {
                    return String.format('%s - hp: %s, defense: %s',
                        entity.describeA(true),
                        entity.getHp(),
                        entity.getDefenseValue());
                } else {
                    // If the tile is not explored, show the null tile description.
                    return 'There is nothing to fire at there';
                }
            }
        }

        return 'You cannot see there';
    },
    okFunction: function (x, y) {
        var z = this._player.getZ();
        var map = this._player.getMap();
        var entity = map.getEntityAt(x, y, z);
        if (entity) {
            this._player.rangedAttack(entity);
        } else {
            // todo put an ammunition here
        }
        return true;
    }
});

Game.Screen.restScreen = {
    setup: function () {
        this._inputString = '';
    },
    render: function (display) {
        var playScreen = Game.Screen.playScreen;
        playScreen.renderTiles.call(playScreen, display);
        display.drawText(0, Game.getScreenHeight() - 1, 'Turns to rest: ' + this._inputString);
    },
    handleInput: function (inputType, inputData) {
        // input wait time
        if (inputType == 'keydown') {
            if (inputData.keyCode === ROT.VK_RETURN) {
                var num = parseInt(this._inputString, 10);
                if (isNaN(num)) {
                    //bad number
                } else {
                    Game.Screen.playScreen._player.setBusy(true);
                    Game.Screen.waitScreen.setup({ turnsToWait: num, action: 'Resting' });
                    Game.Screen.playScreen.setSubScreen(Game.Screen.waitScreen);
                }
            } else if (inputData.keyCode === ROT.VK_BACK_SPACE) {
                this._inputString = this._inputString.slice(0, -1)
            }
        } else if (inputType == 'keypress') {
            var keyChar = String.fromCharCode(inputData.charCode);
            if (!isNaN(parseInt(keyChar))) {
                this._inputString += keyChar;
            }
        }
        Game.refresh();
    }
};

Game.Screen.butcherScreen = new Game.Screen.ItemListScreen({
    caption: 'What do you want to butcher?',
    canSelect: true,
    canSelectMultipleItems: true,
    ok: function (selectedItems) {
        var keys = Object.keys(selectedItems);
        if (!this._player.canAddItems(keys.length)) {
            Game.sendMessage(this._player, "You cannot hold that many items!");
        }
        var player = this._player;
        var butcherable = this.butcherable;
        //todo variable time for butchering
        Game.Screen.waitScreen.setup({
            turnsToWait: keys.length * 5,
            action: 'Butchering',
            onComplete: function () {
                for (let i = 0; i < keys.length; i++) {
                    const item = selectedItems[keys[i]];
                    if (player.addItem(item)) {
                        Game.sendMessage(player, "You pick up %s.", [item.describeA()]);
                        if (!butcherable.removeItem(item)) {
                            console.log('failed to remove item after butchering');
                        }
                    } else {
                        Game.sendMessage(player, "Your inventory is full! Some items have been dropped");
                    }
                }
            }
        });
        Game.Screen.playScreen.setSubScreen(Game.Screen.waitScreen);
        return true;
    }
});

Game.Screen.waitScreen = {
    setup: function (template) {
        this._turnsToWait = template['turnsToWait'] || 0;
        this._action = template['action'] || 'Waiting';
        this._onComplete = template['onComplete'] || function () { };
        this._exiting = false;
        this._cancel = false;
    },
    render: function (display) {
        var playScreen = Game.Screen.playScreen;
        playScreen.renderTiles.call(playScreen, display);

        //Check for seen attackers
        // todo replace with check for hostiles
        var seenEnemies = playScreen._player.seenEntitiesWith(Game.EntityMixins.Attacker);

        var alerts = playScreen._player.getAlerts();

        display.drawText(0, Game.getScreenHeight() - 1, vsprintf('%s for %s turns...', [this._action, this._turnsToWait]));

        // Escape from screen
        if (seenEnemies.length > 0) {
            this._exiting = true;
            Game.sendMessage(playScreen._player, '%s interrupted by %s!', [this._action, seenEnemies[0].describeA()]);
        }
        if (alerts.length > 0) {
            this._exiting = true;
            Game.sendMessage(playScreen._player, '%s interrupted because %s!', [this._action, alerts.join(', ')]);
        }
        if (this._cancel) {
            this._exiting = true;
            Game.sendMessage(playScreen._player, '%s canceled', [this._action]);
        }
        if (this._turnsToWait <= 0) {
            this._exiting = true;
            this._onComplete();
        }
        if (this._exiting) {
            Game.Screen.playScreen.setSubScreen(null);
        }
        else {
            // delay unlocking to slow down the speed
            setTimeout(() => {
                this._turnsToWait--;

                if (!this._exiting) playScreen._player.getMap().getEngine().unlock();
            }, 100);
        }
    },
    handleInput: function (inputType, inputData) {
        //cancel
        if (inputType == 'keydown') {
            this._cancel = true;
        }
        return;
    }
};

// Define our help screen
Game.Screen.helpScreen = {
    render: function (display) {
        var text = 'Help';
        var border = '-------------';
        var y = 1;
        display.drawText(Game.getScreenWidth() / 2 - text.length / 2, y++, text);
        display.drawText(Game.getScreenWidth() / 2 - border.length / 2, y++, border);
        y += 2;
        display.drawText(3, y++, '[g] to get items');
        display.drawText(3, y++, '[d] to drop items');
        display.drawText(3, y++, '[e] to eat items');
        display.drawText(3, y++, '[b] to butcher a corpse');
        display.drawText(3, y++, '[w] to wield items');
        display.drawText(3, y++, '[W] to wear items');
        display.drawText(3, y++, '[x] to examine items');
        display.drawText(3, y++, '[l] to look around you');
        display.drawText(3, y++, '[r] to rest for a time');
        display.drawText(3, y++, '[?] to show this help screen');
        y += 3;
        text = '--- press any key to continue ---';
        display.drawText(Game.getScreenWidth() / 2 - text.length / 2, y++, text);
    },
    handleInput: function (inputType, inputData) {
        Game.Screen.playScreen.setSubScreen(null);
    }
};