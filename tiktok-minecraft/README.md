# TikTok LIVE → Minecraft

Viewers send gifts on your TikTok LIVE and stuff happens in your Minecraft world: mobs spawn, kits drop, inventories get wiped, runs get reset.

Two modes:
- **survival**: you try to beat the game while chat helps or sabotages you
- **parkour**: chat messes with your jumps

## What each gift does (default)

### Survival (beat the game)
| Gift | Effect |
|---|---|
| Rose | 1 zombie |
| Finger Heart | 2 skeletons |
| Doughnut | 1 creeper |
| Hat and Mustache | 3 spiders |
| Heart Me | Normal kit (iron) |
| Confetti | **God kit** (30s cooldown) |
| Money Gun | Clear inventory |
| Galaxy | **30s reset countdown**: only a Watermelon saves you |
| Watermelon | Saves you from the countdown |
| Lion / Universe | **Instant reset** |

### Parkour (levels): help and sabotage cost the same
| Price | Help ⬆️ | Sabotage ⬇️ |
|---|---|---|
| ~1 coin | Heart Me: Speed + Jump Boost 10s | Rose: 👊 punch (a wind charge knocks you sideways) |
| 30 coins | *(not picked yet)*: up 1 level | Doughnut: down 1 level |
| ~100 coins | Confetti: up 5 levels | Hat and Mustache: down 5 levels |
| ~1,000 coins | Watermelon: saves you from the countdown | Galaxy: back to Level 1 in 30s |
| Top gifts | | Lion / Universe: back to Level 1 |

Every 100 likes is a free 👊 punch too.
A bar at the top shows **LEVEL 7 / 20 · Best: 12**.

Also in survival:
- every **100 likes**: a random small effect (chickens, silverfish, a baby zombie, a fake creeper hiss)
- every **follow**: a chicken named after the follower
- chat commands **!zombie** and **!chicken** (each viewer once a minute)

Mobs are named after whoever sent the gift. There's no mob limit by default.

Change any of this in **`config.js`**.

---

## Setup (one time)

You need a PC with the Minecraft Launcher, and Minecraft **Java Edition 1.21.5 or newer**.

### 1. Install Node.js
Download the **LTS** version from https://nodejs.org and install it (click Next through everything).

### 2. Make a Minecraft server on your PC
1. Make a folder, e.g. `Documents\mc-server`.
2. Download **Paper** (a free, fast Minecraft server) from https://papermc.io/downloads/paper. Pick the same version you play, and put the `.jar` in that folder. Rename it `paper.jar`.
3. In that folder, make a file called `start.bat` containing:
   ```
   java -Xmx4G -jar paper.jar --nogui
   pause
   ```
   (If it says `java` isn't found, install Java 21 from https://adoptium.net.)
4. Double-click `start.bat`. It stops quickly the first time. Open `eula.txt`, change `eula=false` to `eula=true`, and save.
5. Open `server.properties` and set:
   ```
   enable-rcon=true
   rcon.port=25575
   rcon.password=pick-a-password
   ```
6. Double-click `start.bat` again. Leave that window open while you stream.
7. In Minecraft: **Multiplayer → Add Server → address `localhost`** → join.
8. In the server window, type `op YourMinecraftName` so commands work on you.

### 3. Set up this script
1. Download this `tiktok-minecraft` folder to your PC.
2. Open `config.js` in Notepad and fill in:
   - `tiktokUsername`: your TikTok name without the @
   - `minecraftPlayer`: your Minecraft name
   - `rcon.password`: the same password you put in `server.properties`
3. Open a terminal in the `tiktok-minecraft` folder (in File Explorer: click the address bar, type `cmd`, press Enter) and run:
   ```
   npm install
   ```

---

## Test it before going live

With the server running and you in the game:
```
npm run test-gifts
```
Then type fake gifts and watch them happen:
```
rose 20
heart me
confetti
galaxy        ← starts the countdown
watermelon    ← saves you
mode parkour
likes 300
```

`npm run dry` does the same without Minecraft and just prints the commands.

## Going live

1. Start the Minecraft server and join it.
2. Go live on TikTok (TikTok LIVE Studio or OBS).
3. Run:
   ```
   npm start
   ```
   It connects once you're live and retries automatically if TikTok drops.

To switch modes, type `mode parkour` or `mode survival` in the script window, or change `mode:` in `config.js`.

## Setting up parkour levels

Do this once per course, with the server and the script running (`npm run test-gifts` is fine):

1. In Minecraft, stand on the first block of Level 1.
2. In the script window, type `setlevel 1`.
3. Walk to the start of Level 2 and type `setlevel 2`, and so on for every level.

They're saved in `levels.json`, so you only do it once. Other commands:
- `levels`: list them
- `level 5`: teleport yourself to Level 5
- `resetbest`: reset the "Best" record

The script checks where you are every second, so it always knows your level, even when you fall back down by yourself.

## Adding or changing gifts

When someone sends a gift that isn't in the config, the terminal prints its exact name:
```
🎁 bob sent 1x "Sunglasses" (not in config.js — add it there to make it do something)
```
Copy that name into `config.js` with whatever action you want. All the action types are explained at the top of the file.

## Good to know
- This uses an **unofficial** TikTok library (`tiktok-live-connector`). It can break when TikTok changes things; updating usually fixes it: `npm update`.
- The library connects through a free signing service (Euler Stream). If you hit rate limits, they offer free API keys.
- With no mob limit, hundreds of mobs **will** lag the game. If it gets too much, set `maxMobsPerGift` in `config.js` (e.g. `50`).
- If Minecraft rejects a command, the terminal prints a ⚠️ with the reason. That usually means a typo in `config.js` or a Minecraft version older than 1.21.5.
