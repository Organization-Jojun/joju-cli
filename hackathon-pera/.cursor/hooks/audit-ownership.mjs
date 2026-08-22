#!/usr/bin/env node
// Auditoría de ownership — NO bloquea, solo registra.
//
// Se dispara en `afterFileEdit`. Deriva el agente de la rama git actual
// (`agent-a/*` -> agent-a, `agent-b/*` -> agent-b) y, si el archivo editado
// cae FUERA de la carpeta asignada a ese agente, deja una línea en
// `.agent-state/ownership-audit.log` para revisar al final, sin haber
// intervenido durante la ejecución.
//
// Diseñado para Fase 1 (build autónomo, sin humano): jamás bloquea, jamás
// pregunta, siempre sale con código 0.

import { readFileSync, appendFileSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { relative, resolve, isAbsolute } from "node:path";

// --- Mapa de ownership. Cierra estas rutas en Fase 0, junto con el layout. ---
const OWNERSHIP = {
  "agent-a": ["src/core", "src/cli", "src/commands"],
  "agent-b": ["src/p2p", "src/deploy", "src/update", "scripts", "out"],
};

// Rutas que cualquiera puede tocar (coordinación y estado compartido).
const SHARED = [
  ".agent-state",
  "HANDOFF.md",
  "docs",
  "README.md",
  "AGENTS.md",
  "PROYECTO.md",
  "HERRAMIENTAS.md",
  ".cursor",
];

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function getEditedFile(payload) {
  return (
    payload.file_path ||
    payload.path ||
    payload.filePath ||
    (payload.edit && (payload.edit.file_path || payload.edit.path)) ||
    (Array.isArray(payload.edits) &&
      payload.edits[0] &&
      (payload.edits[0].file_path || payload.edits[0].path)) ||
    ""
  );
}

function currentAgent() {
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf8",
    }).trim();
    if (branch.startsWith("agent-a/")) return "agent-a";
    if (branch.startsWith("agent-b/")) return "agent-b";
    return `desconocido(${branch})`;
  } catch {
    return "sin-git";
  }
}

function isInside(file, base) {
  const rel = relative(resolve(base), resolve(file));
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

function isInsideAny(file, bases) {
  return bases.some((b) => isInside(file, b));
}

function main() {
  let payload = {};
  try {
    payload = JSON.parse(readStdin() || "{}");
  } catch {
    process.exit(0); // fail open
  }

  const file = getEditedFile(payload);
  if (!file) process.exit(0);

  // Territorio compartido: permitido, no se audita.
  if (isInsideAny(file, SHARED)) process.exit(0);

  const agent = currentAgent();
  const owned = OWNERSHIP[agent] || [];
  if (isInsideAny(file, owned)) process.exit(0);

  // Fuera de su carpeta -> se registra, nunca se bloquea.
  try {
    mkdirSync(".agent-state", { recursive: true });
    const line = `${new Date().toISOString()}\t${agent}\tFUERA_DE_OWNERSHIP\t${file}\n`;
    appendFileSync(".agent-state/ownership-audit.log", line);
  } catch {
    // pase lo que pase, no rompemos el flujo del agente
  }

  process.exit(0);
}

main();
