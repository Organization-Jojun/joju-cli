# Jojun CLI banner

Minimal messenger-pigeon mark + JOJUN wordmark. Designed for a **black terminal**.

## Files

| File | Use |
| --- | --- |
| `banner.ansi` | Truecolor ANSI. Print as-is on startup (`print` / `fmt.Print` / `process.stdout.write`). |
| `banner.txt` | Monochrome fallback if the terminal has no color. |
| `banner.go` | Bubbletea + Lipgloss component (`package banner`). |

## How to show it

Print `banner.ansi` once when the CLI initializes. Do not wrap it in extra background colors; cells already use `#000000` where needed.

Reset after printing: most terminals are fine because the file ends with `\x1b[0m`. If the prompt inherits color, print `\x1b[0m` again.

## Layout

- Canvas: 56 columns × 12 rows (content is ~45×8 plus a hairline).
- Left: pigeon silhouette (steel gray) + envelope (brass).
- Right: JOJUN (cool gray).
- Under the name: a dim rule `#3D4650`.

## Palette

- `#8A96A3` `#6B7784` `#5C6772` pigeon
- `#A68B5B` `#8F7A4E` `#C4B089` envelope
- `#C9D2DC` `#A8B4C0` wordmark
- `#3D4650` rule

## Note for Go

`banner.go` needs `fmt` in the import block (already included). `View()` renders the full 56×12 grid.
