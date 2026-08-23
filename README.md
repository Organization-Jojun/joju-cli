# Jojun

CLI Pear/Bare: pegás un blob en una máquina (`paste`) y lo sacás en la otra (`yank`) por un topic de Hyperswarm. El binario se actualiza solo (OTA P2P).

Salimos de [`hello-pear-bare`](https://github.com/holepunchto/hello-pear-bare) rama **`variant/daemon`**.

Instalar (cuando el seed esté vivo):

```
pear install pear://ta114oog37s3wfdwmp6wz7x4uucjoxckd7t4acxns7s33xbc7oeo
```

## Windows (esta máquina — Jonatin)

Pear CLI v3.2.0 suele estar en:

`C:\Users\Jonatin\AppData\Local\Programs\pear\pear.exe`

Abrí una terminal **nueva** si acabás de instalarla, para que entre en el PATH.

```powershell
cd C:\Users\Jonatin\Documents\JonatinProjects\HackathonJonjun\joju-cli
npm install

# tests (mock, sin DHT)
npm test

# smoke CLI (updates off)
npm start

# help
node .\node_modules\bare-runtime\bin\bare bin.mjs --no-updates --help
```

Topic de fixtures (64 hex):

```
68656c6c6f2d6a6f6a756e000000000000000000000000000000000000000000
```

### Probar en una sola terminal (mock, sin red)

```powershell
$env:JOJUN_USE_MOCK_P2P = "1"
$storage = "$env:TEMP\jojun-dev"
$topic = "68656c6c6f2d6a6f6a756e000000000000000000000000000000000000000000"
$bare = ".\node_modules\bare-runtime\bin\bare"

node $bare bin.mjs --no-updates --storage $storage join $topic
"hello jojun" | node $bare bin.mjs --no-updates --storage $storage paste
node $bare bin.mjs --no-updates --storage $storage yank
```

### Probar P2P real (dos ventanas, mismo topic, **sin** `JOJUN_USE_MOCK_P2P`)

Ventana A (espera un blob):

```powershell
$topic = "68656c6c6f2d6a6f6a756e000000000000000000000000000000000000000000"
$bare = ".\node_modules\bare-runtime\bin\bare"
node $bare bin.mjs --no-updates --storage "$env:TEMP\jojun-a" join $topic
node $bare bin.mjs --no-updates --storage "$env:TEMP\jojun-a" yank --timeout 60000
```

Ventana B (pega):

```powershell
$topic = "68656c6c6f2d6a6f6a756e000000000000000000000000000000000000000000"
$bare = ".\node_modules\bare-runtime\bin\bare"
node $bare bin.mjs --no-updates --storage "$env:TEMP\jojun-b" join $topic
"hello jojun" | node $bare bin.mjs --no-updates --storage "$env:TEMP\jojun-b" paste --timeout 60000
```

`wait` bloquea hasta que hay un peer. `--json` imprime estado en una línea JSON (yank sigue siendo bytes crudos en stdout).

### Binario y deploy (requisito duro del track)

```powershell
npm run make                 # out\win32-x64\jojun.exe
npm run stage -- --dry-run
npm run stage                # escribe al pear:// (identidad Pear de esta PC)
npm run seed                 # proceso vivo — dejarlo encendido en juzgamiento
```

OTA: el comando sale; el updater es daemon. Logs: `<storage>\updates.log`.

## Comandos

| Acción | Qué hace |
|---|---|
| `join <topic>` | entra al topic (64 hex) |
| `paste` | stdin → swarm (espera peer) |
| `yank` | último blob a stdout (espera si hace falta) |
| `wait` | espera un peer |
| `leave` | sale |
| `keys` | lista las cinco |

Flags globales: `--no-updates`, `--storage`, `--json`, `--help`, `--version`.

Corte vivo: [`PROYECTO.md`](PROYECTO.md).
