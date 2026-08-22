# Herdr — CLI, workflow y atajos

Extracto de [herdr.dev/docs](https://herdr.dev/docs/), [CLI reference](https://herdr.dev/docs/cli-reference/), [Keyboard](https://herdr.dev/docs/keyboard/), [Config reference](https://herdr.dev/docs/config-reference/) y [Agent automation](https://herdr.dev/docs/agent-automation/). Docs **0.8.2**.

La CLI habla con el servidor por el socket local. Casi todos los comandos de control imprimen JSON.

No uses `herdr` sin subcomando para explorar: lanza o adjunta la TUI.

---

## Atajos (TUI)

El ratón cubre todo. El teclado es opcional.

**Prefix:** `ctrl+b` por defecto. Pulse `ctrl+b`, suelte, luego la tecla de acción. Ejemplo: `prefix+c` = `ctrl+b` y después `c`.

Tres modos:

| Modo | Qué hace |
|------|----------|
| Terminal | Las teclas van al pane enfocado (shell, editor, agente). |
| Prefix | Tras `ctrl+b`, la siguiente tecla es un comando de Herdr. |
| Navigate | Superficie persistente de navegación de workspaces (`prefix+w`). |

Lista viva de bindings: `prefix+?`. En esa ayuda, `/` filtra; Backspace edita el filtro; `ctrl+u` lo limpia.

### Aprende estos cinco

| Atajo | Acción |
|-------|--------|
| `prefix+c` | Nuevo tab |
| `prefix+v` / `prefix+minus` | Split a la derecha / abajo |
| `prefix+h/j/k/l` | Moverse entre panes |
| `prefix+w` | Navegación de workspaces |
| `prefix+q` | Detach: todo sigue corriendo |

### Sesión y UI

| Atajo | Acción | Qué hace |
|-------|--------|----------|
| `prefix+?` | Help | Abre la ayuda de atajos. |
| `prefix+s` | Settings | Abre settings. |
| `prefix+q` | Detach | Desconecta el cliente. El servidor y los panes siguen. Para matar todo: `herdr server stop`. |
| `prefix+shift+r` | Reload config | Recarga `config.toml` en el server. |
| `prefix+o` | Notification target | Enfoca el destino de la notificación visible. |
| `prefix+b` | Toggle sidebar | Colapsa / expande la sidebar. |
| `prefix+g` | Goto | Navigator de la sesión. |
| `ctrl+v` | Remote image paste | En cliente local, manda imagen del clipboard a una sesión remota. |

### Workspaces

| Atajo | Acción | Qué hace |
|-------|--------|----------|
| `prefix+w` | Workspace picker | Abre la navegación de workspaces. |
| `prefix+shift+n` | New workspace | Crea un workspace. |
| `prefix+shift+w` | Rename workspace | Renombra el workspace seleccionado. |
| `prefix+shift+d` | Close workspace | Cierra el workspace seleccionado. |
| `prefix+shift+g` | New worktree | Crea un Git worktree desde el workspace seleccionado. |
| *(sin bind)* | Open / remove worktree | Abrir o borrar checkout; hay que asignar atajo. |
| *(sin bind)* | Previous / next workspace | Ciclar workspaces. |
| *(sin bind)* | Switch workspace 1–9 | Desde prefix mode. |

En **navigate mode** (`prefix+w`): `up`/`down` mueven la selección de workspace; `h/j/k/l` (y flechas izq/der) enfocan panes.

### Tabs

| Atajo | Acción | Qué hace |
|-------|--------|----------|
| `prefix+c` | New tab | Nuevo tab en el workspace activo. |
| `prefix+n` / `prefix+p` | Next / previous tab | Tab siguiente / anterior. |
| `prefix+1` … `prefix+9` | Switch tab | Salta al tab 1–9. |
| `prefix+shift+t` | Rename tab | Renombra el tab activo. |
| `prefix+shift+x` | Close tab | Cierra el tab activo (el último tab también cierra el workspace). |
| *(sin bind)* | Move tab prev/next | Reordenar tabs. |

### Panes

| Atajo | Acción | Qué hace |
|-------|--------|----------|
| `prefix+v` | Split vertical | Parte a la **derecha** (lado a lado). |
| `prefix+minus` | Split horizontal | Parte **abajo** (apilado). |
| `prefix+h/j/k/l` | Focus pane | Enfoca pane izq / abajo / arriba / der. |
| `prefix+shift+h/j/k/l` | Swap pane | Intercambia el pane enfocado con el vecino. |
| `prefix+tab` / `prefix+shift+tab` | Cycle pane | Siguiente / anterior pane. |
| `prefix+z` | Zoom | Maximiza / restaura el pane enfocado. |
| `prefix+x` | Close pane | Cierra el pane enfocado. |
| `prefix+shift+p` | Rename pane | Renombra el pane enfocado. |
| `prefix+r` | Resize mode | Entra al modo de redimensionar. |
| `prefix+[` | Copy mode | Copia con teclado (el proceso del pane **no** se pausa). |
| `prefix+e` | Edit scrollback | Abre el scrollback del pane en `$EDITOR`. |
| *(sin bind)* | Last pane | Vuelve al último pane enfocado (cualquier workspace/tab). |
| *(sin bind)* | Resize pane L/D/U/R | Redimensionar sin entrar a resize mode. |

### Agentes (sin bind por defecto)

| Acción | Qué hace |
|--------|----------|
| Previous / next agent | Enfoca el agente anterior / siguiente del panel. |
| Focus agent 1–9 | Enfoca un agente por índice. |

Hay que asignarlos en `[keys]`.

### Copy mode (`prefix+[`)

El output sigue vivo; al fondo se sigue el stream. El prefix sigue siendo prefix (con `ctrl+b` default, `ctrl+b` **no** pagina hacia arriba).

| Tecla | Qué hace |
|-------|----------|
| `h/j/k/l` | Mover cursor |
| `w/b/e`, `W/B/E` | Palabras (estilo tmux) |
| `{` / `}` | Párrafos |
| `PageUp` / `PageDown`, `ctrl+f`, `ctrl+u`/`ctrl+d` | Páginas |
| `/` / `?` | Buscar adelante / atrás (case-insensitive salvo mayúsculas en el query) |
| `n` / `N` | Repetir búsqueda misma / dirección opuesta |
| `v` o Space | Empieza selección |
| `y` o Enter | Copia |
| `q` o Esc | Sale sin copiar (Esc primero limpia selección o búsqueda) |

Arrastrar con el ratón copia **sin** entrar a copy mode.

### Prefix-free (opcional)

Se pueden sumar acordes directos. Familia más segura: `ctrl+alt`. Ejemplo de la docs:

```
[keys]
prefix = "ctrl+b"
focus_pane_left = ["prefix+h", "ctrl+alt+h"]
focus_pane_down = ["prefix+j", "ctrl+alt+j"]
focus_pane_up = ["prefix+k", "ctrl+alt+k"]
focus_pane_right = ["prefix+l", "ctrl+alt+l"]
previous_tab = ["prefix+p", "ctrl+alt+["]
next_tab = ["prefix+n", "ctrl+alt+]"]
new_tab = ["prefix+c", "ctrl+alt+c"]
split_vertical = ["prefix+v", "ctrl+alt+d"]
split_horizontal = ["prefix+minus", "ctrl+alt+shift+d"]
zoom = ["prefix+z", "ctrl+alt+z"]
```

Evitar: `ctrl+alt+flechas`, `ctrl+alt+t`, `ctrl+alt+l`/`a` (KDE), `ctrl+alt+s`/`u` (Konsole), `ctrl+alt+f1..f12`.

Si un acorde no hace nada, el OS o el terminal lo comió antes.

Config: `~/.config/herdr/config.toml` (Linux/macOS) o `%APPDATA%\herdr\config.toml` (Windows). Lista completa de keys: `herdr --default-config` o [config-reference](https://herdr.dev/docs/config-reference/).

---


## Workflow (automatización)

Tres primitivas:

| Primitiva | Qué hace |
|-----------|----------|
| Layout (`workspace`, `tab`, panes) | Ubicar terminales |
| Pane | Terminal crudo: comandos, input, output, waits |
| Agent | Agente reconocido por nombre o pane, y su ciclo de vida |

Un pane existe con o sin agente. `agent start` **exige** un pane shell libre; no crea, parte ni mueve layout.

Crear un workspace crea su primer tab y root pane. Crear un tab crea su root pane. Captura IDs del JSON; no los adivines.

```bash
created=$(herdr workspace create --cwd ~/project --label api --no-focus)
pane_id=$(printf '%s\n' "$created" | jq -r '.result.root_pane.pane_id')
split=$(herdr pane split "$pane_id" --direction right --no-focus)
review_pane=$(printf '%s\n' "$split" | jq -r '.result.pane.pane_id')
```

- `workspace create` → `.result.workspace`, `.result.tab`, `.result.root_pane`
- `tab create` → `.result.tab`, `.result.root_pane`
- `pane split` → `.result.pane`

IDs públicos: workspace `w1`, tab `w1:t1`, pane `w1:p1`. Tras `pane move`, sigue con `.result.move_result.pane.pane_id`.

### Elige superficie

| Objetivo | Comando |
|----------|---------|
| Correr un comando y Enter | `pane run` |
| Texto sin Enter | `pane send-text` |
| Teclas / acordes | `pane send-keys` |
| Esperar texto o regex | `pane wait-output` |
| Arrancar agente soportado | `agent start` |
| Prompt (opcional wait) | `agent prompt` |
| Teclas al UI del agente | `agent send-keys` |
| Esperar estado del agente | `agent wait` |

Estados: `working`, `blocked`, `done`, `idle`, `unknown`.

- `idle`: listo para input y el tab ya se vio en la UI enfocada.
- `done`: mismo idle tras trabajo de fondo no visto. Enfocar tab/`pane focus`/`agent focus` lo marca visto. Leer por CLI **no**.
- `blocked`: UI de aprobación o pregunta.
- `unknown`: hay agente pero no se clasifica; no prueba que terminó.

### Receta: helper agente

```bash
split=$(herdr pane split --current --direction right --cwd "$PWD" --no-focus)
review_pane=$(printf '%s\n' "$split" | jq -r '.result.pane.pane_id')
herdr agent start reviewer --kind codex --pane "$review_pane"
herdr agent prompt reviewer "Review the current diff" --wait --timeout 120000
herdr agent read reviewer --source recent-unwrapped --lines 120
```

### Receta: esperar input del agente

```bash
herdr agent wait reviewer --until blocked --timeout 120000
herdr agent read reviewer --source recent-unwrapped --lines 80
herdr agent send-keys reviewer esc
```

### Receta: proceso normal (no agente)

```bash
herdr pane run w1:p3 "just test --watch"
herdr pane wait-output w1:p3 --regex "passed|failed" --timeout 120000
```

Reglas de coordinación (skill):

- `--no-focus` para trabajo de fondo.
- `--current`, pane ID explícito, o nombre único de agente.
- No cierres workspaces/tabs/panes que no creaste.
- No `herdr server stop` salvo que el humano lo pida.
- Error de servidor: JSON en stderr, exit 1. Syntax CLI: exit 2.

Si `HERDR_ENV=1` no está, no estás dentro de un pane de Herdr: no controles la sesión.

---

## Launch y status

```
herdr                              # launch o attach sesión default
herdr --session work
herdr --remote workbox
herdr --remote workbox --remote-keybindings server
herdr --remote workbox --handoff
herdr --no-session                 # proceso único
herdr --default-config
herdr --skill                      # imprime el skill bundled
herdr --version
herdr update
herdr update --handoff
herdr channel show
herdr channel set preview
herdr channel set stable
herdr status
herdr status server
herdr status client
herdr api schema
herdr api schema --json
herdr api schema --output herdr-api.schema.json
herdr api snapshot
```

Completions:

```
herdr completion zsh|bash|fish|powershell|elvish
herdr completions zsh              # alias
```

---

## Server

```
herdr server
herdr server stop
herdr server reload-config
herdr server agent-manifests [--json]
herdr server update-agent-manifests [--json]
herdr server reload-agent-manifests
```

---

## Notifications

```
herdr notification show <title> [--body TEXT]
  [--position top-left|top-right|bottom-left|bottom-right]
  [--sound none|done|request]
```

---

## Sessions

```
herdr session list [--json]
herdr session attach <name>
herdr session stop <name> [--json]
herdr session delete <name> [--json]
```

Usa `default` para parar la sesión default.

---

## Workspaces

```
herdr workspace list
herdr workspace create [--cwd PATH] [--label TEXT] [--env KEY=VALUE] [--focus] [--no-focus]
herdr workspace get <workspace_id>
herdr workspace focus <workspace_id>
herdr workspace rename <workspace_id> <label>
herdr workspace report-metadata <workspace_id> --source ID [--token NAME=VALUE] [--clear-token NAME] [--seq N] [--ttl-ms N]
herdr workspace close <workspace_id>
```

`--focus` selecciona el layout nuevo. `--no-focus` es el default explícito.

---

## Worktrees

```
herdr worktree list [--workspace ID | --cwd PATH]
herdr worktree create [--workspace ID | --cwd PATH] [--branch NAME] [--base REF] [--path PATH] [--label TEXT] [--focus] [--no-focus]
herdr worktree open [--workspace ID | --cwd PATH] (--path PATH | --branch NAME) [--label TEXT] [--focus] [--no-focus]
herdr worktree remove --workspace ID [--force]
```

`workspace close` solo cierra estado Herdr. Borrar checkout: `worktree remove` (`git worktree remove`; no borra la rama).

---

## Tabs

```
herdr tab list [--workspace <workspace_id>]
herdr tab create [--workspace <workspace_id>] [--cwd PATH] [--label TEXT] [--env KEY=VALUE] [--focus] [--no-focus]
herdr tab get <tab_id>
herdr tab focus <tab_id>
herdr tab rename <tab_id> <label>
herdr tab close <tab_id>
```

Cerrar el último tab del workspace también cierra el workspace.

---

## Panes

```
herdr pane list [--workspace <workspace_id>]
herdr pane current [--pane ID|--current]
herdr pane get <pane_id>
herdr pane layout [--pane ID|--current]
herdr pane process-info [--pane ID|--current]
herdr pane neighbor --direction left|right|up|down [--pane ID|--current]
herdr pane edges [--pane ID|--current]
herdr pane focus --direction left|right|up|down [--pane ID|--current]
herdr pane resize --direction left|right|up|down [--amount FLOAT] [--pane ID|--current]
herdr pane zoom [<pane_id>|--pane ID|--current] [--toggle|--on|--off]
herdr pane rename <pane_id> <label>|--clear
herdr pane input [<pane_id>|--pane ID|--current] --right-click herdr|pane
herdr pane split [<pane_id>|--pane ID|--current] --direction right|down [--ratio FLOAT] [--cwd PATH] [--env KEY=VALUE] [--right-click herdr|pane] [--focus] [--no-focus]
herdr pane swap --direction left|right|up|down [--pane ID|--current]
herdr pane swap --source-pane ID --target-pane ID
herdr pane move <pane_id> --tab <tab_id> --split right|down [--target-pane ID] [--ratio FLOAT] [--focus|--no-focus]
herdr pane move <pane_id> --new-tab [--workspace ID] [--label TEXT] [--focus|--no-focus]
herdr pane move <pane_id> --new-workspace [--label TEXT] [--tab-label TEXT] [--focus|--no-focus]
herdr pane close <pane_id>
```

`--current` usa `HERDR_PANE_ID` del pane llamante. Split sin target usa el pane enfocado en la UI.

Leer:

```
herdr pane read <pane_id> [--source visible|recent|recent-unwrapped|detection] [--lines N] [--format text|ansi] [--ansi] [--raw]
```

Input:

```
herdr pane send-text <pane_id> <text>
herdr pane send-keys <pane_id> <key> [key ...]
herdr pane run <pane_id> <command>
```

`pane run` pega texto + Enter (bracketed paste). Prefiérelo a `send-text` + Enter.

Wait:

```
herdr pane wait-output <pane_id> (--match <text> | --regex <pattern>)
  [--source visible|recent|recent-unwrapped] [--lines N] [--timeout MS] [--raw]
```

Sin `--timeout`, espera indefinido. `--match` substring; `--regex` regex Rust, una línea a la vez.

Reportes de agente (hooks/plugins):

```
herdr pane report-agent <pane_id> --source ID --agent LABEL --state idle|working|blocked|unknown [...]
herdr pane report-agent-session <pane_id> --source ID --agent LABEL [...]
herdr pane release-agent <pane_id> --source ID --agent LABEL [--seq N]
herdr pane report-metadata <pane_id> --source ID [...]
```

---

## Agents

Target: nombre único vivo **o** pane ID que lo hospeda. No terminal IDs ni labels de kind.

Nombres: `[a-z][a-z0-9_-]{0,31}`, únicos entre agentes vivos.

```
herdr agent list
herdr agent get <target>
herdr agent read <target> [--source visible|recent|recent-unwrapped|detection] [--lines N] [--format text|ansi] [--ansi]
herdr agent send-keys <target> <key> [key ...]
herdr agent prompt <target> <text> [--wait] [--until STATUS]... [--timeout MS]
herdr agent rename <target> <name>|--clear
herdr agent focus <target>
herdr agent wait <target> [--until STATUS]... [--timeout MS]
herdr agent attach <target> [--takeover]
herdr agent start <name> --kind KIND --pane ID [--timeout MS] [-- <agent-args...>]
herdr agent explain <target> [--json|--verbose]
herdr agent explain --file PATH --agent LABEL [--json|--verbose]
```

`agent start` kinds: `pi`, `claude`, `codex`, `gemini`, `cursor`, `devin`, `agy`, `cline`, `omp`, `mastracode`, `opencode`, `copilot`, `kimi`, `kiro`, `droid`, `amp`, `grok`, `hermes`, `kilo`, `qodercli`, `qwen`, `maki`.

Timeout de start: default 30000 ms; debe ser > 3000 y ≤ 300000.

`agent prompt --wait` espera el primer `idle`/`done`/`blocked`. `--until` solo con `--wait`. Si el agente ya está `blocked` → `agent_blocked` sin enviar input. Prompt desde no-working debe mover el ciclo en 5 s o `agent_prompt_stalled`.

---

## Terminal attach

```
herdr terminal attach <terminal_id> [--takeover]
herdr terminal session control <target> [--takeover] [--cols N] [--rows N]
herdr terminal session observe <target> [--cols N] [--rows N]
herdr terminal title set <title>
herdr terminal title clear
```

Detach: `ctrl+b q`. Literal `ctrl+b`: `ctrl+b ctrl+b`.

---

## Integrations

```
herdr integration install <pi|omp|claude|codex|copilot|devin|droid|kimi|opencode|kilo|hermes|qodercli|qwen|cursor|mastracode|grok>
herdr integration uninstall <mismo>
herdr integration status [--outdated-only]
```

---

## Plugins (workflows locales)

```
herdr plugin install <owner>/<repo>[/subdir...] [--ref REF] [--yes]
herdr plugin list [--plugin ID] [--json]
herdr plugin uninstall <plugin_id|owner/repo[/subdir...]>
herdr plugin enable <plugin_id>
herdr plugin disable <plugin_id>
herdr plugin link <path> [--disabled]
herdr plugin unlink <plugin_id>
herdr plugin config-dir <plugin_id>
herdr plugin action list [--plugin ID]
herdr plugin action invoke <action_id> [--plugin ID]
herdr plugin log list [--plugin ID] [--limit N]
herdr plugin pane open --plugin ID --entrypoint ID [--placement overlay|popup|split|tab|zoomed] [...]
herdr plugin pane focus <pane_id>
herdr plugin pane close <pane_id>
```

El API de plugins **es** la CLI completa (`HERDR_BIN_PATH`).

---

## Read sources

| Source | Significado |
|--------|-------------|
| `visible` | Viewport renderizado |
| `recent` | Scrollback reciente con wraps |
| `recent-unwrapped` | Scrollback sin soft wrap (logs) |
| `detection` | Snapshot del bottom-buffer (detección de agentes) |

En `pane wait-output`, `recent` y `recent-unwrapped` buscan el snapshot unwrapped; `recent` es el default.

---

## Variables de entorno

| Variable | Uso |
|----------|-----|
| `HERDR_CONFIG_PATH` | Override del config |
| `HERDR_SESSION` | Sesión nombrada para CLI |
| `HERDR_SOCKET_PATH` | Socket |
| `HERDR_PROCESS_DETECTION` | Linux: `native` (default) o `child-groups` |
| `HERDR_ENV` | `1` dentro de panes gestionados |
| `HERDR_PANE_ID` / `HERDR_TAB_ID` / `HERDR_WORKSPACE_ID` | IDs del proceso actual |
| `HERDR_LOG` | Filtro de log, ej. `herdr=debug` |
| `HERDR_DISABLE_SOUND` | Silenciar sonidos |
| `HERDR_BIN_PATH` | Binario (inyectado a plugins) |

---

## Descubrimiento local

```bash
herdr --help
herdr agent
herdr pane
herdr workspace
herdr tab
herdr worktree
herdr terminal
herdr notification
herdr integration
herdr session
```

El binario instalado manda sobre este archivo. Fuentes: [cli-reference](https://herdr.dev/docs/cli-reference/), [agent-automation](https://herdr.dev/docs/agent-automation/), [agent-skill](https://herdr.dev/docs/agent-skill/), [SKILL.md](https://raw.githubusercontent.com/herdrdev/herdr/master/skills/herdr/SKILL.md).
