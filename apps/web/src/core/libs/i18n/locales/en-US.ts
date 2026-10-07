import type { LanguageMessages } from "@/core/libs/i18n/init";

export default {
  // #region COMMON
  locale: "en-US",
  backTo: "Back to {target} page",
  errorMinLength: "{field} must have at least {length} characters",
  error: "{module} error",
  theme: "Theme",
  system: "System",
  light: "Light",
  dark: "Dark",
  add: "Add",
  update: "Update",
  remove: "Remove",
  empty: "Empty",
  unsavedChanges: "You have unsaved changes - are you sure?",
  noPageContent: "No Content",
  attention: "Attention",
  language: "Language",
  cancel: "Cancel",
  continue: "Continue",
  reload: "Reload",
  appReady: "App is ready to use offline",
  newContentAvailable:
    "New content is available, click the reload button to update",
  newUpdateAvailable: "A new update is available",
  downloadAndInstallUpdate: "Download and install update",
  notFound: "Not Found",
  gone: "Sorry, we can't find the page you're looking for",
  welcome: "Welcome Back",
  // #endregion COMMON
  // #region HOME
  title: "Home",
  // #endregion HOME
  // #region GAME
  game: {
    play: "Play",
    tagline: "Plan your timing. Watch the lanes.",
  },
  battle: {
    title: "Battle",
    chooseStage: "Choose a Stage",
    chooseDeck: "Choose a Deck",
    editDecks: "Edit Decks",
    deckLine: "{className} · {count} cards",
    start: "Start Battle",
    stageLabel: "Stage {id}",
    boss: "Boss",
    heroHp: "Enemy Hero HP {hp}",
    turn: "Turn {number}",
    yourTurn: "Your Turn",
    enemyTurn: "Enemy Turn",
    endTurn: "End Turn",
    skip: "Skip",
    speed: "Speed",
    speedValue: "×{value}",
    sound: "Sound",
    quit: "Leave Battle",
    deck: "Deck",
    graveyard: "Graveyard",
    deckCount: "Deck: {count} cards",
    graveyardCount: "Graveyard: {count} cards",
    graveyardTop: "Graveyard: {count} cards. Last card: {name}",
    hand: "Hand",
    enemyHand: "Enemy Hand",
    ready: "Ready",
    countdown: "Countdown {value}",
    selectTarget: "Select a target",
    noTarget: "No legal target now",
    uniqueBlocked: "{name} is already on your side of the Board.",
    cancel: "Cancel",
    victory: "Victory",
    defeat: "Defeat",
    turnLimit: "The Turn limit is reached. The defender wins.",
    starsLabel: "{count} of 3 Stars",
    retry: "Play Again",
    backToCampaign: "Back to Campaign",
    abandon: {
      title: "Leave the Battle?",
      text: "This Battle records no result. You can play the Stage again at any time.",
      confirm: "Leave",
      stay: "Stay",
    },
    rotate: "Turn your phone to landscape to play.",
    noWebgl:
      "This game needs WebGL 2. Your browser or device does not support it.",
    loading: "Loading the Board…",
    keyGuide: {
      label: "Key Guide",
      title: "Keys",
      moveSelection: "Select a card",
      focusTarget: "Select a target",
      play: "Play the card",
      endTurn: "End the Turn",
      skip: "Skip the animation",
      inspect: "See the Card Details of the Units",
      cancel: "Cancel",
    },
    attack: "Attack",
    hp: "HP",
    speedStat: "Speed",
    range: "Range",
    recall: "Recall {value}%",
    skill: "Skill",
    cast: {
      player: "You cast {name}",
      enemy: "The enemy casts {name}",
      recalled: "Back to the Hand",
    },
    recallReminder:
      "After its effect, this card has a {value}% chance to go back to your Hand. Else it goes to the Graveyard.",
    player: "You",
    enemy: "Enemy",
    yours: "Yours",
    yourUnit: "Your Unit",
    enemyUnit: "Enemy Unit",
    status: {
      bonusArmor: "Armor +{value}",
      bonusArmorRule: "From a Skill Card. Turns left: {turns}.",
      burn: "Burn",
      burnRule:
        "1 damage in each End Step of its owner. End Steps left: {value}.",
      frozen: "Frozen",
      frozenRule: "It skips its next action.",
      poisoned: "Poison {value}",
      poisonedRule:
        "1 damage per stack in each End Step of its owner. Then it loses 1 stack.",
      hobbled: "Hobbled {value}",
      hobbledRule:
        "This Unit has a maximum Speed of 1, after all bonuses. The count goes down by 1 in each End Step of its owner.",
      bleeding: "Bleeding {value}",
      bleedingRule:
        "This Unit gets half of each heal, rounded down. The count goes down by 1 in each End Step of its owner.",
      entangled: "Entangled",
      entangledRule: "Speed 0 in its next action. It can still attack.",
    },
  },
  town: {
    label: "Town",
    bar: "Town Bar",
    opensLater: "Opens later",
    locked: "{name}, opens later",
    buildings: {
      townGate: "Campaign",
    },
    shortcuts: {
      town: "Town",
      campaign: "Campaign",
      heynspire: "Heynspire",
      dungeons: "Dungeons",
      deck: "Deck",
      workshop: "Workshop",
      packs: "Packs",
      hero: "Hero",
      achievements: "Achievements",
      bazaar: "Bazaar",
    },
    balances: {
      label: "Your balances",
      balance: "{name}: {amount}",
      coin: {
        name: "Coin",
        use: "Pays for Packs, Combine, Gear upgrades and Deck Slots.",
      },
      essence: {
        name: "Essence",
        use: "Pays for Craft in the Workshop.",
      },
      heynstones: {
        name: "Heynstones",
        use: "Buys Cosmetics and Conveniences in the Bazaar.",
      },
      denominations: {
        gold: { name: "Gold", short: "g" },
        silver: { name: "Silver", short: "s" },
        copper: { name: "Copper", short: "c" },
      },
    },
  },
  campaign: {
    label: "Campaign",
    regionOf: "Region {number} of {count}",
    regions: {
      "1": "Hearthvale",
      "2": "The Thornwood",
      "3": "The Hollow Marches",
    },
    previousRegion: "Previous Region: {name}",
    nextRegion: "Next Region: {name}",
    regionLater: "{name} opens later.",
    trail: "Stages",
    marker: {
      done: "Stage {id}, done, {stars} of 3 Stars",
      open: "Stage {id}, open",
      locked: "Stage {id}, locked",
      bossDone: "Boss Stage {id}, done, {stars} of 3 Stars",
      bossOpen: "Boss Stage {id}, open",
      bossLocked: "Boss Stage {id}, locked",
    },
    winFirst: "Win Stage {id} first.",
    stars: {
      label: "Stars in {name}",
      value: "{count} of {total} Stars",
    },
    chest: {
      label: "Chest at {stars} Stars",
      earned:
        "You have the Stars for this chest. Chest rewards are not in the game yet.",
      needed: "{count} more Stars open this chest.",
    },
    panel: {
      close: "Close",
      enemy: "Enemy",
      enemyLine: "{name} · {className}",
      heroHp: "Hero HP {hp}",
      level: "Recommended level {level}",
      bestStars: "Best",
      notWon: "Not won yet",
      reward: "Reward",
      firstWin: "First win: this card, Coin and XP.",
      repeatWin: "Repeat win: Coin, XP and a chance of a card from this Stage.",
      deck: "Deck",
      fight: "Fight",
    },
  },
  settings: {
    title: "Settings",
    close: "Close Settings",
    language: "Language",
    sound: "Sound",
    volume: "Sound volume",
    soundOn: "Sound on",
  },
  tutorial: {
    label: "Tutorial",
    gotIt: "Got it",
    skip: "Skip tutorial",
    steps: {
      ready: {
        title: "Countdown and Ready",
        text: "The number on each card in your Hand is its Countdown. It goes down by 1 at the start of each of your Turns. At 0, the card is Ready, and you can play it. Play a Ready card, or end your Turn.",
      },
      summonZone: {
        title: "Your Summon Zone",
        text: "Put the card on a highlighted Square. Your Summon Zone is the 3 Squares nearest to your Hero in each Lane. The arrow shows one Lane, but you can use any Lane.",
      },
      resolution: {
        title: "Units act by themselves",
        text: "Your Units now move and attack by themselves. You do not control them. Plan your plays before you end your Turn.",
      },
      laneChoice: {
        title: "Block the enemy",
        text: "An enemy Unit is in a Lane that has none of your Units. The red highlight shows that Lane. Summon a Unit into it to block the enemy Unit.",
      },
    },
  },
  deckBuilder: {
    title: "Decks",
    close: "Close Decks",
    slots: "Deck slots",
    slotName: "Deck {number}",
    nameLabel: "Deck name",
    cards: "Cards",
    ownedOf: "{owned} / {total} owned",
    filters: {
      ownership: "Ownership",
      kind: "Card type",
      race: "Race",
      class: "Class",
      all: "All",
      owned: "Owned",
      notOwned: "Not owned",
      creature: "Creatures",
      skill: "Skills",
      allRaces: "All Races",
      allClasses: "All Classes",
    },
    notOwned: "Not owned",
    notOwnedCard:
      "{name}, {rank}, Countdown {countdown}. You do not own this card.",
    notOwnedGroup: "Not owned · {count}",
    groups: {
      all: "cards",
      creature: "Creature Cards",
      race: "{race} Creature Cards",
      skill: "Skill Cards",
      class: "{className} Skill Cards",
    },
    emptyPool: {
      ownAll: "You own all {group}.",
      ownNone: "You own no {group} yet.",
    },
    showAll: "Show all",
    heroClass: "Hero Class",
    curve: "Countdown curve",
    curveColumn:
      "Countdown {countdown}: {creatures} Creature Cards, {skills} Skill Cards",
    creature: "Creature",
    skill: "Skill",
    thisDeck: "Cards in this Deck",
    empty:
      "This Deck has no cards. Select a card on the left page to add it, or use Auto-fill.",
    size: "{count} / {max} cards",
    sizeMin: "At least {min}",
    add: "Add {name}, {rank}, Countdown {countdown}. Copies left: {left}.",
    remove: "Remove one {name}, {rank}. In this Deck: {count}.",
    left: "×{count}",
    blocked: {
      none: "All in Deck",
      full: "Deck is full",
      copies: "3 copies",
      class: "{className} only",
    },
    autoFill: "Auto-fill",
    clear: "Remove All",
    use: "Use This Deck",
    active: "Active Deck",
    buySlot: {
      ribbon: "Buy Deck Slot {number} for {price}",
      title: "Buy Deck Slot {number}?",
      text: "You get one more place to save a Deck. You keep it for all time.",
      price: "Price",
      balance: "Your Coin",
      after: "After you buy",
      short: "You need {amount} more.",
      buy: "Buy",
      cancel: "Cancel",
    },
    problems: {
      tooFew: "The Deck needs at least {min} cards. It has {count}.",
      tooMany: "The Deck can have {max} cards at most. It has {count}.",
      tooManyCopies: "{name}: a Deck can have {max} copies at most.",
      wrongClass:
        "{name} is a {className} card. Remove it, or change the Hero Class.",
      notOwned: "You do not have enough copies of {name} ({rank}).",
    },
  },
  decks: {
    vanguard: {
      name: "Human Vanguard",
      description:
        "Warrior. Hold the Lanes with armor, then push with knights.",
    },
    raiders: {
      name: "Orc Raiders",
      description: "Mage. Fast beasts and fire. Hit the enemy Hero early.",
    },
  },
  stages: {
    "1-1": { name: "The Muddy Ford", enemy: "Bandit Scout" },
    "1-2": { name: "Two Bridges", enemy: "Bandit Twins" },
    "1-3": { name: "The Burning Mill", enemy: "Hedge Witch" },
    "1-4": { name: "The Toll Gate", enemy: "Toll Sergeant" },
    "1-5": { name: "The Outlaw Camp", enemy: "Camp Cook" },
    "1-6": { name: "The Old Watchtower", enemy: "Watchtower Hexer" },
    "1-7": { name: "The Sellsword Camp", enemy: "Sellsword Captain" },
    "1-8": { name: "The Rockfall Pass", enemy: "Pass Warden" },
    "1-9": { name: "The Great Oak", enemy: "The Baron's Lookout" },
    "1-10": { name: "Brassbelly Hall", enemy: "Baron Brassbelly" },
  },
  classes: {
    warrior: "Warrior",
    ranger: "Ranger",
    mage: "Mage",
    priest: "Priest",
  },
  races: {
    human: "Human",
    elf: "Elf",
    undead: "Undead",
    orc: "Orc",
    goblin: "Goblin",
    feral: "Feral",
  },
  ranks: {
    common: "Common",
    uncommon: "Uncommon",
    rare: "Rare",
    epic: "Epic",
    legendary: "Legendary",
  },
  roles: {
    frontliner: "Frontliner",
    striker: "Striker",
    runner: "Runner",
    shooter: "Shooter",
    support: "Support",
    wall: "Wall",
  },
  damageTypes: {
    physical: "Physical",
    fire: "Fire",
    frost: "Frost",
    holy: "Holy",
  },
  keywords: {
    armor: "Armor {value}",
    bleed: "Bleed {value}",
    charge: "Charge",
    entangle: "Entangle",
    flying: "Flying",
    heroic: "Heroic {value}",
    hobble: "Hobble {value}",
    knockback: "Knockback {value}",
    lastBreath: "Last Breath {value}",
    pivot: "Pivot",
    poison: "Poison",
    rally: "Rally {value}",
    regeneration: "Regeneration {value}",
    retaliation: "Retaliation",
    sabotage: "Sabotage {value}",
    trample: "Trample",
    unique: "Unique",
    wall: "Wall",
    ranged: "Ranged {value}",
    melee: "Melee",
  },
  keywordRules: {
    armor:
      "Reduces damage to this Unit by {value}. It does not reduce Holy damage.",
    bleed:
      "The enemy Unit it hits gets half of each heal, rounded down, for {value} Turns. Retaliation does not apply Bleed.",
    charge: "+2 Speed in the Turn when you summon this Unit.",
    entangle:
      "The enemy Unit it hits has Speed 0 in its next action. That Unit can still attack.",
    flying:
      "Moves over all Units, also enemy Units. It stops in an empty Square.",
    heroic: "+{value} damage when this Unit attacks a Hero.",
    hobble:
      "The enemy Unit it hits has a maximum Speed of 1 for {value} Turns. Retaliation does not apply Hobble.",
    knockback:
      "Pushes the enemy Unit it hits {value} Squares back. Retaliation does not apply Knockback.",
    lastBreath:
      "When this Unit leaves the Board, it deals {value} damage to the nearest enemy Unit ahead.",
    pivot:
      "This Unit can attack an enemy Unit directly behind it or next to it, before the Unit in front. Then it does not move.",
    poison:
      "After this Unit deals attack damage above 0, that Unit gains 1 Poison stack. In each End Step of its owner, it takes 1 damage per stack, then loses 1 stack.",
    rally:
      "In your Start Step, other friendly Units in the same Lane get +{value} Attack until the end of the Turn. A Unit with Base Attack 0 gets no bonus.",
    regeneration: "In your Start Step, this Unit heals {value} HP.",
    retaliation:
      "When this Unit survives a melee attack, it deals its Attack to the attacker.",
    sabotage:
      "When this Unit comes from its card, the card with the lowest Countdown in the enemy Hand gets +{value} Countdown. A Ready card is the lowest.",
    trample:
      "When this Unit kills an enemy Unit with an attack, the damage that is left hits the enemy Unit in the next Square behind it. It never hits a Hero.",
    unique: "Only one copy of this card can be on your side of the Board.",
    wall: "This Unit has Speed 0 and Attack 0. It blocks enemy Units in its Lane, and a push never moves it.",
    fire: "Fire: the target burns for 1 damage in its next 2 End Steps.",
    frost: "Frost: the target skips its next action.",
    holy: "Holy: Armor does not reduce this damage.",
  },
  effects: {
    damageUnit: "Deal {amount} {damageType} damage to an enemy Unit.",
    damageArea:
      "Deal {amount} {damageType} damage to an enemy Unit and the next {extra} Square behind it.",
    damageLane:
      "Deal {amount} {damageType} damage to all enemy Units in a Lane.",
    laneArmor:
      "Friendly Units in a Lane get Armor {armor} for the next {turns} enemy Turns.",
    lowerCountdown:
      "The Countdown of {cards} random cards in your Hand goes down by {amount}.",
  },
  cards: {
    human: {
      militiaRecruit: {
        name: "Militia Recruit",
        flavor: '"I brought my own pitchfork!"',
      },
      shieldbearer: {
        name: "Shieldbearer",
        flavor: "Her shield has more dents than a tin pot.",
      },
      crossbowGuard: {
        name: "Crossbow Guard",
        flavor: "Never late. Never misses. Sometimes asleep.",
      },
      halberdier: {
        name: "Halberdier",
        flavor: "Touch the banner and you touch the blade.",
      },
      dawnCleric: {
        name: "Dawn Cleric",
        flavor: "She sings at sunrise. Nobody asked her to.",
      },
      riverKnight: {
        name: "River Knight",
        flavor: "His horse is braver than he is.",
      },
      gateWarden: {
        name: "Gate Warden",
        flavor: "Nobody gets past. Nobody gets behind, either.",
      },
      ironBulwark: {
        name: "Iron Bulwark",
        flavor: "A wall that complains about the weather.",
      },
      townBarricade: {
        name: "Town Barricade",
        flavor: "The passage permit is under the sandbags.",
      },
      bridgePikeman: {
        name: "Bridge Pikeman",
        flavor: "Please enter the queue. The back of the queue.",
      },
      bannerChaplain: {
        name: "Banner Chaplain",
        flavor: "The sermon ends when morale improves.",
      },
      kingsCourier: {
        name: "King's Courier",
        flavor: "The message says urgent. She was already running.",
      },
      paviseArbalist: {
        name: "Pavise Arbalist",
        flavor: "He brings his own wall and calls it a firing position.",
      },
      dawnReliquary: {
        name: "Dawn Reliquary",
        flavor: "Even broken, it gets the last word.",
      },
      marshalElianVoss: {
        name: "Marshal Elian Voss",
        flavor: "Hold the line. I have six more reasons.",
      },
    },
    orc: {
      badlandPup: {
        name: "Badland Pup",
        flavor: "Small, loud and already biting.",
      },
      scrapRaider: {
        name: "Scrap Raider",
        flavor: "Everything shiny is his now.",
      },
      emberShaman: {
        name: "Ember Shaman",
        flavor: "She cooks dinner and enemies the same way.",
      },
      howlingCharger: {
        name: "Howling Charger",
        flavor: "You hear it long before you see it.",
      },
      skyreaver: {
        name: "Skyreaver",
        flavor: "It steals hats from very high up.",
      },
      packStalker: {
        name: "Pack Stalker",
        flavor: "It always knows where you are. Mostly behind you.",
      },
      tuskBrute: { name: "Tusk Brute", flavor: "Doors are only a suggestion." },
      warchiefGrukka: {
        name: "Warchief Grukka",
        flavor: '"Lunch first. Then glory."',
      },
      dusthideBrawler: {
        name: "Dusthide Brawler",
        flavor: "He mistakes every warning for applause.",
      },
      cinderhornRam: {
        name: "Cinderhorn Ram",
        flavor: "It never waits for the gate to open.",
      },
      warhowlerDrummer: {
        name: "Warhowler Drummer",
        flavor: "She only knows one rhythm: faster.",
      },
      ashspitHunter: {
        name: "Ashspit Hunter",
        flavor: "He measures range by how far the eyebrows burn.",
      },
      mesaPitFighter: {
        name: "Mesa Pit-Fighter",
        flavor: "Hit her once. That is how counting lessons start.",
      },
      pyreaxeRavager: {
        name: "Pyreaxe Ravager",
        flavor: "The axe is hot. Her temper is hotter.",
      },
      warbandStandardBearer: {
        name: "Warband Standard-Bearer",
        flavor: "Follow the banner. Ignore where it is going.",
      },
    },
    goblin: {
      ankleSnatcher: {
        name: "Ankle Snatcher",
        flavor: "Ankles are the easiest part of a knight to reach.",
      },
      fuseRunner: {
        name: "Fuse Runner",
        flavor: "The fuse is long. The plan is short.",
      },
      junkSlinger: {
        name: "Junk Slinger",
        flavor: "One goblin's junk is another knight's limp.",
      },
      tunnelSaboteur: {
        name: "Tunnel Saboteur",
        flavor: "He does not fight your army. He fights your schedule.",
      },
      scrapPlateGuard: {
        name: "Scrap-Plate Guard",
        flavor: "Armor is armor. Even if it was a stove.",
      },
      sidestepShiv: {
        name: "Sidestep Shiv",
        flavor: "Front door? Never heard of it.",
      },
      junkBarricade: {
        name: "Junk Barricade",
        flavor: "Built in one night. Paid for by nobody.",
      },
      bombLobber: {
        name: "Bomb Lobber",
        flavor: "Catch!",
      },
      greaseTrapper: {
        name: "Grease Trapper",
        flavor: "Mind the floor.",
      },
      rocketBarrelRider: {
        name: "Rocket Barrel Rider",
        flavor: "Steering is a later invention.",
      },
      mineSapper: {
        name: "Mine Sapper",
        flavor: "Every wall has a weak spot. I bring my own.",
      },
      spyglassSniper: {
        name: "Spyglass Sniper",
        flavor: "I see your plans. I do not like them.",
      },
      junkWalker: {
        name: "Junk Walker",
        flavor: "It walks. Mostly forward.",
      },
      grandGearjammer: {
        name: "Grand Gearjammer",
        flavor: "Every plan has gears. We have more.",
      },
      bossSnikkit: {
        name: "Boss Snikkit, the Mine King",
        flavor: '"Everything down here is mine. That is the joke. Laugh."',
      },
    },
    feral: {
      bristlebackBoar: {
        name: "Bristleback Boar",
        flavor: "It does not go around things.",
      },
      cragLizard: {
        name: "Crag Lizard",
        flavor: "It sat on this rock for a hundred years. Now it is your rock.",
      },
      frostfangLynx: {
        name: "Frostfang Lynx",
        flavor: "You will not hear it. You will feel the cold first.",
      },
      caveBear: {
        name: "Cave Bear",
        flavor: "It woke up hungry. It is still waking up.",
      },
      webSpitter: {
        name: "Web Spitter",
        flavor: "Stay for dinner.",
      },
      boulderTortoise: {
        name: "Boulder Tortoise",
        flavor: "It moves for nobody. It hardly moves for itself.",
      },
      tailsweepBasilisk: {
        name: "Tailsweep Basilisk",
        flavor: "Look it in the eye? It looks at your ankles.",
      },
      caveTroll: {
        name: "Cave Troll",
        flavor: "Cut it. Wait. Cut it again.",
      },
      cragRhino: {
        name: "Crag Rhino",
        flavor: "The road ends where it stops.",
      },
      frostElkMatriarch: {
        name: "Frost Elk Matriarch",
        flavor: "Where she walks, the herd follows.",
      },
      avalancheYeti: {
        name: "Avalanche Yeti",
        flavor: "It came down with the snow. The snow was the smaller problem.",
      },
      woollyMammoth: {
        name: "Woolly Mammoth",
        flavor: "It does not stop. Plan around it.",
      },
      rimebreathDrake: {
        name: "Rimebreath Drake",
        flavor: "Its breath is the weather.",
      },
      mountainColossus: {
        name: "Mountain Colossus",
        flavor: "The mountain stood up. Then it walked.",
      },
      oldFrostmaw: {
        name: "Old Frostmaw",
        flavor: "Every village has a story about it. Every story is too small.",
      },
    },
    warrior: {
      warDrums: { name: "War Drums", flavor: "Boom. Boom. Move faster." },
      shieldWall: { name: "Shield Wall", flavor: "Lock shields and hold." },
      spearThrow: { name: "Spear Throw", flavor: "Aim for the loud one." },
    },
    mage: {
      fireball: { name: "Fireball", flavor: "A warm welcome." },
      frostBolt: { name: "Frost Bolt", flavor: "Stay a while." },
      flameWave: { name: "Flame Wave", flavor: "The whole lane gets a turn." },
    },
  },
  // #endregion GAME
} as const satisfies LanguageMessages;
