# Estado — Integración (dueño: Agent-A · Jonatin)

| Campo | Valor |
|---|---|
| **Rama de integración** | `agent-a/integration` |
| **Último merge (A)** | `agent-a/fase1-cli` @ `7791154` |
| **Último merge (B)** | `agent-b/fase1-p2p` @ `28e8ef8` |
| **Estado del contrato A↔B** | **Integrado** — `src/contracts/swarm.js` adapter → `p2p` / `p2p/mock` |
| **Verifier** | `npm test` 10/10 pass · `npm start` OK |
| **Qué falta para main** | `pear stage/seed/install` en Windows Jonatin · `make` darwin/win32 · smoke P2P real en dos laptops |

## Bitácora de integración

- `02:45 UTC` — Merge `agent-b/fase1-p2p` en `agent-a/integration`.
- Adapter en `src/contracts/` delega a Hyperswarm real (`p2p`) o mock (`JOJUN_USE_MOCK_P2P=1`).
- Fixtures unificados: `hello-jojun` topic + `hello jojun` payload (Agent-B).
- Comandos async (join/leave/paste/wait) + session file entre one-shots.
- Tests: 10/10 (p2p topic + mock + contracts adapter).
