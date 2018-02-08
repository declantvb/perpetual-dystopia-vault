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