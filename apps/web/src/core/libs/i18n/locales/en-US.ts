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
    ticking: "ticking",
    waiting: "waiting",
    tickingLine: "Goes down by 1 at the start of your next Turn.",
    waitingLine:
      "Waits. It goes down when one of the 3 cards before it is Ready.",
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
      handbook: "Open the Handbook",
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
      burnRule: "1 damage in each End Step of its owner.",
      burnLeft: "End Steps left: {value}.",
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
      handbook: "Handbook",
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
        text: "The number on each card in your Hand is its Countdown. At the start of each of your Turns, the first 3 cards from the left that are not Ready go down by 1. Their hourglass runs. The other cards wait. At 0, a card is Ready, and you can play it. Play a Ready card, or end your Turn.",
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
  hints: {
    label: "Hint",
    readMore: "Read more",
    close: "Close the Hint",
    skillCard:
      "Your Skill Card is Ready. Play it on a target for its one-time effect.",
    recall:
      "Recall sent your Skill Card back to your Hand. Its Countdown starts again.",
    deckBuilder: "You have a card that is in no Deck. Open the Deck to add it.",
  },
  handbook: {
    title: "Handbook",
    close: "Close Handbook",
    search: "Search the Handbook",
    searchPlaceholder: "Search",
    clearSearch: "Clear the search",
    chapters: "Chapters",
    chapter: {
      battle: { name: "Battle", short: "Battle" },
      cards: { name: "Cards", short: "Cards" },
      units: { name: "Units", short: "Units" },
      keywords: { name: "Keywords", short: "Keywords" },
      statuses: { name: "Statuses and Damage Types", short: "Statuses" },
      kinds: { name: "Races, Classes and Roles", short: "Races" },
      ranks: { name: "Ranks", short: "Ranks" },
      progress: { name: "Progress", short: "Progress" },
    },
    entryList: "Entries in {chapter}",
    results: "Search results",
    resultCount: "Entries found: {count}",
    alias: "{alias} → {name}",
    noResult: "No Entry matches “{query}”.",
    toBattle: "Go to the Battle Chapter",
    back: "Back to the list",
    seeAlso: "See also",
    n: "N",
    seeCard: "N is on each card. See the card.",
    rankTable: "N at each Rank",
    rankColumn: "Rank",
    valueColumn: "N",
    rankLine:
      "{gems} Rank Gems. Attack and HP ×{scale:number}. Recall of a Skill Card: {recall}%.",
    names: {
      board: "Board",
      lane: "Lane",
      square: "Square",
      column: "Column",
      front: "Front",
      summonZone: "Summon Zone",
      closedLane: "Closed Lane",
      side: "Side",
      hero: "Hero",
      turn: "Turn",
      startStep: "Start Step",
      playPhase: "Play Phase",
      resolutionPhase: "Resolution Phase",
      endStep: "End Step",
      suddenDeath: "Sudden Death",
      routed: "Routed",
      defeated: "Defeated",
      creatureCard: "Creature Card",
      skillCard: "Skill Card",
      handLimit: "Hand Limit",
      countdown: "Countdown",
      tickingCard: "Ticking Card",
      waitingCard: "Waiting Card",
      recall: "Recall",
      countdownLimit: "Countdown Limit",
      unit: "Unit",
      ranged: "Ranged",
      movement: "Movement",
      status: "Status",
      damageType: "Damage Type",
      race: "Race",
      class: "Class",
      role: "Role",
      rank: "Rank",
      rankGems: "Rank Gems",
      stars: "Stars",
      playerLevel: "Player level",
    },
    entries: {
      board:
        "The Board is the battlefield of one Battle. In a Stage, it has {lanes} Lanes.\n\nYour Hero is at the left end of the Lanes, and the enemy Hero is at the right end. Your Units go from left to right, and the enemy Units go from right to left.",
      lane: "A Lane is one row of {squares} Squares from your Hero to the enemy Hero.\n\nA Unit always stays in its Lane. It moves only along its Lane.",
      square:
        "A Square is one place in a Lane. It holds 0 or 1 Unit. You summon a Unit into an empty Square.",
      column:
        "A Column is all the Squares at the same distance from a Hero, in all Lanes.\n\nEach Side counts the Columns from its own Hero. Your Column 1 is next to your Hero, and your Column {squares} is next to the enemy Hero.",
      front:
        "The Front of a Hero is the Lanes that the Hero stands behind. In a Stage, each Hero has a Front of all the Lanes.\n\nA Unit at the end of its Lane attacks the enemy Hero of that Front.",
      summonZone:
        "Your Summon Zone is your Columns 1 to {columns}, in all Lanes. You can summon a Unit only into an empty Square of your Summon Zone.\n\nYou can also summon into a Square that is past an enemy Unit. A melee Unit attacks only forward, so these two Units do not fight.\n\nA Unit with Wall can also go into your Columns {next} and {wall}.",
      closedLane:
        "In a Closed Lane, no Side can summon a Unit, and no Skill Card can target a Square.\n\nSome Stages have a Closed Lane. It opens at a set Turn number, or it stays closed for the full Battle.",
      side: "A Side is one of the two teams in a Battle: your Side and the enemy Side. Each Side has a Hero.\n\nYour Side is at the left of the Board, and the enemy Side is at the right.",
      hero: "A Hero is the commander of a Side. It stands behind its Front, outside the Board.\n\nA Hero has HP, a Class and a Deck. When its HP goes to 0, the Hero is Defeated.",
      turn: "In a Turn, one Side plays its cards, and its Units act. A Turn has 4 parts: the Start Step, the Play Phase, the Resolution Phase and the End Step.\n\nYou take the first Turn. Then the enemy takes a Turn. The Turn number goes up by 1 when both Sides took a Turn.",
      startStep:
        "The Start Step is the first part of your Turn. These things occur in this order:\n\n1. Effects such as Regeneration and Rally occur.\n\n2. From Turn {turn}, Sudden Death damage hits your Hero.\n\n3. The Countdown of each of your Ticking Cards goes down by 1.\n\n4. Your Hero draws 1 card, if the Hand has fewer than {limit} cards.",
      playPhase:
        "In the Play Phase, you play your Ready cards. You can play all of them, in any order, or you can play no cards.\n\nA Creature Card goes into an empty Square of your Summon Zone. A Skill Card goes to its target.\n\nSelect End Turn to end the Play Phase. There is no timer.",
      resolutionPhase:
        "In the Resolution Phase, your Units act by themselves. You do not control them.\n\nThey act Lane by Lane, from Lane 1 to the last Lane. In each Lane, the Unit nearest to the enemy Hero acts first. Each Unit moves, then it attacks. A Unit that you summoned in this Turn also acts.\n\nThe enemy Units do not act. They can only use Retaliation and First Strike.",
      endStep:
        "The End Step is the last part of your Turn. Burn and Poison damage hit your Units. Then the timed effects go down by 1, and Units with 0 HP leave the Board.\n\nThen the enemy takes its Turn.",
      suddenDeath:
        "Sudden Death makes each Battle end. From Turn {turn}, the Hero of the active Side takes 1 damage in each Start Step. From Turn {double}, the damage is 2.\n\nIf no Side has won at the end of Turn {limit}, the enemy wins.",
      routed:
        "A Side is Routed when it has no Units on the Board and no cards in its Hand and its Deck. A Routed Side cannot act again, so it loses the Battle.\n\nThis rule is the same for you and for the enemy.",
      defeated:
        "A Hero with 0 HP is Defeated. When all the Heroes of a Side are Defeated, that Side loses the Battle.\n\nIn a Stage, each Side has 1 Hero, so a Hero at 0 HP ends the Battle.",
      creatureCard:
        "A Creature Card summons a Unit onto the Board. It has a Race, a Role, Attack, HP and Speed. Some Creature Cards have Keywords.\n\nWhen the Unit dies, the card goes to your Graveyard.",
      skillCard:
        "A Skill Card has a one-time effect, for example damage to an enemy Unit. It has a Class. Only a Hero of the same Class can use it.\n\nAfter the effect, Recall can send the card back to your Hand.",
      hand: "Your Hand is the cards that your Hero holds in a Battle. They show at the bottom of the screen.\n\nAt the start of a Battle, your Hero draws {start} cards. Each card in the Hand shows its Countdown. The Hand keeps the order in which the cards came into it.",
      handLimit:
        "Your Hand can hold {limit} cards at most. When your Hand is full, your Hero does not draw, and the card stays in the Deck.",
      deck: "Your Deck is the cards that your Hero brings into a Battle. You build it in the Deck builder.\n\nA Deck can have {copies} copies of one card at most. It can have only the Skill Cards of the Class of your Hero.\n\nIn a Battle, the Deck holds only the cards that your Hero did not draw yet.",
      graveyard:
        "The Graveyard holds your cards that are used or dead. A Creature Card goes there when its Unit dies. A Skill Card goes there when Recall does not send it back.",
      countdown:
        "The Countdown is the number of Turns that a card must tick before it is Ready. It shows in the top-left corner of the card.\n\nIn your Start Step, the Countdown of each Ticking Card goes down by 1. The Rank of a card does not change its Countdown.",
      tickingCard:
        "The Ticking Cards are the {count} oldest cards in your Hand that are not Ready. Only Ticking Cards count down, and their hourglass turns.\n\nThe oldest card is the card that came into the Hand first.",
      waitingCard:
        "A Waiting Card is a card in your Hand that is not Ready and is not a Ticking Card. Its Countdown does not go down.\n\nIt becomes a Ticking Card when an older card becomes Ready or leaves the Hand.",
      ready:
        "A card with a Countdown of 0 is Ready. Only Ready cards can be played. A Ready card glows in your Hand.",
      recall:
        "Recall is the chance that a Skill Card goes back to your Hand after its effect. The Rank of the card sets the chance: from {low}% at Common to {high}% at Legendary.\n\nA card that goes back has its full Countdown again. Else it goes to the Graveyard.",
      countdownLimit:
        "The Countdown Limit is the maximum sum of the Countdowns of the cards in your Deck. Each card counts, also a Skill Card.\n\nAt Player level 1, the limit is {first}. It goes up with your Player level. An enemy Deck in a Stage does not have the limit.",
      unit: "A Unit is a figure on the Board. A Creature Card puts it there.\n\nA Unit shows its Attack and HP at its feet. Your Units face the enemy Hero, and the enemy Units face your Hero.",
      attack:
        "Attack is the damage that a Unit deals with one attack. The Armor of the target can make the damage smaller.\n\nA Unit with Attack 0 on its card never attacks, also with a bonus. A higher Rank gives more Attack.",
      hp: "HP is the health of a Unit or a Hero. Damage makes it lower, and a heal gives it back up to its maximum.\n\nAt 0 HP, a Unit leaves the Board, and a Hero is Defeated. A higher Rank gives more HP.",
      speed:
        "Speed is the maximum number of Squares that a Unit moves forward in one Turn. A Unit with Speed 0 never moves.",
      range:
        "Range is the maximum number of Squares in front of a Ranged Unit at which it attacks.\n\nA Ranged Support has Range 2, and a Shooter has Range 3.",
      melee:
        "A Melee Unit attacks the enemy Unit in the next Square in front of it.\n\nWhen it is in its last Column and no enemy Unit is in front of it, it attacks the enemy Hero.",
      ranged:
        "A Ranged Unit attacks the nearest enemy Unit in front of it, in its Lane and in its Range. It does not move when an enemy Unit is in its Range.\n\nWhen no enemy Unit is in its Range and the enemy Hero is, it attacks the enemy Hero. The enemy Hero is 1 Square past the last Column.",
      movement:
        "In its action, a Unit first moves forward along its Lane, up to its Speed.\n\nIt moves through friendly Units, but it stops before an enemy Unit. It always stops in an empty Square. A Flying Unit moves over all Units.",
      status:
        "A Status is an effect that stays on a Unit. Fire and Frost damage and some Keywords give Statuses.\n\nA Unit shows its Statuses as icons above it. The Card Details of the Unit show each Status with its rule.",
      damageType:
        "Each attack and each damage effect has a Damage Type: Physical, Fire, Frost or Holy.\n\nOn a card, the Damage Type shows as the icon and the color of the Attack.",
      damagePhysical: "Physical: normal damage. Armor reduces it.",
      race: "The Race is the people that a Creature Card fights for. It shows on the emblem in the top-right corner of the card.\n\nA Deck can mix all Races. Each Race has its own style of play.",
      raceHuman:
        "Humans and stout folk of the river towns. They hold the line with strong Armor, Walls and support for their friends.",
      raceElf:
        "Elves of the old forests, and the plant spirits that fight with them. They control the Lanes from range, with healing and Poison.",
      raceUndead:
        "Old spirits that wear bones and armor. Many small Units that get stronger together and come back.",
      raceOrc:
        "Orc tribes of the badlands, and their beasts. Fast and loud, with high Attack and low HP. They rush the enemy Hero.",
      raceGoblin:
        "Goblins of the hill mines: tinkers, thieves and bomb makers. Small Units that make the plan of the enemy slower.",
      raceFeral:
        "Wild creatures of the peaks and the deep caves. They serve no people. They are few, huge and slow, with high Attack and HP.",
      class:
        "The Class of a Hero sets which Skill Cards its Deck can hold. You select the Class of each Deck in the Deck builder.\n\nA Skill Card shows its Class on its emblem.",
      classWarrior:
        "Bonuses and speed. Warrior Skill Cards make your cards Ready sooner and give Armor to your Units.",
      classRanger: "Control, and damage to the enemy Hero.",
      classMage:
        "Area damage. Mage Skill Cards hit enemy Units with Fire and Frost.",
      classPriest: "Healing, protection and Units that come back.",
      role: "The Role is the job of a Creature Card in a Battle. It helps you read a card. No rule uses it, but it sets the Range of a Ranged Unit.",
      roleFrontliner:
        "High HP and low Speed. A Frontliner holds its Lane against enemy Units.",
      roleStriker: "High Attack and low HP. A Striker kills enemy Units.",
      roleRunner:
        "High Speed, or Flying. A Runner gets to the enemy Hero quickly.",
      roleShooter:
        "A Ranged Unit with Range 3. A Shooter stays back and attacks.",
      roleSupport:
        "A Support makes other Units better, for example with Rally or Regeneration. It is Melee, or Ranged with Range 2.",
      roleWall:
        "A Wall blocks its Lane for enemy Units. Each Wall has the Wall Keyword.",
      rank: "The Rank is the power grade of one copy of a card: Common, Uncommon, Rare, Epic or Legendary.\n\nA higher Rank gives more Attack and HP, more Recall, and sometimes a higher Keyword value. The Countdown does not change with the Rank.\n\nEach card has a lowest Rank. A copy is never below it.",
      rankGems:
        "The Rank Gems at the top of a card show its Rank: 1 grey gem for Common, up to 5 orange gems for Legendary.\n\nThe number of gems always shows the Rank, so you do not need the color.",
      stars:
        "A Stage win gives 1 to 3 Stars. 1 Star: win the Battle. 2 Stars: win with half of your Hero HP or more. 3 Stars: win with half of your Hero HP or more, before Turn 15.\n\nThe Campaign keeps your best Stars for each Stage. The Stars of a Region open its chests.",
      playerLevel:
        "Your Player level goes up with XP. You get XP from each Battle, also from a loss.\n\nA higher level gives your Hero more HP, a larger Deck and a higher Countdown Limit. Each Stage shows a Recommended level.",
      coin: "Coin is the currency that you earn in Battles. It pays for Deck Slots. Later, it also pays for Packs, Combine and Gear.\n\nCoin shows as Gold, Silver and Copper: 100 Copper is 1 Silver, and 100 Silver is 1 Gold. They are one currency with one balance.",
    },
    aliases: {
      board: "battlefield, field, map, grid, arena",
      lane: "row, path, track",
      square: "tile, cell, slot",
      side: "team, party",
      hero: "commander, avatar, general, player",
      turn: "round, move",
      resolutionPhase: "combat phase, battle phase, auto phase",
      suddenDeath: "fatigue, overtime",
      routed: "out of cards, surrender, forfeit",
      defeated: "dead, killed, knocked out",
      creatureCard: "minion card, unit card, troop card",
      skillCard: "spell, ability card",
      handLimit: "hand size, max hand",
      deck: "library, draw pile, loadout",
      graveyard: "discard pile, cemetery, crypt",
      countdown: "mana, cost, cooldown, timer",
      ready: "playable, available",
      recall: "mastery, return chance, recycle",
      countdownLimit: "deck cost, leadership, mana cap",
      unit: "minion, creature, troop, character",
      hp: "health, life, hit points",
      range: "reach, attack distance",
      movement: "walk, advance, march",
      keywordCharge: "haste, rush, dash, sprint",
      keywordKnockback: "push, shove, repel",
      keywordLastBreath: "deathrattle, death effect",
      keywordTrample: "cleave, overrun, pierce",
      keywordWall: "taunt, blocker, barricade",
      keywordEntangle: "root, snare",
      keywordPoison: "venom, toxin",
      keywordSabotage: "delay, stall, disrupt",
      keywordUnique: "legend rule, singleton",
      keywordRetaliation: "thorns, counterattack",
      status: "debuff, condition, ailment",
      statusFreeze: "stun, chill",
      statusBleed: "wound, anti-heal, healing reduction",
      statusHobble: "slow, cripple, fatigue",
      damageType: "element",
      race: "faction, tribe, kingdom",
      class: "job, profession",
      role: "unit type, archetype",
      rank: "rarity, tier, quality",
      rankGems: "pips",
      stars: "score, rating",
      playerLevel: "account level, xp",
      coin: "gold, silver, copper, money",
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
    countdownSum: "Countdown {sum} / {limit}",
    sizeMin: "At least {min}",
    add: "Add {name}, {rank}, Countdown {countdown}. Copies left: {left}.",
    remove: "Remove one {name}, {rank}. In this Deck: {count}.",
    left: "×{count}",
    blocked: {
      none: "All in Deck",
      full: "Deck is full",
      countdown: "Countdown Limit",
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
      overCountdownLimit:
        "The Countdowns of the cards can add up to {limit} at most. They add up to {countdown}.",
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
    charge: "Charge {value}",
    entangle: "Entangle",
    firstStrike: "First Strike",
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
    charge: "+{value} Speed in the Turn when you summon this Unit.",
    entangle:
      "The enemy Unit it hits has Speed 0 in its next action. That Unit can still attack.",
    firstStrike:
      "When an enemy melee Unit attacks this Unit, this Unit deals its damage first. If the attacker dies, its attack does not occur.",
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
    wall: "This Unit can't move and can't attack. You can summon it into the 5 Squares nearest to your Hero. It blocks enemy Units in its Lane, and a push never moves it.",
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
      badlandRunt: {
        name: "Badland Runt",
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
        flavor: "You hear him long before you see him.",
      },
      skyreaver: {
        name: "Skyreaver",
        flavor: "She steals hats from very high up.",
      },
      packStalker: {
        name: "Pack Stalker",
        flavor: "He always knows where you are. Mostly behind you.",
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
      cinderhornBreaker: {
        name: "Cinderhorn Breaker",
        flavor: "She never waits for the gate to open.",
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
        name: "Boss Snikkit",
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
    elf: {
      rootboundGuard: {
        name: "Rootbound Guard",
        flavor: "He has held this path since it was somewhere else.",
      },
      brambleDuelist: {
        name: "Bramble Duelist",
        flavor: "One cut for honor. Two because the hedge was rude.",
      },
      fernwingCourier: {
        name: "Fernwing Courier",
        flavor: "The message says urgent. The parcel is a sandwich.",
      },
      mosspitcherLookout: {
        name: "Mosspitcher Lookout",
        flavor: "He can hear a boot step. He cannot hear advice.",
      },
      acornTender: {
        name: "Acorn Tender",
        flavor: "Growth takes patience. Wilt takes less.",
      },
      gladeTurnblade: {
        name: "Glade Turnblade",
        flavor: "Behind him is only another front.",
      },
      canopySkirmisher: {
        name: "Canopy Skirmisher",
        flavor: "The stairs were deemed inefficient.",
      },
      thornlineArcher: {
        name: "Thornline Archer",
        flavor: "The arrow leaves. The ache stays.",
      },
      dewkeeper: {
        name: "Dewkeeper",
        flavor: "She collects morning dew. Afternoon dew is paperwork.",
      },
      brambleNest: {
        name: "Bramble Nest",
        flavor: "It is not blocking the path. It is the path now.",
      },
      amberwingDart: {
        name: "Amberwing Dart",
        flavor: "It stops armies and loses arguments with windows.",
      },
      elderreedDartmaster: {
        name: "Elderreed Dartmaster",
        flavor: "She waits for the perfect shot. Lunch waits too.",
      },
      seedwindShepherd: {
        name: "Seedwind Shepherd",
        flavor: "Every seed has a destination. He stays to water them.",
      },
      canopyVinewarden: {
        name: "Canopy Vinewarden",
        flavor: "The warning was yesterday.",
      },
      lethielFirstGardener: {
        name: "Lethiel, First Gardener",
        flavor: "The forest grew wild. Lethiel called it adequate.",
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
