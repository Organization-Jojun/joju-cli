| Fecha | Agente | Qué lo bloquea | Decisión temporal tomada | Qué se necesita para cerrarlo | Estado |
|---|---|---|---|---|---|
| 2026-08-22 | Agent-B | `pear stage` real en cloud VM: "Destination must be writable" | Scripts listos; dry-run funciona. Stage/seed en máquina de Jonatin. | Jonatin corre `npm run stage` + `npm run seed` en Windows | abierto |
| 2026-08-22 | Agent-B | Test Hyperswarm DHT en cloud VM intermitente | `npm test` = unit+mock. `npm run test:p2p` separado para máquinas con DHT. | Probar paste/yank en dos laptops reales | abierto |
| 2026-08-22 | Agent-A | `src/contracts/` no existe aún | API vive en `src/p2p/` documentada en HANDOFF | Agent-A crea `src/contracts/index.js` re-exportando p2p/mock | abierto |
