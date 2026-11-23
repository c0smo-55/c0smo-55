// TikTok LIVE → Minecraft
//
//   npm start            connect to your TikTok LIVE + Minecraft server
//   npm run test-gifts   no TikTok: type fake gifts yourself to test in Minecraft
//   npm run dry          no TikTok, no Minecraft: just prints the commands

import readline from 'node:readline';
import { Rcon } from 'rcon-client';
import config from './config.js';
import { Game } from './game.js';

const args = new Set(process.argv.slice(2));
const SIMULATE = args.has('--simulate');
const DRY = args.has('--dry');

// ---------- Minecraft connection ----------

let rcon = null;
let connecting = null;

async function getRcon() {
  if (rcon) return rcon;
  if (!connecting) {
    connecting = Rcon.connect(config.rcon)
      .then((r) => {
        console.log('✅ Connected to Minecraft');
        r.on('end', () => { console.log('⚠️  Minecraft connection closed'); rcon = null; });
        r.on('error', () => { rcon = null; });
        rcon = r;
        return r;
      })
      .finally(() => { connecting = null; });
  }
  return connecting;
}

// Commands go out one at a time, in order.
let queue = Promise.resolve();
function send(command) {
  queue = queue.then(async () => {
    if (DRY) { console.log('   > ' + command); return; }
    try {
      const r = await getRcon();
      const reply = await r.send(command);
      if (/unknown|incorrect|expected|invalid|no player/i.test(reply)) {
        console.log(`   ⚠️ Minecraft didn't like: ${command}\n      → ${reply}`);
      }
    } catch (err) {
      rcon = null;
      console.log(`   ❌ Couldn't send to Minecraft (${err.message}). Is the server running with RCON on?`);
    }
  });
  return queue;
}

const game = new Game(config, send);

// ---------- Test mode: type gifts yourself ----------

function startSimulator() {
  console.log(`
🧪 TEST MODE (${DRY ? 'printing commands only' : 'sending to Minecraft'}) — mode: ${config.mode}
Type things like:
  rose            1 Rose
  rose 20         a 20x Rose streak
  heart me        a Heart Me
  galaxy          a Galaxy (type it again to "save")
  likes 250       250 likes
  follow bob      bob follows
  chat bob !zombie
  mode parkour    switch mode (survival / parkour)
  quit
`);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.on('line', async (line) => {
    const input = line.trim();
    if (!input) return;
    const [first, ...rest] = input.split(/\s+/);
    const cmd = first.toLowerCase();
    if (cmd === 'quit' || cmd === 'exit') { game.stop(); process.exit(0); }
    if (cmd === 'mode') return game.serial(() => { config.mode = rest[0]; console.log(`Mode is now ${config.mode}`); });
    if (cmd === 'likes') return game.onLikes({ liker: 'tester', likeCount: Number(rest[0]) || 100 });
    if (cmd === 'follow') return game.onFollow({ follower: rest[0] || 'tester' });
    if (cmd === 'chat') return game.onChat({ viewer: rest[0] || 'tester', comment: rest.slice(1).join(' ') });
    // Otherwise it's a gift: "<gift name> [count]"
    const words = input.split(/\s+/);
    const last = Number(words[words.length - 1]);
    const count = Number.isInteger(last) && last > 0 ? (words.pop(), last) : 1;
    await game.onGift({ gifter: 'tester', giftName: words.join(' '), count });
  });
}

// ---------- Real TikTok LIVE ----------

async function startTikTok() {
  const { TikTokLiveConnection, WebcastEvent, ControlEvent } = await import('tiktok-live-connector');
  const connection = new TikTokLiveConnection(config.tiktokUsername, { enableExtendedGiftInfo: true });

  connection.on(WebcastEvent.GIFT, (data) => {
    const giftType = data.giftDetails?.giftType;
    if (giftType === 1 && !data.repeatEnd) return; // streak still going, wait for the end
    game.onGift({
      gifter: data.user?.uniqueId ?? data.user?.nickname,
      giftName: data.giftDetails?.giftName ?? data.extendedGiftInfo?.name ?? `gift #${data.giftId}`,
      count: data.repeatCount || 1,
    });
  });

  connection.on(WebcastEvent.LIKE, (data) => {
    game.onLikes({ liker: data.user?.uniqueId ?? data.user?.nickname, likeCount: data.likeCount || 0 });
  });

  connection.on(WebcastEvent.FOLLOW, (data) => {
    game.onFollow({ follower: data.user?.uniqueId ?? data.user?.nickname });
  });

  connection.on(WebcastEvent.CHAT, (data) => {
    game.onChat({ viewer: data.user?.uniqueId ?? data.user?.nickname, comment: data.comment });
  });

  const connect = async () => {
    try {
      await connection.connect();
      console.log(`✅ Connected to @${config.tiktokUsername}'s LIVE — mode: ${config.mode}`);
    } catch (err) {
      console.log(`⏳ Couldn't connect to TikTok LIVE (${err.message}). Are you live? Retrying in 15s...`);
      setTimeout(connect, 15000);
    }
  };

  connection.on(ControlEvent.DISCONNECTED, () => {
    console.log('⚠️  TikTok disconnected. Reconnecting in 15s...');
    setTimeout(connect, 15000);
  });

  connect();
}

// ---------- Go ----------

if (!DRY) await getRcon().catch((err) => {
  console.log(`❌ Couldn't reach Minecraft at ${config.rcon.host}:${config.rcon.port} (${err.message}).`);
  console.log('   Start your server first and check the RCON settings (see README). Will keep trying when gifts come in.');
});

if (SIMULATE || DRY) startSimulator();
else startTikTok();
