// Turns TikTok events (gifts, likes, follows, chat) into Minecraft commands.
// `send(command)` is given to us by index.js and talks to the server.

import fs from 'node:fs';

const BOSSBAR = 'tiktok:reset';
const LEVEL_BAR = 'tiktok:level';
const LEVELS_FILE = new URL('./levels.json', import.meta.url);

// "Hat & Mustache" / "hat and mustache" / "HatAndMustache" all match.
export function normalizeGiftName(name) {
  return String(name ?? '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
}

// Minecraft only likes simple names; strip anything weird out of TikTok usernames.
export function safeName(name) {
  const cleaned = String(name ?? '').replace(/[^A-Za-z0-9_.]/g, '').slice(0, 24);
  return cleaned || 'someone';
}

const text = (msg, color = 'white') => JSON.stringify({ text: msg, color });

export class Game {
  constructor(config, send, log = console.log) {
    this.config = config;
    this.send = send;
    this.log = log;
    this.cooldowns = new Map();   // action key -> time it can fire again
    this.chatCooldowns = new Map(); // viewer -> time they can use a chat command again
    this.likeProgress = 0;
    this.countdown = null;        // { gift, secondsLeft, timer }
    this.chain = Promise.resolve();
    this.levels = this.loadLevels(); // parkour level start points, index 0 = Level 1
    this.currentLevel = 1;
    this.bestLevel = 1;
    this.tracker = null;
    this.shownLevel = null;
  }

  // Handle one TikTok event at a time so two gifts never get mixed up.
  serial(fn) {
    const next = this.chain.then(fn).catch((err) => this.log(`   ❌ ${err.message}`));
    this.chain = next;
    return next;
  }

  get mode() { return this.config.mode; }
  get player() { return this.config.minecraftPlayer; }

  findActions(table, name) {
    const wanted = normalizeGiftName(name);
    for (const [key, actions] of Object.entries(table ?? {})) {
      if (normalizeGiftName(key) === wanted) return { key, actions };
    }
    return null;
  }

  // ---------- TikTok events ----------

  onGift(event) { return this.serial(() => this._onGift(event)); }

  async _onGift({ gifter, giftName, count = 1 }) {
    const who = safeName(gifter);
    const found = this.findActions(this.config.gifts?.[this.mode], giftName);
    if (!found) {
      this.log(`🎁 ${who} sent ${count}x "${giftName}" (not in config.js — add it there to make it do something)`);
      return;
    }
    this.log(`🎁 ${who} sent ${count}x ${found.key}`);
    await this.say(`${who} sent ${count > 1 ? count + 'x ' : ''}${found.key}!`, 'gold');
    for (const [i, action] of found.actions.entries()) {
      await this.run(action, { who, count, source: found.key, key: `gift:${found.key}:${i}` });
    }
  }

  onLikes(event) { return this.serial(() => this._onLikes(event)); }

  async _onLikes({ liker, likeCount }) {
    const every = this.config.likes?.every;
    const pool = this.config.likes?.[this.mode];
    if (!every || !pool?.length) return;
    this.likeProgress += likeCount;
    while (this.likeProgress >= every) {
      this.likeProgress -= every;
      const action = pool[Math.floor(Math.random() * pool.length)];
      const who = safeName(liker);
      this.log(`❤️  ${every} likes reached (last like from ${who})`);
      await this.say(`${every} likes! Thanks ${who}`, 'light_purple');
      await this.run(action, { who, count: 1, source: 'likes', key: null });
    }
  }

  onFollow(event) { return this.serial(() => this._onFollow(event)); }

  async _onFollow({ follower }) {
    if (this.mode !== 'survival') return;
    const who = safeName(follower);
    this.log(`➕ ${who} followed`);
    await this.say(`${who} followed!`, 'aqua');
    for (const action of this.config.follow ?? []) {
      await this.run(action, { who, count: 1, source: 'follow', key: null });
    }
  }

  onChat(event) { return this.serial(() => this._onChat(event)); }

  async _onChat({ viewer, comment }) {
    const table = this.config.chatCommands?.[this.mode];
    const word = String(comment ?? '').trim().split(/\s+/)[0]?.toLowerCase();
    const actions = table?.[word];
    if (!actions) return;
    const who = safeName(viewer);
    const now = Date.now();
    if ((this.chatCooldowns.get(who) ?? 0) > now) return;
    this.chatCooldowns.set(who, now + (this.config.chatCommands.cooldownSeconds ?? 60) * 1000);
    this.log(`💬 ${who}: ${word}`);
    for (const action of actions) {
      await this.run(action, { who, count: 1, source: word, key: null });
    }
  }

  // ---------- Actions ----------

  async run(action, { who, count, source, key }) {
    if (action.cooldownSeconds && key) {
      const now = Date.now();
      const readyAt = this.cooldowns.get(key) ?? 0;
      if (readyAt > now) {
        const left = Math.ceil((readyAt - now) / 1000);
        this.log(`   ⏳ ${source} on cooldown (${left}s left)`);
        await this.actionbar(`${source} is on cooldown (${left}s)`, 'gray');
        return;
      }
      this.cooldowns.set(key, now + action.cooldownSeconds * 1000);
      count = 1; // a cooldown action only fires once even in a streak
    }

    const p = this.player;
    switch (action.type) {
      case 'mob': {
        let total = (action.count ?? 1) * count;
        const cap = this.config.maxMobsPerGift;
        if (cap > 0 && total > cap) total = cap;
        for (let i = 0; i < total; i++) await this.summon(action.mob, who, action.nbt);
        break;
      }
      case 'kit': {
        const items = this.config.kits?.[action.kit];
        if (!items) { this.log(`   ⚠️ No kit called "${action.kit}" in config.js`); break; }
        for (let i = 0; i < count; i++) {
          for (const item of items) await this.send(`give ${p} ${item}`);
        }
        await this.title(action.kit === 'god' ? 'GOD KIT!' : 'Kit!', `from ${who}`, 'green');
        break;
      }
      case 'clearInventory':
        await this.send(`clear ${p}`);
        await this.title('INVENTORY CLEARED', `by ${who}`, 'red');
        break;
      case 'resetCountdown':
        await this.startCountdown(source, who);
        break;
      case 'save':
        if (this.countdown) await this.saveRun(who);
        else this.log(`   🛡️ ${source} is a save gift, but no reset countdown is running`);
        break;
      case 'reset':
        await this.reset(who);
        break;
      case 'levelUp':
        await this.moveLevels((action.levels ?? 1) * count, who);
        break;
      case 'levelDown':
        await this.moveLevels(-(action.levels ?? 1) * count, who);
        break;
      case 'punch':
        for (let i = 0; i < (action.count ?? 1) * count; i++) await this.punch();
        await this.actionbar(`👊 ${who} punched you!`, 'red');
        break;
      case 'effect': {
        const amp = Math.max(0, (action.level ?? 1) - 1);
        await this.send(`effect give ${p} ${action.effect} ${action.seconds ?? 10} ${amp}`);
        break;
      }
      case 'command':
        for (let i = 0; i < count; i++) {
          await this.send(action.command.replaceAll('{player}', p).replaceAll('{gifter}', who));
        }
        break;
      default:
        this.log(`   ⚠️ Unknown action type "${action.type}"`);
    }
  }

  async summon(mob, who, extraNbt) {
    // Spawn 3–6 blocks away in a random direction so it's not inside you
    const angle = Math.random() * Math.PI * 2;
    const dist = 3 + Math.random() * 3;
    const x = (Math.cos(angle) * dist).toFixed(1);
    const z = (Math.sin(angle) * dist).toFixed(1);
    const nbt = [];
    if (this.config.nameMobsAfterGifter) nbt.push(`CustomName:"${who}"`, 'CustomNameVisible:1b');
    if (extraNbt) nbt.push(extraNbt);
    const data = nbt.length ? ` {${nbt.join(',')}}` : '';
    await this.send(`execute at ${this.player} run summon ${mob} ~${x} ~ ~${z}${data}`);
  }

  async saveRun(who) {
    clearInterval(this.countdown.timer);
    this.countdown = null;
    await this.send(`bossbar remove ${BOSSBAR}`);
    this.log(`   🛡️ ${who} SAVED the run!`);
    await this.title('SAVED!', `${who} saved the run`, 'green');
  }

  // Gifts that can save you: any gift with a 'save' action.
  saveGiftNames() {
    const names = [];
    for (const [name, actions] of Object.entries(this.config.gifts?.[this.mode] ?? {})) {
      if (actions.some((a) => a.type === 'save') && !names.includes(name)) names.push(name);
    }
    return names.join(' or ');
  }

  // Starts the reset countdown. Only a 'save' gift (e.g. Watermelon) can stop it.
  async startCountdown(gift, who) {
    if (this.countdown) {
      this.log(`   ⚠️ ${gift} from ${who}, but a reset countdown is already running`);
      return;
    }
    const seconds = this.config.resetCountdownSeconds ?? 30;
    const savers = this.saveGiftNames() || 'save gift';
    this.log(`   ⚠️ ${who} started a ${seconds}s reset countdown (send a ${savers} to save)`);
    const label = (s) => text(`⚠ RESET IN ${s}s — send a ${savers} to save! (${who})`, 'red');
    await this.send(`bossbar add ${BOSSBAR} ${label(seconds)}`);
    await this.send(`bossbar set ${BOSSBAR} name ${label(seconds)}`);
    await this.send(`bossbar set ${BOSSBAR} color red`);
    await this.send(`bossbar set ${BOSSBAR} max ${seconds}`);
    await this.send(`bossbar set ${BOSSBAR} value ${seconds}`);
    await this.send(`bossbar set ${BOSSBAR} players @a`);
    await this.title('RESET INCOMING', `send a ${savers} to save!`, 'red');

    const state = { gift, secondsLeft: seconds, timer: null };
    state.timer = setInterval(async () => {
      if (this.countdown !== state) return;
      state.secondsLeft -= 1;
      if (state.secondsLeft <= 0) {
        clearInterval(state.timer);
        this.countdown = null;
        await this.send(`bossbar remove ${BOSSBAR}`);
        await this.reset(who);
        return;
      }
      await this.send(`bossbar set ${BOSSBAR} value ${state.secondsLeft}`);
      await this.send(`bossbar set ${BOSSBAR} name ${label(state.secondsLeft)}`);
    }, 1000);
    this.countdown = state;
  }

  async reset(who) {
    const p = this.player;
    this.log(`   💀 RESET by ${who}`);
    if (this.mode === 'parkour') {
      await this.send(`effect clear ${p}`);
      if (this.levels.length) {
        await this.teleportToLevel(1);
      } else {
        const { x, y, z } = this.config.parkourStart;
        await this.send(`tp ${p} ${x} ${y} ${z}`);
      }
    } else {
      await this.send(`clear ${p}`);
      await this.send(`effect clear ${p}`);
      await this.send(`xp set ${p} 0 levels`);
      await this.send(`xp set ${p} 0 points`);
      await this.send(`kill ${p}`);
    }
    await this.title('RESET!', `thanks ${who}...`, 'dark_red');
  }

  // ---------- On-screen messages ----------

  async say(msg, color) {
    await this.send(`tellraw @a [${text('[TikTok] ', 'light_purple')},${text(msg, color)}]`);
  }

  async actionbar(msg, color) {
    await this.send(`title ${this.player} actionbar ${text(msg, color)}`);
  }

  async title(big, small, color) {
    await this.send(`title ${this.player} subtitle ${text(small, 'white')}`);
    await this.send(`title ${this.player} title ${text(big, color)}`);
  }

  // ---------- Parkour levels ----------

  loadLevels() {
    try { return JSON.parse(fs.readFileSync(LEVELS_FILE, 'utf8')); } catch { return []; }
  }

  saveLevels() {
    fs.writeFileSync(LEVELS_FILE, JSON.stringify(this.levels, null, 2));
  }

  async getPosition() {
    const reply = await this.send(`data get entity ${this.player} Pos`);
    const nums = String(reply ?? '').match(/-?\d+(?:\.\d+)?(?=d)/g);
    if (!nums || nums.length < 3) return null;
    const [x, y, z] = nums.map(Number);
    return { x, y, z };
  }

  async saveLevelHere(n) {
    if (!Number.isInteger(n) || n < 1) { this.log('Usage: setlevel 5'); return; }
    const pos = await this.getPosition();
    if (!pos) { this.log(`Couldn't get your position. Is the server running and are you in the game as ${this.player}?`); return; }
    const spot = { x: +pos.x.toFixed(2), y: +pos.y.toFixed(2), z: +pos.z.toFixed(2) };
    this.levels[n - 1] = spot;
    this.saveLevels();
    this.currentLevel = n;
    this.bestLevel = 1; // walking around while setting up shouldn't count as a record
    this.log(`✅ Level ${n} saved at ${spot.x} ${spot.y} ${spot.z}`);
    await this.actionbar(`Level ${n} saved here`, 'green');
    const gaps = [];
    for (let i = 0; i < this.levels.length; i++) if (!this.levels[i]) gaps.push(i + 1);
    if (gaps.length) this.log(`   (still missing: Level ${gaps.join(', ')})`);
  }

  listLevels() {
    if (!this.levels.length) { this.log('No levels yet. Stand at the start of Level 1 and type: setlevel 1'); return; }
    this.levels.forEach((l, i) => this.log(`  Level ${i + 1}: ${l ? `${l.x} ${l.y} ${l.z}` : '(not set)'}`));
  }

  async goToLevel(n) {
    if (!this.levels[n - 1]) { this.log(`Level ${n} isn't saved yet`); return; }
    await this.teleportToLevel(n);
  }

  async teleportToLevel(n) {
    const spot = this.levels[n - 1];
    if (!spot) return;
    await this.send(`tp ${this.player} ${spot.x} ${spot.y} ${spot.z}`);
    this.currentLevel = n;
    await this.updateLevelBar();
  }

  async moveLevels(delta, who) {
    const total = this.levels.length;
    if (!total) { this.log('   ⚠️ No parkour levels saved yet (use setlevel in this window)'); return; }
    let target = Math.min(total, Math.max(1, this.currentLevel + delta));
    // Skip over any levels that weren't saved
    while (!this.levels[target - 1] && target > 1) target--;
    if (target === this.currentLevel) {
      this.log(`   Already at Level ${target}`);
      return;
    }
    const up = target > this.currentLevel;
    this.log(`   ${up ? '⬆️' : '⬇️'} Level ${this.currentLevel} → ${target} (${who})`);
    await this.teleportToLevel(target);
    await this.title(up ? `⬆ LEVEL ${target}` : `⬇ LEVEL ${target}`, `${who} sent you ${up ? 'up' : 'down'}`, up ? 'green' : 'red');
  }

  // A wind charge flies into you from a random side and knocks you away.
  async punch() {
    const angle = Math.random() * Math.PI * 2;
    const dx = Math.cos(angle), dz = Math.sin(angle);
    const from = (v) => (v * 1.5).toFixed(2);
    const speed = (v) => (-v * 0.6).toFixed(2);
    await this.send(
      `execute at ${this.player} run summon wind_charge ~${from(dx)} ~1 ~${from(dz)} {Motion:[${speed(dx)},0.0,${speed(dz)}]}`,
    );
  }

  // Checks where you are every second to know which level you're on.
  startLevelTracker() {
    let busy = false;
    this.tracker = setInterval(async () => {
      if (busy || this.mode !== 'parkour' || !this.levels.length) return;
      busy = true;
      try {
        const pos = await this.getPosition();
        if (pos) {
          let best = null, bestDist = Infinity;
          this.levels.forEach((l, i) => {
            if (!l) return;
            const d = (l.x - pos.x) ** 2 + (l.y - pos.y) ** 2 + (l.z - pos.z) ** 2;
            if (d < bestDist) { bestDist = d; best = i + 1; }
          });
          if (best) this.currentLevel = best;
        }
        await this.updateLevelBar();
      } finally {
        busy = false;
      }
    }, 1000);
  }

  async updateLevelBar() {
    if (this.mode !== 'parkour' || !this.levels.length) return;
    const total = this.levels.length;
    if (this.currentLevel > this.bestLevel) {
      this.bestLevel = this.currentLevel;
      if (this.bestLevel > 1) this.log(`   🏆 New best: Level ${this.bestLevel}`);
    }
    const key = `${this.currentLevel}/${this.bestLevel}/${total}`;
    if (key === this.shownLevel) return;
    const name = text(`LEVEL ${this.currentLevel} / ${total}   ·   Best: ${this.bestLevel}`, 'green');
    if (this.shownLevel === null) {
      await this.send(`bossbar add ${LEVEL_BAR} ${name}`);
      await this.send(`bossbar set ${LEVEL_BAR} color green`);
      await this.send(`bossbar set ${LEVEL_BAR} players @a`);
    }
    await this.send(`bossbar set ${LEVEL_BAR} name ${name}`);
    await this.send(`bossbar set ${LEVEL_BAR} max ${total}`);
    await this.send(`bossbar set ${LEVEL_BAR} value ${this.currentLevel}`);
    this.shownLevel = key;
  }

  resetBest() {
    this.bestLevel = this.currentLevel;
    this.log(`Best reset to Level ${this.bestLevel}`);
    return this.updateLevelBar();
  }

  setMode(mode) {
    return this.serial(async () => {
      if (!this.config.gifts?.[mode]) { this.log(`No mode called "${mode}" (try survival or parkour)`); return; }
      this.config.mode = mode;
      this.log(`Mode is now ${mode}`);
      if (mode !== 'parkour' && this.shownLevel !== null) {
        await this.send(`bossbar remove ${LEVEL_BAR}`);
        this.shownLevel = null;
      }
      await this.updateLevelBar();
    });
  }

  stop() {
    if (this.countdown) clearInterval(this.countdown.timer);
    if (this.tracker) clearInterval(this.tracker);
  }
}
