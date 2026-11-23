// ============================================================
//  TikTok LIVE → Minecraft — YOUR SETTINGS
//  Change the stuff in this file. You don't need to touch index.js.
// ============================================================

export default {
  // Your TikTok username (without the @)
  tiktokUsername: 'your_tiktok_name',

  // Your Minecraft player name (the one you play on)
  minecraftPlayer: 'YourMinecraftName',

  // Must match server.properties (see README)
  rcon: { host: 'localhost', port: 25575, password: 'change-me-please' },

  // Which game you're streaming right now: 'survival' (beat the game) or 'parkour'
  mode: 'survival',

  // Parkour: where a "reset" sends you if you haven't saved any levels yet
  parkourStart: { x: 0, y: 64, z: 0 },

  // Max mobs from ONE gift (or one gift streak). 0 = unlimited.
  maxMobsPerGift: 0,

  // Name spawned mobs after the gifter (e.g. a zombie called "xXdanXx")
  nameMobsAfterGifter: true,

  // How long chat has to save you after a reset-countdown gift
  resetCountdownSeconds: 30,

  // ----------------------------------------------------------
  //  GIFTS
  //  Name must match the gift name on TikTok. Capitals, spaces
  //  and "&" vs "and" don't matter. If a gift isn't listed,
  //  the script prints its exact name so you can add it here.
  //
  //  Action types:
  //    { type: 'mob', mob: 'zombie', count: 1 }
  //    { type: 'mob', mob: 'zombie', count: 1, nbt: 'IsBaby:1b' }   (extra mob data)
  //    { type: 'kit', kit: 'normal' }              (kits are below)
  //    { type: 'clearInventory' }
  //    { type: 'resetCountdown' }   reset in 30s unless someone sends a 'save' gift
  //    { type: 'save' }             stops a running reset countdown
  //    { type: 'reset' }            instant reset, no saving
  //    { type: 'effect', effect: 'speed', seconds: 15, level: 1 }   (level 1 = Speed I)
  //    { type: 'levelUp', levels: 1 } / { type: 'levelDown', levels: 1 }   (parkour)
  //    { type: 'punch', count: 1 }   wind charge knocks you sideways
  //    { type: 'command', command: 'time set night' }   any Minecraft command
  //
  //  Any action can have cooldownSeconds: 30 to stop it firing too often.
  //  In commands, {player} = you and {gifter} = whoever sent it.
  // ----------------------------------------------------------
  gifts: {
    survival: {
      'Rose': [{ type: 'mob', mob: 'zombie', count: 1 }],
      'Finger Heart': [{ type: 'mob', mob: 'skeleton', count: 2 }],
      'Doughnut': [{ type: 'mob', mob: 'creeper', count: 1 }],
      'Hat and Mustache': [{ type: 'mob', mob: 'spider', count: 3 }],
      'Heart Me': [{ type: 'kit', kit: 'normal' }],
      'Confetti': [{ type: 'kit', kit: 'god', cooldownSeconds: 30 }],
      'Money Gun': [{ type: 'clearInventory' }],
      'Galaxy': [{ type: 'resetCountdown' }],
      'Watermelon': [{ type: 'save' }],
      'Lion': [{ type: 'reset' }],
      'Universe': [{ type: 'reset' }],
    },

    // Parkour: every sabotage gift has a help gift at the same price.
    // Levels are saved by typing "setlevel 1", "setlevel 2"... in the script window (see README).
    parkour: {
      // ~1 coin
      'Rose': [{ type: 'punch', count: 1 }],
      'Heart Me': [
        { type: 'effect', effect: 'speed', seconds: 10, level: 1 },
        { type: 'effect', effect: 'jump_boost', seconds: 10, level: 1 },
      ],
      // 30 coins
      'Doughnut': [{ type: 'levelDown', levels: 1 }],
      // 'PUT 30-COIN GIFT HERE': [{ type: 'levelUp', levels: 1 }],
      // ~100 coins
      'Hat and Mustache': [{ type: 'levelDown', levels: 5 }],
      'Confetti': [{ type: 'levelUp', levels: 5 }],
      // ~1,000 coins
      'Galaxy': [{ type: 'resetCountdown' }],   // back to Level 1 in 30s...
      'Watermelon': [{ type: 'save' }],         // ...unless someone sends a Watermelon
      // Top gifts: straight back to Level 1
      'Lion': [{ type: 'reset' }],
      'Universe': [{ type: 'reset' }],
    },
  },

  // ----------------------------------------------------------
  //  KITS  (Minecraft Java 1.21.5 or newer item format)
  // ----------------------------------------------------------
  kits: {
    normal: [
      'iron_helmet', 'iron_chestplate', 'iron_leggings', 'iron_boots',
      'iron_sword', 'iron_axe', 'shield',
      'bow', 'arrow 16',
      'cooked_beef 16', 'golden_apple 2',
    ],
    god: [
      'netherite_helmet[enchantments={protection:4,unbreaking:3}]',
      'netherite_chestplate[enchantments={protection:4,unbreaking:3}]',
      'netherite_leggings[enchantments={protection:4,unbreaking:3}]',
      'netherite_boots[enchantments={protection:4,unbreaking:3}]',
      'netherite_sword[enchantments={sharpness:5}]',
      'netherite_axe[enchantments={sharpness:5}]',
      'bow[enchantments={power:5,infinity:1}]', 'arrow 1',
      'crossbow[enchantments={quick_charge:3,multishot:1}]', 'arrow 16',
      'trident[enchantments={loyalty:3,impaling:5}]',
      'mace[enchantments={density:5,wind_burst:1}]',
      'golden_apple 5',
      'ender_pearl 16',
    ],
  },

  // ----------------------------------------------------------
  //  FREE STUFF (for viewers who don't gift)
  // ----------------------------------------------------------

  // Every X likes, one random action from the list happens
  likes: {
    every: 100,   // parkour: every 100 likes = a punch
    survival: [
      { type: 'mob', mob: 'chicken', count: 5 },
      { type: 'mob', mob: 'silverfish', count: 3 },
      { type: 'mob', mob: 'zombie', count: 1, nbt: 'IsBaby:1b' },
      { type: 'command', command: 'execute at {player} run playsound entity.creeper.primed hostile {player} ~ ~ ~ 1 1' },
    ],
    parkour: [
      { type: 'punch', count: 1 },
    ],
  },

  // New follower → a chicken named after them (survival only)
  follow: [{ type: 'mob', mob: 'chicken', count: 1 }],

  // Chat commands. Each viewer can use one every cooldownSeconds.
  chatCommands: {
    cooldownSeconds: 60,
    survival: {
      '!zombie': [{ type: 'mob', mob: 'zombie', count: 1 }],
      '!chicken': [{ type: 'mob', mob: 'chicken', count: 1 }],
    },
    parkour: {},
  },
};
