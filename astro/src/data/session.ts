export type LineType = 'input' | 'output' | 'comment' | 'payload';

export interface TerminalLine {
  /** Global order across both terminals — drives the scroll-scrubbed reveal. */
  order: number;
  type: LineType;
  text: string;
}

export const pcA: TerminalLine[] = [
  { order: 1, type: 'comment', text: '# dos PC, el mismo nombre de sala' },
  { order: 2, type: 'input', text: 'jojun' },
  { order: 3, type: 'output', text: '1 Connect · 2 Send · 3 Receive · 4 Wait · 5 Disconnect' },
  { order: 4, type: 'input', text: 'c' },
  { order: 5, type: 'output', text: 'Room name: taller-de-la-tarde' },
  { order: 6, type: 'payload', text: 'in room · taller-de-la-tarde · peers 1 · two PCs (network)' },
  { order: 10, type: 'input', text: 'e' },
  { order: 11, type: 'output', text: 'Message to send: npm run make:darwin-arm64' },
  { order: 12, type: 'output', text: 'Sent · 28 bytes' }
];

export const pcB: TerminalLine[] = [
  { order: 7, type: 'input', text: 'c' },
  { order: 8, type: 'output', text: 'Room name: taller-de-la-tarde' },
  { order: 9, type: 'payload', text: 'in room · taller-de-la-tarde · peers 1' },
  { order: 13, type: 'comment', text: '# auto-receive on' },
  { order: 14, type: 'output', text: 'Received · 28 bytes' },
  { order: 15, type: 'input', text: 'npm run make:darwin-arm64' }
];
