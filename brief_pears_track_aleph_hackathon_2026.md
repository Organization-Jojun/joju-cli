# 🍐 Pears Track — Aleph Hackathon 2026

Fuente original: [https://hacki.crecimiento.build/h/aleph-hackathon-2026/tracks/pears-track](https://hacki.crecimiento.build/h/aleph-hackathon-2026/tracks/pears-track)

Extraído: 22 Aug 2026.

---

## Metadatos del evento (página)

| Campo | Valor |
| --- | --- |
| Hackathon | **Aleph Hackathon** |
| Estado | Live |
| Edición | 6th edition |
| Track | 🍐 **Pears Track** |
| Sponsor | Tether · *you can enter 1 track from this sponsor* |
| Prize pool (página general) | 5,500 USD |
| Prize pool (este track) | Up to $1,500 USDt |
| Opened | 22 Aug 2026, 12:00 |
| Closes | 23 Aug 2026, 12:00 |
| Where | Online & IRL in 11 chapters worldwide |
| BUIDLs | 0 |
| Hackers | 185 |
| Projects in this track | 0 |

## 🎯 Overview

**Pear** is a peer-to-peer runtime, development, and deployment platform by Holepunch. You build an app, deploy it with the Pear CLI, and it reaches your users directly through the swarm (no servers, no app store, no package registry, no infrastructure to pay for). Updates flow peer-to-peer too: once someone has your app, new releases arrive over the air from other peers.

Underneath is **Bare**, a small embeddable JavaScript runtime. Your app and the runtime compile into a **single standalone binary** per OS and architecture, your users need no Node.js, no Bare, not even the Pear CLI installed.

**What this means for the weekend:** you can build a terminal tool, ship it as one executable, and have anyone in the room install it with `pear install pear://<your-key>` then push an update that reaches them without them doing anything. That whole loop is the point of this track.

---

## 🏆 Prize breakdown

**Total Prize Pool: Up to $1,500 USDt in prizes**, to be distributed at the judges' discretion based on the merit, quality, originality, and impact of the submitted projects.

- 🥇 **1st place — $1,000 USDt**
- 🥈 **2nd place — $500 USDt**

Both prizes go to the same challenge; there's one brief this weekend, not separate categories.

### The challenge

**Build a standalone CLI tool, deploy it with the Pear CLI, and make it installable with** `pear install`**, with peer-to-peer OTA updates.**

Start from any variant of hello-pear-bare and ship it properly.

**The one hard requirement:** your tool must be installable with `pear install pear://<key>`. That means it has to be genuinely deployed with the Pear CLI and seeded, a repo that builds locally isn't enough. Judges will install it the same way any user would, so if that command doesn't work, the entry doesn't count.

**Everything else is open.** The tool itself doesn't have to be peer-to-peer. Using the wider Pear ecosystem is encouraged but not required.

---

## 🧑‍💻 Track focus

Build whatever you'd actually use. A few directions:

1. **A system tool.** Something small that does one job well and benefits from being an evergreen binary that keeps itself current. The `swap` CLI self-updates peer-to-peer (repo: <https://github.com/holepunchto/swap>). It is a tiny-scoped reference architecture demonstrating an evergreen one-shot CLI.
2. **A command-line game.** Terminal games are a great fit: they're fun to demo, they're self-contained, and OTA updates mean you can patch balance or add levels while people are still playing.
3. **A messaging TUI.** Chat, notes, file drop, presence, anything conversational in the terminal. This is where going peer-to-peer with Hyperswarm pays off naturally.
4. **A developer tool.** Something you were going to write a shell script for anyway, shipped as a real cross-platform binary instead.
5. **Anything else.** Services, daemons, REPLs, transport hooks…

**Pick your process shape.** `hello-pear-bare` ships three branches, and choosing the right one is part of doing this well:

| Branch | Shape | Use it for |
| --- | --- | --- |
| `main` | Updater in a Bare worker thread | Long-lived programs (TUIs, REPLs, services) that keep P2P logic off the main thread |
| `variant/single-thread` | Updater constructed directly in the main process | Long-lived programs that don't need a separate thread |
| `variant/daemon` | Detached daemon updates in the background; command returns immediately | Short-lived one-shot commands, like `git`, the tool exits while the daemon updates |

### 🔵 Bonus direction: BLE-Swarm

**Want to try something genuinely experimental?** Peer discovery over Bluetooth Low Energy, peers find each other and talk directly, with no internet at all. In a room full of hackers in Buenos Aires, that's a demo that lands: turn the wifi off and watch it keep working.

It's rough around the edges, which is exactly the point of a hackathon. A local-first chat, a file drop between laptops sitting next to each other, a game that finds opponents in the room, an offline sync tool, anything where "no network" is a feature rather than a failure.

Reference: `ble-swarm` experimental swarm over Bluetooth Low Energy.

**What we'll be looking at:** does it install cleanly with `pear install`, do OTA updates actually work end to end, is the process shape a sensible fit for what the tool does, and is it something a person would genuinely use?

---

## 🛠️ Tech requirements

### Must do

- **Build on the Pear stack**: start from any variant of `hello-pear-bare`.
- **Deploy it with the Pear CLI** and seed it, so it's installable with `pear install pear://<key>`. This is the entry requirement.
- **Ship working P2P OTA updates.** Demonstrate a real update reaching an installed copy.
- Submit your `pear://` link, without it we can't install your project and can't judge it.
- Have p2p connectivity
- Using Hyperswarm, Hypercore, Hyperdrive and the rest of the ecosystem is encouraged.

### Getting set up

```bash
# Install the Pear CLI
curl https://install.pears.com/pear.sh | sh          # macOS / Linux
irm https://install.pears.com/pear.ps1 | iex         # Windows
```

Instalador: [https://install.pears.com](https://install.pears.com)

```bash
# Start from the terminal boilerplate
git clone https://github.com/holepunchto/hello-pear-bare
cd hello-pear-bare && npm install

pear touch                    # generates your upgrade link
# paste it into the "upgrade" field in package.json — the app won't start without it

npm start                     # dev mode, updates disabled
npm run make                  # build a standalone binary into out/<platform>-<arch>
```

New to the CLI? `pear --menu` (3.2.0+) browses every command as a filterable list with a form for the flags, instead of memorizing them.

**Two things that trip people up:** the template ships a placeholder `upgrade` link and fails with `INVALID_URL` until you replace it with a real one from `pear touch`. And on the `daemon` variant, that error goes to `<storage>/updates.log` instead of your terminal, check there first when updates seem dead.

### Reusing code

- **You may reuse existing code.** We will only judge what you built during the hackathon.
- **The Pear deployment must be new**: the app, the `pear://` link, and the release have to be from this weekend.
- Starting from `hello-pear-bare` is not just allowed, it's the recommended path.

### AI-assisted coding

Allowed. But Pear and Bare are not Node.js, and models confidently assume they are, expect hallucinated Node APIs, wrong module names, and imaginary CLI flags. Ground your assistant in the actual docs, and test on a clean machine before submitting. Obvious slop that doesn't run won't get past the install step anyway.

### Submission must include

- **Public repo** with a README explaining what you built and which branch/variant you started from.
- **Your** `pear://` **link**, this is how judges install and run your entry. Keep it seeded through judging.
- **Recorded demo video** (async, see Judges section) showing installation and an OTA update landing.
- **Which platforms you built binaries for.**

---

## 📚 Developer resources

### Start here

- Pear: [https://pears.com/](https://pears.com/)
- Documentation home: [https://docs.pears.com/](https://docs.pears.com/)
- Install the Pear CLI: [https://install.pears.com](https://install.pears.com)
- Getting started: [https://docs.pears.com/getting-started/](https://docs.pears.com/getting-started/)
- **hello-pear-bare template guide**: [https://docs.pears.com/getting-started/from-a-template/start-from-hello-pear-bare/](https://docs.pears.com/getting-started/from-a-template/start-from-hello-pear-bare/)
- **hello-pear-bare repo**: [https://github.com/holepunchto/hello-pear-bare](https://github.com/holepunchto/hello-pear-bare)
- Peer-to-peer, demystified: [https://docs.pears.com/explanation/peer-to-peer-demystified/](https://docs.pears.com/explanation/peer-to-peer-demystified/)
- How Pear and Bare fit together: [https://docs.pears.com/explanation/pear-and-bare/](https://docs.pears.com/explanation/pear-and-bare/)
- Troubleshooting: [https://docs.pears.com/how-to/troubleshooting/](https://docs.pears.com/how-to/troubleshooting/)

### Deploying and updating (the core of this track)

- Release & distribute your app: [https://docs.pears.com/how-to/operate-an-app/](https://docs.pears.com/how-to/operate-an-app/)
- Manual deployment: [https://docs.pears.com/how-to/operate-an-app/manual-deployment/](https://docs.pears.com/how-to/operate-an-app/manual-deployment/)
- Build & package: [https://docs.pears.com/how-to/operate-an-app/build-and-package/](https://docs.pears.com/how-to/operate-an-app/build-and-package/)
- Multisig releases: [https://docs.pears.com/how-to/operate-an-app/multisig/](https://docs.pears.com/how-to/operate-an-app/multisig/)
- Publish with GitHub Actions: [https://docs.pears.com/how-to/operate-an-app/github-actions/](https://docs.pears.com/how-to/operate-an-app/github-actions/)
- Seeding with `pear seed`: [https://docs.pears.com/explanation/availability-and-blind-peering/](https://docs.pears.com/explanation/availability-and-blind-peering/)
- Release pipeline, explained: [https://docs.pears.com/explanation/deployment-releasing-apps-p2p/](https://docs.pears.com/explanation/deployment-releasing-apps-p2p/)
- Storage and distribution: [https://docs.pears.com/explanation/storage-and-distribution/](https://docs.pears.com/explanation/storage-and-distribution/)
- Pear OTA / `pear-runtime` API: [https://docs.pears.com/reference/pear/runtime/](https://docs.pears.com/reference/pear/runtime/)
- Pear CLI reference: [https://docs.pears.com/reference/pear/cli/](https://docs.pears.com/reference/pear/cli/)
- Interactive command menu: [https://docs.pears.com/how-to/browse-commands-with-the-interactive-menu/](https://docs.pears.com/how-to/browse-commands-with-the-interactive-menu/)

### Going peer-to-peer

- Connect to peers (HyperDHT, Hyperswarm): [https://docs.pears.com/how-to/connect-to-peers/](https://docs.pears.com/how-to/connect-to-peers/)
- Store and replicate (Hypercore, Corestore, Hyperbee): [https://docs.pears.com/how-to/store-and-replicate/](https://docs.pears.com/how-to/store-and-replicate/)
- Stream and share media (Hyperdrive): [https://docs.pears.com/how-to/stream-and-share-media/](https://docs.pears.com/how-to/stream-and-share-media/)
- Blind peering: [https://docs.pears.com/how-to/blind-peering/](https://docs.pears.com/how-to/blind-peering/)
- Manage identity: [https://docs.pears.com/how-to/manage-identity/](https://docs.pears.com/how-to/manage-identity/)
- Module catalog: [https://docs.pears.com/reference/modules/pear-modules/](https://docs.pears.com/reference/modules/pear-modules/)
- Bare modules: [https://docs.pears.com/reference/modules/bare-modules/](https://docs.pears.com/reference/modules/bare-modules/)
- Bare runtime API: [https://docs.pears.com/reference/bare/runtime/](https://docs.pears.com/reference/bare/runtime/)
- `ble-swarm` (experimental, bonus direction): [https://github.com/mafintosh/ble-swarm](https://github.com/mafintosh/ble-swarm)

### Worth reading before you start

- Ecosystem Spotlight; `swap`, the reference example for this challenge: [https://pears.com/news/ecosystem-spotlight-swap-evergreen-one-shot-atomic-exchange-cli/](https://pears.com/news/ecosystem-spotlight-swap-evergreen-one-shot-atomic-exchange-cli/)
- Hello Pear Boilerplates: [https://pears.com/news/hello-pear-boilerplates/](https://pears.com/news/hello-pear-boilerplates/)
- Pear Revolution (CLI v3): [https://pears.com/news/pear-revolution/](https://pears.com/news/pear-revolution/)
- All news: [https://pears.com/news](https://pears.com/news)

### Community

- GitHub: [https://github.com/holepunchto](https://github.com/holepunchto)
- X / Twitter: [https://twitter.com/Pears_p2p](https://twitter.com/Pears_p2p)
- YouTube: [https://www.youtube.com/@Pears_p2p](https://www.youtube.com/@Pears_p2p)
- Showcases: [https://pears.com/?section=showcases](https://pears.com/?section=showcases)

---

## 💬 Mentors

- Mentorship is IRL & online: you will have your dedicated topic on the hackathon Telegram group chat and hackers will ping the mentors whenever they need them.
- For deeper technical questions, mentors will point you to the Pear Development room on Keet:
  - **Keet**: [https://keet.io/chat/#yfo6dbyb4iz9bhhdq6nzq888dto4b4mxttz94i8ttaidrppwnmtehgn4so6u5jy9cfg41x7aoht5egf8354wjaz7eip5am37ie9ffy3gpq4bngkz35fx4f9zxpeo53qt679q4e8bjazbxoo356pz96c9munhaye](https://keet.io/chat/#yfo6dbyb4iz9bhhdq6nzq888dto4b4mxttz94i8ttaidrppwnmtehgn4so6u5jy9cfg41x7aoht5egf8354wjaz7eip5am37ie9ffy3gpq4bngkz35fx4f9zxpeo53qt679q4e8bjazbxoo356pz96c9munhaye)
- (Pear has no Discord — Keet is where the team is.)
- The hackathon kicks off on Saturday at 12PM (ARG time) and wraps up on Sunday at 12PM (ARG time). Mentors will be especially available on Saturday (the peak day for support and guidance).

---

## 🎓 Judge

- dmc, Creator of Pear | Keet: **@dmc0** & Twitter: **@davidmarkclem**
- Judging will start at 1PM (ARG time) on Sunday 23rd, for about 4hs.
- Everything happens online.
- Demo is async: hackers will record a demo they will attach to their project submission.
- Keep your pear:// link seeded through the judging window — if judges can't install it, they can't score it.

---

## Projects in this track

No projects yet.

---

## Pie de página

© 2026 Hacki. All rights reserved.

Plataforma: [Hacki](https://hacki.crecimiento.build/)
