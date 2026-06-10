const { readFileSync } = require("node:fs");
const { join } = require("node:path");

function unquote(value) {
  const trimmed = value.trim();
  if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;

  const normalized = trimmed.startsWith("export ") ? trimmed.slice(7).trim() : trimmed;
  const equalsAt = normalized.indexOf("=");
  if (equalsAt <= 0) return null;

  const key = normalized.slice(0, equalsAt).trim();
  const value = normalized.slice(equalsAt + 1);
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return null;
  return [key, unquote(value)];
}

function loadEnvFile({ cwd = process.cwd(), path = join(cwd, ".env"), override = false } = {}) {
  let contents;
  try {
    contents = readFileSync(path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return { loaded: false, path, keys: [] };
    throw error;
  }

  const keys = [];
  contents.replace(/^\uFEFF/, "").split(/\r?\n/).forEach((line) => {
    const parsed = parseEnvLine(line);
    if (!parsed) return;
    const [key, value] = parsed;
    if (!override && Object.prototype.hasOwnProperty.call(process.env, key)) return;
    process.env[key] = value;
    keys.push(key);
  });

  return { loaded: true, path, keys };
}

module.exports = { loadEnvFile };
