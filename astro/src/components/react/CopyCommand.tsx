import { useCallback, useRef, useState } from 'react';

export interface CopyCommandProps {
  command: string;
  /** Visual label for the button in its resting state. */
  label?: string;
  copiedLabel?: string;
  className?: string;
}

/**
 * Single-responsibility island: the only interactive part of the install card.
 * Everything around it stays static HTML so the section ships zero JS by default.
 */
export function CopyCommand({
  command,
  label = 'Copy',
  copiedLabel = 'Copiado',
  className = ''
}: CopyCommandProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(command);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = command;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1600);
  }, [command]);

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={`Copiar: ${command}`}
      className={`h-[26px] cursor-pointer rounded-[7px] bg-accent px-3 text-[12px] font-semibold text-[#0a0a12] transition-[background,transform] duration-150 hover:bg-[#9aa5ff] active:scale-[0.97] ${className}`}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}

export default CopyCommand;
