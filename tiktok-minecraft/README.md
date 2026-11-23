# TikTok LIVE → Minecraft

Viewers send gifts on your TikTok LIVE and stuff happens in your Minecraft world: mobs spawn, kits drop, inventories get wiped, runs get reset.

Two modes:
- **survival**: you try to beat the game while chat helps or sabotages you
- **parkour**: chat messes with your jumps

## What each gift does (default)

| Gift | Survival | Parkour |
|---|---|---|
| Rose | 1 zombie | Slowness 3s |
| Finger Heart | 2 skeletons | Jump Boost 10s |
| Doughnut | 1 creeper | Nausea 10s |
| Hat and Mustache | 3 spiders | Levitation 2s |
| Heart Me | Normal kit (iron) | Speed + Jump Boost 15s |
| Confetti | **God kit** (30s cooldown) | Darkness + Slowness |
| Money Gun | Clear inventory | Back to start |
| Galaxy | **30s reset countdown**: another Galaxy or a Watermelon saves you | Same |
| Watermelon | Saves you from the countdown | Same |
| Lion / Universe | **Instant reset** | Back to start |

Plus:
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
galaxy        ← saves you
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

To switch modes, change `mode: 'survival'` to `mode: 'parkour'` in `config.js` and restart the script. For parkour, also set `parkourStart` to the coordinates of your course's start (press F3 in-game to see them).

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
