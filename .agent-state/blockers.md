# Bloqueos y peticiones cruzadas

> Aquí va lo que te frena y lo que necesitas de territorio ajeno. **No edites la carpeta del otro
> agente:** anótalo aquí (y en `HANDOFF.md` si es una petición concreta de cambio). En Fase 1 no se
> espera confirmación humana: si algo te bloquea, registra la decisión reversible que tomaste para no
> frenar el flujo.

| Fecha | Agente | Qué lo bloquea | Decisión temporal tomada | Qué se necesita para cerrarlo | Estado |
|---|---|---|---|---|---|
| 2026-08-22 | Agent-A | `npm test` usa `brittle-bare` → `bare` no en PATH de cloud VM | Tests vía `node ./node_modules/bare-runtime/bin/bare ./node_modules/brittle/cmd.js test/index.js` | Agent-B actualiza script `test` en `package.json` | abierto |
| 2026-08-22 | Agent-A | `pear stage/seed/install` desde máquina limpia | CLI y pipeline listos en repo; mock swarm para dev | Jonatin: Windows real + seed en juzgamiento | abierto |
