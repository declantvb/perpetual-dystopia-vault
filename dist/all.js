var Game =  {
	_display: null,
    _currentScreen: null,
    _screenWidth: 80,
    _screenHeight: 24,
	init: function() {
        // Any necessary initialization will go here.
        this._display = new ROT.Display({width: this._screenWidth,
                                         height: this._screenHeight + 1});
        // Create a helper function for binding to an event
        // and making it send it to the screen
        var game = this; // So that we don't lose this
        var bindEventToScreen = function(event) {
            window.addEventListener(event, function(e) {
                // When an event is received, send it to the
                // screen if there is one
                if (game._currentScreen !== null) {
                    // Send the event type and data to the screen
                    game._currentScreen.handleInput(event, e);
                }
            });
        };
        // Bind keyboard input events
        bindEventToScreen('keydown');
        //bindEventToScreen('keyup');
        bindEventToScreen('keypress');
    },
	getDisplay: function() {
		return this._display;
	},
	getScreenWidth: function() {
    return this._screenWidth;
	},
	getScreenHeight: function() {
	    return this._screenHeight;
	},
    refresh: function() {
        // Clear the screen
        this._display.clear();
        // Render the screen
        this._currentScreen.render(this._display);
    },
	switchScreen: function(screen) {
        // If we had a screen before, notify it that we exited
        if (this._currentScreen !== null) {
            this._currentScreen.exit();
        }
        // Clear the display
        this._display.clear();
        // Update our current screen, notify it we entered
        // and then render it
        this._currentScreen = screen;
        if (!this._currentScreen !== null) {
            this._currentScreen.enter();
            this.refresh();
        }
    }
};

window.onload = function() {
    // Check if rot.js can work on this browser
    if (!ROT.isSupported()) {
        alert("The rot.js library isn't supported by your browser.");
    } else {
        // Initialize the game
        Game.init();
        // Add the container to our HTML page
        document.body.appendChild(Game.getDisplay().getContainer());
        // Load the start screen
        Game.switchScreen(Game.Screen.startScreen);
    }
};
Game.extend = function(src, dest) {
    // Create a copy of the source.
    var result = {};
    for (var key in src) {
        result[key] = src[key];
    }
    // Copy over all keys from dest
    for (var key in dest) {
        result[key] = dest[key];
    }
    return result;
};

Game.Geometry = {
    getLine: function(startX, startY, endX, endY) {
        var points = [];
        var dx = Math.abs(endX - startX);
        var dy = Math.abs(endY - startY);
        var sx = (startX < endX) ? 1 : -1;
        var sy = (startY < endY) ? 1 : -1;
        var err = dx - dy;
        var e2;

        while (true) {
            points.push({x: startX, y: startY});
            if (startX == endX && startY == endY) {
                break;
            }
            e2 = err * 2;
            if (e2 > -dx) {
                err -= dy;
                startX += sx;
            }
            if (e2 < dx){
                err += dx;
                startY += sy;
            }
        }

        return points;
    }
};

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
                // Show the wear/wield screen
                this.showItemsSubScreen(Game.Screen.equipScreen, this._player.getItems(),
                    'You have nothing to wear or wield.');
                return;
            } else if (inputData.keyCode === ROT.VK_T) {
                // Show the equipment screen
                this.showItemsSubScreen(Game.Screen.unequipScreen, this._player.getEquippedItems(),
                    'You have nothing equipped.');
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
                    if (this._player.addItem(item)) {
                        Game.sendMessage(this._player, "You pick up %s.", [item.describeA()]);
                        this._player.getMap().setItemsAt(this._player.getX(), this._player.getY(), this._player.getZ(), []);
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
    // Whether the user can select items at all.
    this._canSelectItem = template['canSelect'];
    // Whether the user can select multiple items.
    this._canSelectMultipleItems = template['canSelectMultipleItems'];
    // Whether a 'no item' option should appear.
    this._hasNoItemOption = template['hasNoItemOption'];
};

Game.Screen.ItemListScreen.prototype.setup = function (player, items, extra) {
    this._player = player;
    this._map = player.getMap();
    // Should be called before switching to the screen.
    var count = 0;
    // Iterate over each item, keeping only the acceptable ones and counting
    // the number of acceptable items.
    var that = this;
    this._items = items.map(function (item, index) {
        // Transform the item into null if it's not acceptable
        if (that._isAcceptableFunction(item)) {
            count++;
            return item;
        } else {
            return null;
        }
    });

    // 2d jagged array
    this._groupedItems = [];
    this._items.forEach(item => {
        // blank item, ignore
        if (!item) return;

        for (let i = 0; i < that._groupedItems.length; i++) {
            const savedItem = that._groupedItems[i];
            if (item.stackableWith(that._groupedItems[i][0])) {
                that._groupedItems[i].push(item);
                return;
            }
        }

        // else
        that._groupedItems.push([item]);
    });

    // Clean set of selected indices
    this._selectedIndices = {};

    //Copy over extra properties
    for (var key in extra) {
        this[key] = extra[key];
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
    for (var i = 0; i < this._groupedItems.length; i++) {
        // Get the letter matching the item's index
        var letter = letters.substring(i, i + 1);
        // If we have selected an item, show a +, else show a dash between
        // the letter and the item's name.
        var selectionState = (this._canSelectItem && this._canSelectMultipleItems &&
            this._selectedIndices[i]) ? '+' : '-';

        // if the item is a group, show the count
        var prefix = '';
        if (this._groupedItems[i].length > 1) {
            prefix = this._groupedItems[i].length + ' ';
        }

        // Render at the correct row and add 2.
        display.drawText(0, 2 + row, vsprintf('%s %s %s', [letter, selectionState, prefix + this._groupedItems[i][0].describe(false, this._groupedItems[i].length > 1)]));
        row++;
    }
};

Game.Screen.ItemListScreen.prototype.executeOkFunction = function () {
    // Gather the selected and not selected items.
    var selectedGroups = {};
    var unSelectedGroups = {};
    for (const key in this._groupedItems) {
        if (!this._groupedItems.hasOwnProperty(key) || !this._groupedItems[key]) continue;
        if (this._selectedIndices[key]) {
            selectedGroups[key] = this._groupedItems[key];
        } else {
            unSelectedGroups[key] = this._groupedItems[key];
        }
    }
    // Switch back to the play screen.
    Game.Screen.playScreen.setSubScreen(undefined);
    // Call the OK function and end the player's turn if it return true.
    if (this._okFunction(selectedGroups, unSelectedGroups)) {
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
            if (this._groupedItems[index]) {
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
    ok: function (selectedGroups, unSelectedGroups) {
        //try add all, if can't add, put back on ground
        var remaining = [];
        for (const groupKey in selectedGroups) {
            if (selectedGroups.hasOwnProperty(groupKey)) {
                const group = selectedGroups[groupKey];
                group.forEach(item => {
                    if (!this._player.addItem(item)) {
                        remaining.push(item);
                    }
                });
            }
        }

        if (remaining.length > 0) {
            Game.sendMessage(this._player, "Your inventory is full! Not all items were picked up.");
        }

        // add back the unselected items
        for (const groupKey in unSelectedGroups) {
            if (unSelectedGroups.hasOwnProperty(groupKey)) {
                const group = unSelectedGroups[groupKey];
                group.forEach(item => {
                    remaining.push(item);
                });
            }
        }

        // put the remaining back down
        this._map.setItemsAt(this._player.getX(), this._player.getY(), this._player.getZ(), remaining);
        return true;
    }
});

Game.Screen.dropScreen = new Game.Screen.ItemListScreen({
    caption: 'Choose the item you wish to drop',
    canSelect: true,
    canSelectMultipleItems: false,
    ok: function (selectedGroups) {
        // Drop the selected item
        var items = selectedGroups[Object.keys(selectedGroups)[0]];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            this._player.removeItem(item);
            this._map.addItem(this._player.getX(), this._player.getY(), this._player.getZ(), item);
        }
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
    ok: function (selectedGroups) {
        // Eat the item, removing it if there are no consumptions remaining.
        var group = selectedGroups[Object.keys(selectedGroups)[0]];
        var item = group[0];
        Game.sendMessage(this._player, "You eat %s.", [item.describeThe()]);
        item.eat(this._player);
        if (!item.hasRemainingConsumptions()) {
            this._player.removeItem(item);
        }
        return true;
    }
});

// todo you can currently wear/wield multiple items,
// if they fit in the same slots the last one will end up equipped
Game.Screen.equipScreen = new Game.Screen.ItemListScreen({
    caption: 'Choose the item you wish to equip',
    canSelect: true,
    canSelectMultipleItems: true,
    isAcceptable: function (item) {
        return item && item.hasMixin('Equippable');
    },
    ok: function (selectedGroups, unSelectedGroups) {
        for (const key in selectedGroups) {
            const group = selectedGroups[key];
            const item = group[0];
            if (!this._player.isEquipped(item)) {
                this._player.equip(item);
                this._player.removeItem(item);
                Game.sendMessage(this._player, "You equip %s.", [item.describeThe()]);
            }
        }
        return true;
    }
});

Game.Screen.unequipScreen = new Game.Screen.ItemListScreen({
    caption: 'Choose the item you wish to unequip',
    canSelect: true,
    canSelectMultipleItems: true,
    ok: function (selectedGroups, unSelectedGroups) {
        for (const key in selectedGroups) {
            const group = selectedGroups[key];
            const item = group[0];
            if (this._player.isEquipped(item)) {
                this._player.addItem(item);
                this._player.unequip(item);
                Game.sendMessage(this._player, "You put away %s.", [item.describeThe()]);
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
    ok: function (selectedGroups) {
        var keys = Object.keys(selectedGroups);
        if (keys.length > 0) {
            var group = selectedGroups[keys[0]];
            item = group[0];
            if (group.length == 1) {
                Game.sendMessage(this._player, "It's %s (%s).",
                [
                    item.describeA(false),
                    item.details()
                ]);
            } else if (group.length > 1) {
                Game.sendMessage(this._player, "It's %s %s (%s).",
                [
                    group.length,
                    item.describe(false, true),
                    item.details()
                ]); 
            }
        }
        return true;
    }
});

Game.Screen.butcherScreen = new Game.Screen.ItemListScreen({
    caption: 'What do you want to butcher?',
    canSelect: true,
    canSelectMultipleItems: true,
    ok: function (selectedGroups) {
        var keys = Object.keys(selectedGroups);
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
                var remaining = [];
                for (let i = 0; i < keys.length; i++) {
                    const group = selectedGroups[keys[i]];
                    var count = 0;
                    group.forEach(item => {
                        if (!butcherable.removeItem(item)) {
                            console.log('failed to remove item when butchering');
                        }
                        if (player.addItem(item)) {
                            count++;
                        } else {
                            remaining.push(item);
                        }
                    });
                    if (count == 1) {
                        Game.sendMessage(player, "You pick up %s.", [group[0].describeA()]);
                    } else if (count > 1) {
                        Game.sendMessage(player, "You pick up %s %s.", [count, group[0].describe(false, true)]);
                    }
                }
                if (remaining.length > 0) {
                    Game.sendMessage(player, "Your inventory is full! Some items have been dropped");
                    player.getMap().setItemsAt(player.getX(), player.getY(), player.getZ(), remaining);
                }
            }
        });
        Game.Screen.playScreen.setSubScreen(Game.Screen.waitScreen);
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
        display.drawText(3, y++, '[i] to show inventory');
        display.drawText(3, y++, '[f] to fire a ranged weapon');
        display.drawText(3, y++, '[b] to butcher a corpse');
        display.drawText(3, y++, '[w] to wear or wield items');
        display.drawText(3, y++, '[t] to take off items');
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
Game.Builder = function(width, height, depth) {
    this._width = width;
    this._height = height;
    this._depth = depth;
    this._tiles = new Array(depth);
    this._regions = new Array(depth);
    // Instantiate the arrays to be multi-dimension
    for (var z = 0; z < depth; z++) {
        // Create a new cave at each level
        this._tiles[z] = this._generateLevel();
        // Setup the regions array for each depth
        this._regions[z] = new Array(width);
        for (var x = 0; x < width; x++) {
            this._regions[z][x] = new Array(height);
            // Fill with zeroes
            for (var y = 0; y < height; y++) {
                this._regions[z][x][y] = 0;
            }
        }
    }
    for (var z = 0; z < this._depth; z++) {
        this._setupRegions(z);
    }
    this._connectAllRegions();
};

Game.Builder.prototype.getTiles = function () {
    return this._tiles;
};
Game.Builder.prototype.getDepth = function () {
    return this._depth;
};
Game.Builder.prototype.getWidth = function () {
    return this._width;
};
Game.Builder.prototype.getHeight = function () {
    return this._height;
};

Game.Builder.prototype._generateLevel = function() {
    // Create the empty map
    var map = new Array(this._width);
    for (var w = 0; w < this._width; w++) {
        map[w] = new Array(this._height);
    }
    // Setup the cave generator
    var generator = new ROT.Map.Cellular(this._width, this._height);
    generator.randomize(0.5);
    var totalIterations = 3;
    // Iteratively smoothen the map
    for (var i = 0; i < totalIterations - 1; i++) {
        generator.create();
    }
    // Smoothen it one last time and then update our map
    generator.create(function(x,y,v) {
        if (v === 1) {
            map[x][y] = Game.Tile.floorTile;
        } else {
            map[x][y] = Game.Tile.wallTile;
        }
    });
    return map;
};

Game.Builder.prototype._canFillRegion = function(x, y, z) {
    // Make sure the tile is within bounds
    if (x < 0 || y < 0 || z < 0 || x >= this._width ||
        y >= this._height || z >= this._depth) {
        return false;
    }
    // Make sure the tile does not already have a region
    if (this._regions[z][x][y] != 0) {
        return false;
    }
    // Make sure the tile is walkable
    return this._tiles[z][x][y].isWalkable();
};

Game.Builder.prototype._fillRegion = function(region, x, y, z) {
    var tilesFilled = 1;
    var tiles = [{x:x, y:y}];
    var tile;
    var neighbors;
    // Update the region of the original tile
    this._regions[z][x][y] = region;
    // Keep looping while we still have tiles to process
    while (tiles.length > 0) {
        tile = tiles.pop();
        // Get the neighbors of the tile
        neighbors = Game.getNeighborPositions(tile.x, tile.y);
        // Iterate through each neighbor, checking if we can use it to fill
        // and if so updating the region and adding it to our processing
        // list.
        while (neighbors.length > 0) {
            tile = neighbors.pop();
            if (this._canFillRegion(tile.x, tile.y, z)) {
                this._regions[z][tile.x][tile.y] = region;
                tiles.push(tile);
                tilesFilled++;
            }
        }

    }
    return tilesFilled;
};

// This removes all tiles at a given depth level with a region number.
// It fills the tiles with a wall tile.
Game.Builder.prototype._removeRegion = function(region, z) {
    for (var x = 0; x < this._width; x++) {
        for (var y = 0; y < this._height; y++) {
            if (this._regions[z][x][y] == region) {
                // Clear the region and set the tile to a wall tile
                this._regions[z][x][y] = 0;
                this._tiles[z][x][y] = Game.Tile.wallTile;
            }
        }
    }
};

// This sets up the regions for a given depth level.
Game.Builder.prototype._setupRegions = function(z) {
    var region = 1;
    var tilesFilled;
    // Iterate through all tiles searching for a tile that
    // can be used as the starting point for a flood fill
    for (var x = 0; x < this._width; x++) {
        for (var y = 0; y < this._height; y++) {
            if (this._canFillRegion(x, y, z)) {
                // Try to fill
                tilesFilled = this._fillRegion(region, x, y, z);
                // If it was too small, simply remove it
                if (tilesFilled <= 20) {
                    this._removeRegion(region, z);
                } else {
                    region++;
                }
            }
        }
    }
};

// This fetches a list of points that overlap between one
// region at a given depth level and a region at a level beneath it.
Game.Builder.prototype._findRegionOverlaps = function(z, r1, r2) {
    var matches = [];
    // Iterate through all tiles, checking if they respect
    // the region constraints and are floor tiles. We check
    // that they are floor to make sure we don't try to
    // put two stairs on the same tile.
    for (var x = 0; x < this._width; x++) {
        for (var y = 0; y < this._height; y++) {
            if (this._tiles[z][x][y]  == Game.Tile.floorTile &&
                this._tiles[z+1][x][y] == Game.Tile.floorTile &&
                this._regions[z][x][y] == r1 &&
                this._regions[z+1][x][y] == r2) {
                matches.push({x: x, y: y});
            }
        }
    }
    // We shuffle the list of matches to prevent bias
    return matches.randomize();
};

// This tries to connect two regions by calculating 
// where they overlap and adding stairs
Game.Builder.prototype._connectRegions = function(z, r1, r2) {
    var overlap = this._findRegionOverlaps(z, r1, r2);
    // Make sure there was overlap
    if (overlap.length == 0) {
        return false;
    }
    // Select the first tile from the overlap and change it to stairs
    var point = overlap[0];
    this._tiles[z][point.x][point.y] = Game.Tile.stairsDownTile;
    this._tiles[z+1][point.x][point.y] = Game.Tile.stairsUpTile;
    return true;
};

// This tries to connect all regions for each depth level,
// starting from the top most depth level.
Game.Builder.prototype._connectAllRegions = function() {
    for (var z = 0; z < this._depth - 1; z++) {
        // Iterate through each tile, and if we haven't tried
        // to connect the region of that tile on both depth levels
        // then we try. We store connected properties as strings
        // for quick lookups.
        var connected = {};
        var key;
        for (var x = 0; x < this._width; x++) {
            for (var y = 0; y < this._height; y++) {
                key = this._regions[z][x][y] + ',' +
                      this._regions[z+1][x][y];
                if (this._tiles[z][x][y] == Game.Tile.floorTile &&
                    this._tiles[z+1][x][y] == Game.Tile.floorTile &&
                    !connected[key]) {
                    // Since both tiles are floors and we haven't 
                    // already connected the two regions, try now.
                    this._connectRegions(z, this._regions[z][x][y],
                        this._regions[z+1][x][y]);
                    connected[key] = true;
                }
            }
        }
    }
};
Game.Map = function (tiles) {
    this._tiles = tiles;
    // Cache dimensions
    this._depth = tiles.length
    this._width = tiles[0].length;
    this._height = tiles[0][0].length;
    // Setup the field of visions
    this._fov = [];
    this.setupFov();
    // Create a table which will hold the entities
    this._entities = {};
    // Create a table which will hold the items
    this._items = {};
    // Create the engine and scheduler
    this._scheduler = new ROT.Scheduler.Speed();
    this._engine = new ROT.Engine(this._scheduler);
    // Add the item update actor
    this._scheduler.add({
        _map: this,
        name: 'Item Updater',
        act: function () {
            for (key in this._map._items) {
                var items = this._map._items[key];
                items.forEach(item => {
                    item.raiseEvent('update');
                });
            }
        },
        getSpeed: function () {
            return 1000;
        },
    }, true);
    // Setup the explored array
    this._explored = new Array(this._depth);
    this._setupExploredArray();
};

Game.Map.prototype._setupExploredArray = function () {
    for (var z = 0; z < this._depth; z++) {
        this._explored[z] = new Array(this._width);
        for (var x = 0; x < this._width; x++) {
            this._explored[z][x] = new Array(this._height);
            for (var y = 0; y < this._height; y++) {
                this._explored[z][x][y] = false;
            }
        }
    }
};

// Standard getters
Game.Map.prototype.getDepth = function () {
    return this._depth;
};
Game.Map.prototype.getWidth = function () {
    return this._width;
};
Game.Map.prototype.getHeight = function () {
    return this._height;
};

// Gets the tile for a given coordinate set
Game.Map.prototype.getTile = function (x, y, z) {
    // Make sure we are inside the bounds. If we aren't, return
    // null tile.
    if (x < 0 || x >= this._width || y < 0 || y >= this._height ||
        z < 0 || z >= this._depth) {
        return Game.Tile.nullTile;
    } else {
        return this._tiles[z][x][y] || Game.Tile.nullTile;
    }
};

Game.Map.prototype.dig = function (x, y, z) {
    // If the tile is diggable, update it to a floor
    if (this.getTile(x, y, z).isDiggable()) {
        this._tiles[z][x][y] = Game.Tile.floorTile;
    }
};

Game.Map.prototype.isEmptyFloor = function (x, y, z) {
    // Check if the tile is floor and also has no entity
    return this.getTile(x, y, z) == Game.Tile.floorTile &&
        !this.getEntityAt(x, y, z);
};

Game.Map.prototype.setExplored = function (x, y, z, state) {
    // Only update if the tile is within bounds
    if (this.getTile(x, y, z) !== Game.Tile.nullTile) {
        this._explored[z][x][y] = state;
    }
};

Game.Map.prototype.isExplored = function (x, y, z) {
    // Only return the value if within bounds
    if (this.getTile(x, y, z) !== Game.Tile.nullTile) {
        return this._explored[z][x][y];
    } else {
        return false;
    }
};

Game.Map.prototype.setupFov = function () {
    // Keep this in 'map' variable so that we don't lose it.
    var map = this;
    // Iterate through each depth level, setting up the field of vision
    for (var z = 0; z < this._depth; z++) {
        // We have to put the following code in it's own scope to prevent the
        // depth variable from being hoisted out of the loop.
        (function () {
            // For each depth, we need to create a callback which figures out
            // if light can pass through a given tile.
            var depth = z;
            map._fov.push(
                new ROT.FOV.DiscreteShadowcasting(function (x, y) {
                    return !map.getTile(x, y, depth).isBlockingLight();
                }, { topology: 4 }));
        })();
    }
};

Game.Map.prototype.getFov = function (depth) {
    return this._fov[depth];
};

Game.Map.prototype.getEngine = function () {
    return this._engine;
};
Game.Map.prototype.getEntities = function () {
    return this._entities;
};
Game.Map.prototype.getEntityAt = function (x, y, z) {
    // Get the entity based on position key 
    return this._entities[x + ',' + y + ',' + z];
};
Game.Map.prototype.getEntitiesWithinRadius = function (centerX, centerY,
    centerZ, radius) {
    results = [];
    // Determine our bounds
    var leftX = centerX - radius;
    var rightX = centerX + radius;
    var topY = centerY - radius;
    var bottomY = centerY + radius;
    // Iterate through our entities, adding any which are within the bounds
    for (var key in this._entities) {
        var entity = this._entities[key];
        if (entity.getX() >= leftX && entity.getX() <= rightX &&
            entity.getY() >= topY && entity.getY() <= bottomY &&
            entity.getZ() == centerZ) {
            results.push(entity);
        }
    }
    return results;
};

Game.Map.prototype.getRandomFloorPosition = function (z) {
    // Randomly generate a tile which is a floor
    var x, y;
    do {
        x = Math.floor(Math.random() * this._width);
        y = Math.floor(Math.random() * this._height);
    } while (!this.isEmptyFloor(x, y, z));
    return { x: x, y: y, z: z };
};

Game.Map.prototype.addEntityAtRandomPosition = function (entity, z) {
    var position = this.getRandomFloorPosition(z);
    entity.setX(position.x);
    entity.setY(position.y);
    entity.setZ(position.z);
    this.addEntity(entity);
};

Game.Map.prototype.addEntity = function (entity) {
    // Update the entity's map
    entity.setMap(this);
    // Update the map with the entity's position
    this.updateEntityPosition(entity);
    // Check if this entity is an actor, and if so add
    // them to the scheduler
    if (entity.hasMixin('Actor')) {
        this._scheduler.add(entity, true);
    }
    // If the entity is the player, set the player.
    if (entity.hasMixin(Game.EntityMixins.PlayerActor)) {
        this._player = entity;
    }
};

Game.Map.prototype.removeEntity = function (entity) {
    // Remove the entity from the map
    var key = entity.getX() + ',' + entity.getY() + ',' + entity.getZ();
    if (this._entities[key] == entity) {
        delete this._entities[key];
    }
    // If the entity is an actor, remove them from the scheduler
    if (entity.hasMixin('Actor')) {
        this._scheduler.remove(entity);
    }
    // If the entity is the player, update the player field.
    if (entity.hasMixin(Game.EntityMixins.PlayerActor)) {
        this._player = undefined;
    }
};

Game.Map.prototype.removeItem = function (item) {
    // Remove the item from the map
    var key = item.getX() + ',' + item.getY() + ',' + item.getZ();
    var mapItems = this._items[key];
    for (let i = 0; i < mapItems.length; i++) {
        const mapItem = mapItems[i];
        if (mapItem == item) {
            mapItems.splice(i, 1);
        }
    }
    if (mapItems.length === 0) {
        if (this._items[key]) {
            delete this._items[key];
        }
    }
};


Game.Map.prototype.updateEntityPosition = function (
    entity, oldX, oldY, oldZ) {
    // Delete the old key if it is the same entity
    // and we have old positions.
    if (typeof oldX === 'number') {
        var oldKey = oldX + ',' + oldY + ',' + oldZ;
        if (this._entities[oldKey] == entity) {
            delete this._entities[oldKey];
        }
    }
    // Make sure the entity's position is within bounds
    if (entity.getX() < 0 || entity.getX() >= this._width ||
        entity.getY() < 0 || entity.getY() >= this._height ||
        entity.getZ() < 0 || entity.getZ() >= this._depth) {
        throw new Error("Entity's position is out of bounds.");
    }
    // Sanity check to make sure there is no entity at the new position.
    var key = entity.getX() + ',' + entity.getY() + ',' + entity.getZ();
    if (this._entities[key]) {
        throw new Error('Tried to add an entity at an occupied position.');
    }
    // Add the entity to the table of entities
    this._entities[key] = entity;
};

Game.Map.prototype.getItemsAt = function (x, y, z) {
    if (typeof x == 'object') {
        return this._items[x.x + ',' + x.y + ',' + x.z]
    } else {
        return this._items[x + ',' + y + ',' + z];
    }
};
Game.Map.prototype.getItemsWithinRadius = function (centerX, centerY,
    centerZ, radius) {
    results = [];
    // Determine our bounds
    var leftX = centerX - radius;
    var rightX = centerX + radius;
    var topY = centerY - radius;
    var bottomY = centerY + radius;
    // Iterate through our entities, adding any which are within the bounds
    for (var key in this._items) {
        var item = this._items[key];
        if (item.getX() >= leftX && item.getX() <= rightX &&
            item.getY() >= topY && item.getY() <= bottomY &&
            item.getZ() == centerZ) {
            results.push(item);
        }
    }
    return results;
};

Game.Map.prototype.setItemsAt = function (x, y, z, items) {
    // If our items array is empty, then delete the key from the table.
    var key = x + ',' + y + ',' + z;
    if (items.length === 0) {
        if (this._items[key]) {
            delete this._items[key];
        }
    } else {
        // Simply update the items at that key
        this._items[key] = items;
    }
};

Game.Map.prototype.addItem = function (x, y, z, item) {
    // Update item's internal store
    item.setPosition({ x: x, y: y, z: z });
    item.setMap(this);

    // If we already have items at that position, simply append the item to the 
    // list of items.
    var key = x + ',' + y + ',' + z;
    if (this._items[key]) {
        this._items[key].push(item);
    } else {
        this._items[key] = [item];
    }
};

Game.Map.prototype.addItemAtRandomPosition = function (item, z) {
    var position = this.getRandomFloorPosition(z);
    this.addItem(position.x, position.y, position.z, item);
};

Game.Map.prototype.getPlayer = function () {
    return this._player;
};
Game.Glyph = function(properties) {
    // Instantiate properties to default if they weren't passed
    properties = properties || {};
    this._char = properties['character'] || ' ';
    this._foreground = properties['foreground'] || 'white';
    this._background = properties['background'] || 'black';
};

// Create standard getters for glyphs
Game.Glyph.prototype.getChar = function(){ 
    return this._char; 
};
Game.Glyph.prototype.getBackground = function(){
    return this._background;
};
Game.Glyph.prototype.getForeground = function(){ 
    return this._foreground; 
};
Game.Glyph.prototype.getRepresentation = function() {
    return '%c{' + this._foreground + '}%b{' + this._background + '}' + this._char +
        '%c{white}%b{black}';
};

Game.Glyph.unknown = new Game.Glyph({});
Game.DynamicGlyph = function (properties) {
    properties = properties || {};
    // Call the glyph's construtor with our set of properties
    Game.Glyph.call(this, properties);
    // Instantiate any properties from the passed object
    this._name = properties['name'] || '';
    this._pluralName = properties['pluralName'] || this._name + 's';
    // Create an object which will keep track what mixins we have
    // attached to this entity based on the name property
    this._attachedMixins = {};
    // Create a similar object for groups
    this._attachedMixinGroups = {};
    // Set up an object for listeners
    this._listeners = {};
    // Setup the object's mixins
    var mixins = properties['mixins'] || [];
    for (var i = 0; i < mixins.length; i++) {
        // Copy over all properties from each mixin as long
        // as it's not the name, init, or listeners property. We
        // also make sure not to override a property that
        // already exists on the entity.
        for (var key in mixins[i]) {
            if (key != 'init' && key != 'name' && key != 'listeners' && key != 'groupName'
                && !this.hasOwnProperty(key)) {
                this[key] = mixins[i][key];
            }
        }
        // Add the name of this mixin to our attached mixins
        this._attachedMixins[mixins[i].name] = true;
        // If a group name is present, add it
        if (mixins[i].groupName) {
            this._attachedMixinGroups[mixins[i].groupName] = true;
        }
        // Add all of our listeners
        if (mixins[i].listeners) {
            for (var key in mixins[i].listeners) {
                // If we don't already have a key for this event in our listeners
                // array, add it.
                if (!this._listeners[key]) {
                    this._listeners[key] = [];
                }
                // Add the listener.
                this._listeners[key].push(mixins[i].listeners[key]);
            }
        }
        // Finally call the init function if there is one
        if (mixins[i].init) {
            mixins[i].init.call(this, properties);
        }
    }
};
// Make dynamic glyphs inherit all the functionality from glyphs
Game.DynamicGlyph.extend(Game.Glyph);

Game.DynamicGlyph.prototype.hasMixin = function (obj) {
    // Allow passing the mixin itself or the name / group name as a string
    if (typeof obj === 'object') {
        return this._attachedMixins[obj.name];
    } else {
        return this._attachedMixins[obj] || this._attachedMixinGroups[obj];
    }
};

Game.DynamicGlyph.prototype.getName = function () {
    return this._name;
};

// todo pass count instead of plural
Game.DynamicGlyph.prototype.describe = function (capitalize, plural) {
    var name = plural ? this._pluralName : this._name;

    if (capitalize) {
        return name.charAt(0).toUpperCase() + name.slice(1);
    } else {
        return name;
    }
};
Game.DynamicGlyph.prototype.describeA = function (capitalize, plural) {
    // Optional parameter to capitalize the a/an.
    var prefixes = capitalize ? ['A', 'An'] : ['a', 'an'];
    var string = this.describe(false, plural);
    var firstLetter = string.charAt(0).toLowerCase();
    // If word starts by a vowel, use an, else use a. Note that this is not perfect.
    var prefix = 'aeiou'.indexOf(firstLetter) >= 0 ? 1 : 0;

    return prefixes[prefix] + ' ' + string;
};
Game.DynamicGlyph.prototype.describeThe = function (capitalize, plural) {
    var prefix = capitalize ? 'The' : 'the';
    return prefix + ' ' + this.describe(false, plural);
};
Game.DynamicGlyph.prototype.raiseEvent = function (event) {
    // Make sure we have at least one listener, or else exit
    if (!this._listeners[event]) {
        return;
    }
    // Extract any arguments passed, removing the event name
    var args = Array.prototype.slice.call(arguments, 1)
    // Invoke each listener, with this entity as the context and the arguments
    var results = [];
    for (var i = 0; i < this._listeners[event].length; i++) {
        results.push(this._listeners[event][i].apply(this, args));
    }
    return results;
};

Game.DynamicGlyph.prototype.details = function () {
    var details = [];
    var detailGroups = this.raiseEvent('details');
    // Iterate through each return value, grabbing the details from the arrays.
    if (detailGroups) {
        for (var i = 0, l = detailGroups.length; i < l; i++) {
            if (detailGroups[i]) {
                for (var j = 0; j < detailGroups[i].length; j++) {
                    details.push(detailGroups[i][j].key + ': ' + detailGroups[i][j].value);
                }
            }
        }
    }
    return details.join(', ');
};
Game.Tile = function(properties) {
    properties = properties || {};
    // Call the Glyph constructor with our properties
    Game.Glyph.call(this, properties);
    // Set up the properties. We use false by default.
    this._walkable = properties['walkable'] || false;
    this._diggable = properties['diggable'] || false;
    this._blocksLight = (properties['blocksLight'] !== undefined) ?
        properties['blocksLight'] : true;
    this._description = properties['description'] || '';
};
// Make tiles inherit all the functionality from glyphs
Game.Tile.extend(Game.Glyph);

// Standard getters
Game.Tile.prototype.isWalkable = function() {
    return this._walkable;
};
Game.Tile.prototype.isDiggable = function() {
    return this._diggable;
};
Game.Tile.prototype.isBlockingLight = function() {
    return this._blocksLight;
};
Game.Tile.prototype.getDescription = function() {
    return this._description;
};

Game.Tile.nullTile = new Game.Tile({description: '(unknown)'});
Game.Tile.floorTile = new Game.Tile({
    character: '.',
    walkable: true,
    blocksLight: false,
    description: 'A cave floor'
});
Game.Tile.wallTile = new Game.Tile({
    character: '#',
    foreground: 'goldenrod',
    diggable: true,
    description: 'A cave wall'
});
Game.Tile.stairsUpTile = new Game.Tile({
    character: '<',
    foreground: 'white',
    walkable: true,
    blocksLight: false,
    description: 'A rock staircase leading upwards'
});
Game.Tile.stairsDownTile = new Game.Tile({
    character: '>',
    foreground: 'white',
    walkable: true,
    blocksLight: false,
    description: 'A rock staircase leading downwards'
});
Game.Tile.holeToCavernTile = new Game.Tile({
    character: 'O',
    foreground: 'white',
    walkable: true,
    blocksLight: false,
    description: 'A great dark hole in the ground'
});
Game.Tile.waterTile = new Game.Tile({
    character: '~',
    foreground: 'blue',
    walkable: false,
    blocksLight: false,
    description: 'Murky blue water'
});

// Helper function
Game.getNeighborPositions = function(x, y) {
    var tiles = [];
    // Generate all possible offsets
    for (var dX = -1; dX < 2; dX ++) {
        for (var dY = -1; dY < 2; dY++) {
            // Make sure it isn't the same tile
            if (dX == 0 && dY == 0) {
                continue;
            }
            tiles.push({x: x + dX, y: y + dY});
        }
    }
    return tiles.randomize();
};
Game.Entity = function(properties) {
    properties = properties || {};
    // Call the dynamic glyph's construtor with our set of properties
    Game.DynamicGlyph.call(this, properties);
    // Instantiate any properties from the passed object
    this._x = properties['x'] || 0;
    this._y = properties['y'] || 0;
    this._z = properties['z'] || 0;
    this._map = null;
    this._alive = true;
    // Acting speed
    this._speed = properties['speed'] || 1000;
};
// Make entities inherit all the functionality from dynamic glyphs
Game.Entity.extend(Game.DynamicGlyph);

Game.Entity.prototype.setX = function(x) {
    this._x = x;
};
Game.Entity.prototype.setY = function(y) {
    this._y = y;
};
Game.Entity.prototype.setZ = function(z) {
    this._z = z;
};
Game.Entity.prototype.setMap = function(map) {
    this._map = map;
};
Game.Entity.prototype.setSpeed = function(speed) {
    this._speed = speed;
};
Game.Entity.prototype.setPosition = function(x, y, z) {
    var oldX = this._x;
    var oldY = this._y;
    var oldZ = this._z;
    // Update position
    this._x = x;
    this._y = y;
    this._z = z;
    // If the entity is on a map, notify the map that the entity has moved.
    if (this._map) {
        this._map.updateEntityPosition(this, oldX, oldY, oldZ);
    }
};
Game.Entity.prototype.getX = function() {
    return this._x;
};
Game.Entity.prototype.getY   = function() {
    return this._y;
};
Game.Entity.prototype.getZ = function() {
    return this._z;
};
Game.Entity.prototype.getPosition = function() {
    return {
        x: this._x,
        y: this._y,
        z: this._z,        
    };
};
Game.Entity.prototype.getMap = function() {
    return this._map;
};
Game.Entity.prototype.getSpeed = function() {
    return this._speed;
};

Game.Entity.prototype.tryMove = function(x, y, z, map) {
    var map = this.getMap();
    // Must use starting z
    var tile = map.getTile(x, y, this.getZ());
    var target = map.getEntityAt(x, y, this.getZ());
    // If our z level changed, check if we are on stair
    if (z < this.getZ()) {
        if (tile != Game.Tile.stairsUpTile) {
            Game.sendMessage(this, "You can't go up here!");
        } else {
            Game.sendMessage(this, "You ascend to level %d!", [z + 1]);
            this.setPosition(x, y, z);
        }
    } else if (z > this.getZ()) {
        if (tile === Game.Tile.holeToCavernTile &&
            this.hasMixin(Game.EntityMixins.PlayerActor)) {
            // Switch the entity to a boss cavern!
            this.switchMap(new Game.Map.BossCavern());
        } else if (tile != Game.Tile.stairsDownTile) {
            Game.sendMessage(this, "You can't go down here!");
        } else {
            this.setPosition(x, y, z);
            Game.sendMessage(this, "You descend to level %d!", [z + 1]);
        }
    // If an entity was present at the tile
    } else if (target) {
        // Only players can attack by bumping
        if (this.hasMixin(Game.EntityMixins.PlayerActor)) {
            this.meleeAttack(target);
            return true;
        } 
        // If not nothing we can do, but we can't 
        // move to the tile
        return false;        
    // Check if we can walk on the tile
    // and if so simply walk onto it
    } else if (tile.isWalkable()) {        
        // Update the entity's position
        this.setPosition(x, y, z);
        // Notify the entity that there are items at this position
        var items = this.getMap().getItemsAt(x, y, z);
        if (items) {
            if (items.length === 1) {
                Game.sendMessage(this, "You see %s.", [items[0].describeA()]);
            } else {
                Game.sendMessage(this, "There are several objects here.");
            }
        }
        return true;
    // Check if the tile is diggable
    } else if (tile.isDiggable()) {
        // Only dig if the the entity is the player
        if (this.hasMixin(Game.EntityMixins.PlayerActor)) {
            map.dig(x, y, z);
            return true;
        }
        // If not nothing we can do, but we can't 
        // move to the tile
        return false;
    }
    return false;
};
Game.Entity.prototype.isAlive = function() {
    return this._alive;
};
Game.Entity.prototype.kill = function(message) {
    // Only kill once!
    if (!this._alive) {
        return;
    }
    this._alive = false;
    if (message) {
        Game.sendMessage(this, message);
    } else {
        Game.sendMessage(this, "You have died!");
    }

    // Check if the player died, and if so call their act method to prompt the user.
    if (this.hasMixin(Game.EntityMixins.PlayerActor)) {
        this.act();
    } else {
        this.getMap().removeEntity(this);
    }
};
Game.Entity.prototype.switchMap = function(newMap) {
    // If it's the same map, nothing to do!
    if (newMap === this.getMap()) {
        return;
    }
    this.getMap().removeEntity(this);
    // Clear the position
    this._x = 0;
    this._y = 0;
    this._z = 0;
    // Add to the new map
    newMap.addEntity(this);
};
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
        if (!item instanceof Game.Item) return false;
        this._items.push(item);
        return true;
    },
    removeItem: function (item) {
        var index = this._items.indexOf(item);
        if (index >= 0) {
            // Simply clear the inventory slot.
            this._items.splice(index, 1);
            return true;
        }
        return false;
    },
    canAddItem: function () {
        return true;
    },
    canAddItems: function (num) {
        return true;
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
    getEquippedItems: function () {
        var items = [];
        for (const key in this._slots) {
            if (this._slots.hasOwnProperty(key)) {
                const item = this._slots[key];
                if (item) {
                    items.push(item);
                }
            }
        }
        return items;
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
//Actor template
// Game.EntityMixins.Actor = {
//     name: 'Actor',
//     groupName: 'Actor',
//     init: function (template) { },
//     act: function () { },
// }

// Main player's actor mixin
Game.EntityMixins.PlayerActor = {
    name: 'PlayerActor',
    groupName: 'Actor',
    init: function () {
        this._visibleCells = [];
        this._busy = false;
    },
    act: function () {
        if (this._acting) {
            return;
        }
        this._acting = true;
        this.raiseEvent('update');
        // Detect if the game is over
        if (!this.isAlive()) {
            Game.Screen.playScreen.setGameEnded(true);
            // Send a last message to the player
            Game.sendMessage(this, 'Press [Enter] to continue!');
        }

        // Re-render the screen
        Game.refresh();
        // Lock the engine and wait asynchronously
        // for the player to press a key.
        this.getMap().getEngine().lock();

        if (!this.getBusy()) {
            // Clear the message queue
            this.clearMessages();
            this.clearAlerts();
        }

        this._acting = false;
    },
    getBusy: function () {
        return this._busy;
    },
    setBusy: function (value) {
        this._busy = value;
    },
};

Game.EntityMixins.FungusActor = {
    name: 'FungusActor',
    groupName: 'Actor',
    init: function () {
        this._growthsRemaining = 5;
    },
    act: function () {
        this.raiseEvent('update');
        // Check if we are going to try growing this turn
        if (this._growthsRemaining > 0) {
            if (Math.random() <= 0.02) {
                // Generate the coordinates of a random adjacent square by
                // generating an offset between [-1, 0, 1] for both the x and
                // y directions. To do this, we generate a number from 0-2 and then
                // subtract 1.
                var xOffset = Math.floor(Math.random() * 3) - 1;
                var yOffset = Math.floor(Math.random() * 3) - 1;
                // Make sure we aren't trying to spawn on the same tile as us
                if (xOffset != 0 || yOffset != 0) {
                    // Check if we can actually spawn at that location, and if so
                    // then we grow!
                    if (this.getMap().isEmptyFloor(this.getX() + xOffset,
                        this.getY() + yOffset,
                        this.getZ())) {
                        var entity = Game.EntityRepository.create('fungus');
                        entity.setPosition(this.getX() + xOffset, this.getY() + yOffset,
                            this.getZ());
                        this.getMap().addEntity(entity);
                        this._growthsRemaining--;
                        // Send a message nearby!
                        Game.sendMessageNearby(this.getMap(),
                            entity.getX(), entity.getY(), entity.getZ(),
                            'The fungus is spreading!');
                    }
                }
            }
        }
    }
};

Game.EntityMixins.TaskActor = {
    name: 'TaskActor',
    groupName: 'Actor',
    init: function (template) {
        // Load tasks
        this._tasks = template['tasks'] || ['wander'];
    },
    act: function () {
        this.raiseEvent('update');
        // Iterate through all our tasks
        for (var i = 0; i < this._tasks.length; i++) {
            if (this.canDoTask(this._tasks[i])) {
                // If we can perform the task, execute the function for it.
                this[this._tasks[i]]();
                return;
            }
        }
    },
    canDoTask: function (task) {
        if (task === 'hunt') {
            return this.hasMixin('Sight') && this.canSee(this.getMap().getPlayer());
        } else if (task === 'wander') {
            return true;
        } else {
            throw new Error('Tried to perform undefined task ' + task);
        }
    },
    hunt: function () {
        var player = this.getMap().getPlayer();

        // If we are adjacent to the player, then attack instead of hunting.
        var offsets = Math.abs(player.getX() - this.getX()) +
            Math.abs(player.getY() - this.getY());
        if (offsets === 1) {
            if (this.hasMixin('MeleeAttacker')) {
                this.meleeAttack(player);
                return;
            }
        }

        // Generate the path and move to the first tile.
        var source = this;
        var z = source.getZ();
        var path = new ROT.Path.AStar(player.getX(), player.getY(), function (x, y) {
            // If an entity is present at the tile, can't move there.
            var entity = source.getMap().getEntityAt(x, y, z);
            if (entity && entity !== player && entity !== source) {
                return false;
            }
            return source.getMap().getTile(x, y, z).isWalkable();
        }, { topology: 4 });
        // Once we've gotten the path, we want to move to the second cell that is
        // passed in the callback (the first is the entity's strting point)
        var count = 0;
        path.compute(source.getX(), source.getY(), function (x, y) {
            if (count == 1) {
                source.tryMove(x, y, z);
            }
            count++;
        });
    },
    wander: function () {
        // Flip coin to determine if moving by 1 in the positive or negative direction
        var moveOffset = (Math.round(Math.random()) === 1) ? 1 : -1;
        // Flip coin to determine if moving in x direction or y direction
        if (Math.round(Math.random()) === 1) {
            this.tryMove(this.getX() + moveOffset, this.getY(), this.getZ());
        } else {
            this.tryMove(this.getX(), this.getY() + moveOffset, this.getZ());
        }
    }
};
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
// A repository has a name and a constructor. The constructor is used to create
// items in the repository.
Game.Repository = function(name, ctor) {
    this._name = name;
    this._templates = {};
    this._ctor = ctor;
    this._randomTemplates = {};
};

// Define a new named template.
Game.Repository.prototype.define = function(name, template, options) {
    this._templates[name] = template;
    // Apply any options
    var disableRandomCreation = options && options['disableRandomCreation'];
    if (!disableRandomCreation) {
        this._randomTemplates[name] = template;
    }
};

// Create an object based on a template.
Game.Repository.prototype.create = function(name, extraProperties) {
    if (!this._templates[name]) {
        throw new Error("No template named '" + name + "' in repository '" +
            this._name + "'");
    }
    // Copy the template
    var template = Object.create(this._templates[name]);
    // Apply any extra properties
    if (extraProperties) {
        for (var key in extraProperties) {
            template[key] = extraProperties[key];
        }
    }
    // Create the object, passing the template as an argument
    return new this._ctor(template);
};

// Create an object based on a random template
Game.Repository.prototype.createRandom = function() {
    // Pick a random key and create an object based off of it.
    return this.create(Object.keys(this._randomTemplates).random());
};
// Player template
Game.PlayerTemplate = {
    name: 'human (you)',
    character: '@',
    foreground: 'white',
    maxHp: 40,
    attackValue: 10,
    sightRadius: 6,
    inventorySlots: 22,
    mixins: [Game.EntityMixins.PlayerActor,
             Game.EntityMixins.MeleeAttacker, Game.EntityMixins.RangedAttacker,
             Game.EntityMixins.Destructible,
             Game.EntityMixins.InventoryHolder, Game.EntityMixins.Equipper,
             Game.EntityMixins.FoodConsumer,
             Game.EntityMixins.Sight, 
             Game.EntityMixins.MessageRecipient, Game.EntityMixins.Alertable,
             Game.EntityMixins.ExperienceGainer, Game.EntityMixins.PlayerStatGainer]
};

// Create our central entity repository
Game.EntityRepository = new Game.Repository('entities', Game.Entity);

Game.EntityRepository.define('fungus', {
    name: 'fungus',
    character: 'f',
    foreground: 'orange',
    maxHp: 10,
    speed: 250,
    mixins: [Game.EntityMixins.FungusActor, Game.EntityMixins.Destructible,
             Game.EntityMixins.ExperienceGainer, Game.EntityMixins.RandomStatGainer]
});

Game.EntityRepository.define('bat', {
    name: 'bat',
    character: 'b',
    foreground: 'lightgrey',
    maxHp: 5,
    attackValue: 4,
    speed: 2000,
    corpseButcherTemplates: ['meat'],
    mixins: [Game.EntityMixins.TaskActor, 
             Game.EntityMixins.MeleeAttacker, Game.EntityMixins.Destructible,
             Game.EntityMixins.CorpseDropper,
             Game.EntityMixins.ExperienceGainer, Game.EntityMixins.RandomStatGainer]
});

Game.EntityRepository.define('newt', {
    name: 'newt',
    character: ':',
    foreground: 'yellow',
    maxHp: 3,
    attackValue: 2,
    corpseButcherTemplates: ['meat'],
    mixins: [Game.EntityMixins.TaskActor,
             Game.EntityMixins.MeleeAttacker, Game.EntityMixins.Destructible,
             Game.EntityMixins.CorpseDropper,
             Game.EntityMixins.ExperienceGainer, Game.EntityMixins.RandomStatGainer]
});

Game.EntityRepository.define('wolf', {
    name: 'wolf',
    character: 'w',
    foreground: 'brown',
    maxHp: 15,
    attackValue: 5,
    sightRadius: 4,
    corpseButcherTemplates: ['meat', 'meat'],
    tasks: ['hunt', 'wander'],
    mixins: [Game.EntityMixins.TaskActor, Game.EntityMixins.Sight,
             Game.EntityMixins.MeleeAttacker, Game.EntityMixins.Destructible,
             Game.EntityMixins.CorpseDropper,
             Game.EntityMixins.ExperienceGainer, Game.EntityMixins.RandomStatGainer]
});

Game.EntityRepository.define('deer', {
    name: 'deer',
    character: 'd',
    foreground: 'tan',
    maxHp: 10,
    attackValue: 4,
    sightRadius: 6,
    corpseButcherTemplates: ['meat', 'meat'],
    mixins: [Game.EntityMixins.TaskActor, Game.EntityMixins.Sight,
             Game.EntityMixins.MeleeAttacker, Game.EntityMixins.Destructible,
             Game.EntityMixins.CorpseDropper,
             Game.EntityMixins.ExperienceGainer, Game.EntityMixins.RandomStatGainer]
});
Game.ItemRepository = new Game.Repository('items', Game.Item);

Game.ItemRepository.define('apple', {
    name: 'apple',
    character: '%',
    foreground: 'red',
    foodValue: 50,
    mixins: [Game.ItemMixins.Edible]
});

Game.ItemRepository.define('melon', {
    name: 'melon',
    character: '%',
    foreground: 'lightGreen',
    foodValue: 35,
    consumptions: 4,
    mixins: [Game.ItemMixins.Edible]
});

Game.ItemRepository.define('pumpkin', {
    name: 'pumpkin',
    character: '%',
    foreground: 'orange',
    foodValue: 50,
    slot: Game.ItemSlots.Head,
    defenseValue: 2,
    mixins: [Game.ItemMixins.Edible, 
        Game.ItemMixins.Equippable, Game.ItemMixins.Wearable]
});

Game.ItemRepository.define('meat', {
    name: 'chunk of meat',
    pluralName: 'chunks of meat',
    character: '%',
    foreground: 'pink',
    foodValue: 40,
    consumptions: 2,
    mixins: [Game.ItemMixins.Edible]
});

Game.ItemRepository.define('corpse', {
    name: 'corpse',
    character: '%',
    mixins: [Game.ItemMixins.Butcherable, Game.ItemMixins.Decays]
}, {
    disableRandomCreation: true
});

Game.ItemRepository.define('rock', {
    name: 'rock',
    character: '*',
    foreground: 'white'
});

// Weapons
Game.ItemRepository.define('dagger', {
    name: 'dagger',
    character: '/',
    foreground: 'gray',
    slot: Game.ItemSlots.MainHand,
    attackValue: 5,
    mixins: [Game.ItemMixins.Equippable, Game.ItemMixins.Melee]
}, {
    disableRandomCreation: true
});

Game.ItemRepository.define('sling', {
    name: 'sling',
    character: ')',
    foreground: 'brown',
    slot: Game.ItemSlots.MainHand,
    attackValue: 5,
    mixins: [Game.ItemMixins.Equippable, Game.ItemMixins.Ranged]
}, {
    disableRandomCreation: true
});

Game.ItemRepository.define('shot', {
    name: 'shot',
    pluralName: 'shot',
    character: '\'',
    foreground: 'lightgrey',
    attackValue: 2,
    ammunitionType: 'shot',
    mixins: [Game.ItemMixins.Ammunition]
}, {
    disableRandomCreation: true
});

// Wearables
Game.ItemRepository.define('tunic', {
    name: 'tunic',
    character: '[',
    foreground: 'green',
    slot: Game.ItemSlots.Chest,
    defenseValue: 2,
    mixins: [Game.ItemMixins.Equippable, Game.ItemMixins.Wearable]
}, {
    disableRandomCreation: true
});
Game.Map.Cave = function (tiles, player) {
    // Call the Map constructor
    Game.Map.call(this, tiles);
    // Add the player
    this.addEntityAtRandomPosition(player, 0);
    // Add random entities and items to each floor.
    for (var z = 0; z < this._depth; z++) {
        // 15 entities per floor
        for (var i = 0; i < 15; i++) {
            var entity = Game.EntityRepository.createRandom();
            // Add a random entity
            this.addEntityAtRandomPosition(entity, z);
            // Level up the entity based on the floor
            if (entity.hasMixin('ExperienceGainer')) {
                for (var level = 0; level < z; level++) {
                    entity.giveExperience(entity.getNextLevelExperience() -
                        entity.getExperience());
                }
            }
        }
        // 15 items per floor
        for (var i = 0; i < 15; i++) {
            // Add a random entity
            this.addItemAtRandomPosition(Game.ItemRepository.createRandom(), z);
        }
    }
    // Add weapons and armor to the map in random positions and floors
    var templates = ['dagger', 'sling', 'tunic'];
    for (var i = 0; i < templates.length; i++) {
        this.addItemAtRandomPosition(Game.ItemRepository.create(templates[i]),
            Math.floor(this._depth * Math.random()));
    }
    // Add a hole to the final cavern on the last level.
    var holePosition = this.getRandomFloorPosition(this._depth - 1);
    this._tiles[this._depth - 1][holePosition.x][holePosition.y] =
        Game.Tile.holeToCavernTile;
};
Game.Map.Cave.extend(Game.Map);

Game.Map.BossCavern = function() {
    // Call the Map constructor
    Game.Map.call(this, this._generateTiles(80, 24));
    // Create the giant zombie
    this.addEntityAtRandomPosition(Game.EntityRepository.create('giant zombie'), 0);
};
Game.Map.BossCavern.extend(Game.Map);

Game.Map.BossCavern.prototype._fillCircle = function(tiles, centerX, centerY, radius, tile) {
    // Copied from the DrawFilledCircle algorithm
    // http://stackoverflow.com/questions/1201200/fast-algorithm-for-drawing-filled-circles
    var x = radius;
    var y = 0;
    var xChange = 1 - (radius << 1);
    var yChange = 0;
    var radiusError = 0;

    while (x >= y) {    
        for (var i = centerX - x; i <= centerX + x; i++) {
            tiles[i][centerY + y] = tile;
            tiles[i][centerY - y] = tile;
        }
        for (var i = centerX - y; i <= centerX + y; i++) {
            tiles[i][centerY + x] = tile;
            tiles[i][centerY - x] = tile;   
        }

        y++;
        radiusError += yChange;
        yChange += 2;
        if (((radiusError << 1) + xChange) > 0) {
            x--;
            radiusError += xChange;
            xChange += 2;
        }
    }
};

Game.Map.BossCavern.prototype._generateTiles = function(width, height) {
    // First we create an array, filling it with empty tiles.
    var tiles = new Array(width);
    for (var x = 0; x < width; x++) {
        tiles[x] = new Array(height);
        for (var y = 0; y < height; y++) {
            tiles[x][y] = Game.Tile.wallTile;
        }
    }
    // Now we determine the radius of the cave to carve out.
    var radius = (Math.min(width, height) - 2) / 2;
    this._fillCircle(tiles, width / 2, height / 2, radius, Game.Tile.floorTile);

    // Now we randomly position lakes (3 - 6 lakes)
    var lakes = Math.round(Math.random() * 3) + 3;
    var maxRadius = 2;
    for (var i = 0; i < lakes; i++) {
        // Random position, taking into consideration the radius to make sure
        // we are within the bounds.
        var centerX = Math.floor(Math.random() * (width - (maxRadius * 2)));
        var centerY = Math.floor(Math.random() * (height - (maxRadius * 2)));
        centerX += maxRadius;
        centerY += maxRadius;
        // Random radius
        var radius = Math.floor(Math.random() * maxRadius) + 1;
        // Position the lake!
        this._fillCircle(tiles, centerX, centerY, radius, Game.Tile.waterTile);
    }

    // Return the tiles in an array as we only have 1 depth level.
    return [tiles];
};

Game.Map.BossCavern.prototype.addEntity = function(entity) {
    // Call super method.
    Game.Map.prototype.addEntity.call(this, entity);
    // If it's a player, place at random position
    if (this.getPlayer() === entity) {
        var position = this.getRandomFloorPosition(0);
        entity.setPosition(position.x, position.y, 0);
        // Start the engine!
        this.getEngine().start();
    }
};