// Turns TikTok events (gifts, likes, follows, chat) into Minecraft commands.
// `send(command)` is given to us by index.js and talks to the server.

const BOSSBAR = 'tiktok:reset';

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
      const { x, y, z } = this.config.parkourStart;
      await this.send(`effect clear ${p}`);
      await this.send(`tp ${p} ${x} ${y} ${z}`);
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

  stop() {
    if (this.countdown) clearInterval(this.countdown.timer);
  }
}
