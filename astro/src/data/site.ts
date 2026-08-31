export const site = {
  name: 'Jojun',
  version: 'v0.2.0',
  license: 'Apache-2.0',
  repo: 'https://github.com/Organization-Jojun/jojun-cli',
  repoLabel: 'Organization-Jojun/jojun-cli',
  url: 'https://jojun.jonathanrbt.lat',
  title: 'Jojun — portapapeles de sala entre dos computadores',
  description:
    'Pega en una terminal y aparece en la otra. Jojun conecta dos PC por un topic de Hyperswarm: sin cuenta, sin correo y sin un servidor nuestro guardando tu historial.',
  ogImage: '/og-image.png',
  ogImageWidth: 1200,
  ogImageHeight: 630
} as const;

export const installers = [
  {
    id: 'windows',
    platform: 'Windows · PowerShell',
    arch: 'win32-x64',
    command: 'irm https://get.jojun.jonathanrbt.lat | iex',
    note: '%LOCALAPPDATA%\\Programs\\Jojun\\jojun.exe · PATH se registra al instalar'
  },
  {
    id: 'unix',
    platform: 'macOS / Linux · bash',
    arch: 'darwin · linux',
    command: 'curl -fsSL https://get.jojun.jonathanrbt.lat | bash',
    note: '~/.local/bin/jojun · Apple Silicon firma el binario en el primer run'
  }
] as const;

export const principles = [
  {
    n: '01',
    title: 'Sin registro',
    body: 'No hay signup, ni correo, ni teléfono. Abres una terminal, escribes jojun y ya estás dentro.'
  },
  {
    n: '02',
    title: 'Sesión local',
    body: 'Lo último recibido vive en tu disco, no en la nube. jojun leave sale de la sala y limpia la sesión.'
  },
  {
    n: '03',
    title: 'Sin servidor propio',
    body: 'Los peers se encuentran por un topic en la DHT de Hyperswarm. El nombre de la sala se hashea con SHA-256 antes de salir de tu máquina.'
  }
] as const;

export const stack = [
  { label: 'Runtime', value: 'Bare · binario standalone' },
  { label: 'P2P', value: 'Hyperswarm topic' },
  { label: 'Parser', value: 'paparam' },
  { label: 'Distribución', value: 'GitHub Releases' },
  { label: 'Self-update', value: 'jojun update · SHA-256' },
  { label: 'Licencia', value: 'Apache-2.0' }
] as const;

export const credits = [
  { name: 'Jonatin', href: 'https://www.linkedin.com/in/jonathan-romero-b2044a303/' },
  { name: 'Julidev', href: 'https://www.linkedin.com/in/jarestrepo/' },
  { name: 'Cristian', href: 'https://www.linkedin.com/in/cristiannustes27/' }
] as const;
