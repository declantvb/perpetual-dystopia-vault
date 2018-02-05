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
             Game.EntityMixins.Attacker, Game.EntityMixins.Destructible,
             Game.EntityMixins.InventoryHolder, Game.EntityMixins.FoodConsumer,
             Game.EntityMixins.Sight, 
             Game.EntityMixins.MessageRecipient, Game.EntityMixins.Alertable,
             Game.EntityMixins.Equipper,
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
             Game.EntityMixins.Attacker, Game.EntityMixins.Destructible,
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
             Game.EntityMixins.Attacker, Game.EntityMixins.Destructible,
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
    corpseButcherTemplates: ['meat'],
    tasks: ['hunt', 'wander'],
    mixins: [Game.EntityMixins.TaskActor, Game.EntityMixins.Sight,
             Game.EntityMixins.Attacker, Game.EntityMixins.Destructible,
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
    corpseButcherTemplates: ['meat'],
    mixins: [Game.EntityMixins.TaskActor, Game.EntityMixins.Sight,
             Game.EntityMixins.Attacker, Game.EntityMixins.Destructible,
             Game.EntityMixins.CorpseDropper,
             Game.EntityMixins.ExperienceGainer, Game.EntityMixins.RandomStatGainer]
});