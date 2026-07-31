const { execFile } = require("node:child_process");

/**
 * Runs a T-SQL query against the orion database inside the orion-mssql
 * Docker container via sqlcmd, and returns parsed rows as an array of
 * objects. Shells out instead of pulling in a Node SQL driver so this
 * helper works with zero extra native dependencies, matching how every
 * manual DB check has been done throughout this project's migration
 * sessions.
 *
 * IMPORTANT (Windows/Git Bash): MSYS path conversion mangles the
 * "-Q" query argument's contents when it looks like a path, so callers
 * running this from a bash wrapper should keep MSYS_NO_PATHCONV=1 set
 * in the environment. When invoked directly via `node`, this is not an
 * issue (no shell path conversion happens).
 */
function runQuery(query, { database = "orion", container = "orion-mssql", user = "sa", password = "Orion_2026_Str0ng!" } = {}) {
  return new Promise((resolve, reject) => {
    const args = [
      "exec",
      container,
      "/opt/mssql-tools18/bin/sqlcmd",
      "-S", "localhost",
      "-U", user,
      "-P", password,
      "-C",
      "-d", database,
      "-s", "|",
      "-W",
      "-Q", `SET NOCOUNT ON; ${query}`,
    ];
    execFile("docker", args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(`db.runQuery failed: ${stderr || err.message}`));
        return;
      }
      resolve(parseSqlcmdOutput(stdout));
    });
  });
}

/** Parses sqlcmd's pipe-delimited (-s "|") output into an array of row objects. */
function parseSqlcmdOutput(stdout) {
  const lines = stdout
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("(") /* "(N rows affected)" */);
  if (lines.length < 2) return [];
  const headers = lines[0].split("|").map((h) => h.trim());
  const dataLines = lines.slice(1).filter((l) => !/^-+(\|-+)*$/.test(l));
  return dataLines.map((line) => {
    const cells = line.split("|").map((c) => c.trim());
    const row = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? null;
    });
    return row;
  });
}

/** Convenience: returns the single most-recently-created row of a table, ordered by its identity/PK column descending. */
async function findLatest(table, idColumn, options) {
  const rows = await runQuery(`SELECT TOP 1 * FROM ${table} ORDER BY ${idColumn} DESC;`, options);
  return rows[0] ?? null;
}

/** Convenience: deletes a row by id from a table - use in test teardown so scripted runs don't pollute the seed data. */
async function deleteById(table, idColumn, id, options) {
  await runQuery(`DELETE FROM ${table} WHERE ${idColumn} = ${id};`, options);
}

module.exports = { runQuery, findLatest, deleteById, parseSqlcmdOutput };
