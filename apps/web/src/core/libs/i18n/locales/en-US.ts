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
    chooseDeck: "Choose a Starter Deck",
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
      cancel: "Cancel",
    },
    attack: "Attack",
    hp: "HP",
    speedStat: "Speed",
    range: "Range",
    recall: "Recall {value}%",
    skill: "Skill",
    recallReminder:
      "After its effect, this card has a {value}% chance to go back to your Hand. Else it goes to the Graveyard.",
    player: "You",
    enemy: "Enemy",
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
    charge: "Charge",
    flying: "Flying",
    heroic: "Heroic {value}",
    pivot: "Pivot",
    regeneration: "Regeneration {value}",
    retaliation: "Retaliation",
    ranged: "Ranged {value}",
    melee: "Melee",
  },
  keywordRules: {
    armor:
      "Reduces damage to this Unit by {value}. It does not reduce Holy damage.",
    charge: "+2 Speed in the Turn when you summon this Unit.",
    flying: "Moves over other Units. It stops in an empty Square.",
    heroic: "+{value} damage when this Unit attacks a Hero.",
    pivot:
      "This Unit can attack an enemy Unit directly behind it or next to it, before the Unit in front. Then it does not move.",
    regeneration: "In your Start Step, this Unit heals {value} HP.",
    retaliation:
      "When this Unit survives a melee attack, it deals its Attack to the attacker.",
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
    laneArmor: "Friendly Units in a Lane get Armor {armor} for {turns} Turns.",
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
