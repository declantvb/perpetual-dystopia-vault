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
    mixins: [Game.ItemMixins.Equippable, Game.ItemMixins.Wieldable]
}, {
    disableRandomCreation: true
});

Game.ItemRepository.define('sling', {
    name: 'sling',
    character: ')',
    foreground: 'brown',
    slot: Game.ItemSlots.BothHands,
    attackValue: 5,
    mixins: [Game.ItemMixins.Equippable, Game.ItemMixins.Wieldable]
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