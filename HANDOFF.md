# HANDOFF — un solo owner (Jonatin, Windows)

Julián / Agent-B ya no codean. Todo el producto se cierra aquí.

| Qué | Estado |
|---|---|
| CLI join/paste/yank/wait/leave/keys + `--json` | hecho |
| Contrato → Hyperswarm (`src/p2p`) o mock (`JOJUN_USE_MOCK_P2P=1` o `setUseMock`) | hecho |
| Tests Windows (`npm test` vía bare-runtime) | hecho |
| `npm run make` win32 | correr en esta PC |
| `npm run stage` + `npm run seed` | Jonatin, juzgamiento |
| `pear install pear://ta114oog37s3wfdwmp6wz7x4uucjoxckd7t4acxns7s33xbc7oeo` | seed vivo |
| Video 3 min | grabar en esta PC: install + OTA (+ paste/yank) |

Link upgrade (no regenerar): `pear://ta114oog37s3wfdwmp6wz7x4uucjoxckd7t4acxns7s33xbc7oeo`

HANDOFF: `src/contracts/swarm.js` now has `setUseMock(boolean)` / `isUsingMock()` so the interactive tutorial can pick practice vs live Hyperswarm without `JOJUN_USE_MOCK_P2P`. Env still selects the default at load (tests set the env).
