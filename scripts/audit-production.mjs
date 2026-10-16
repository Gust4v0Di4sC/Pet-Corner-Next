import { execFileSync } from "node:child_process";

let report;
try {
  execFileSync("npm", ["audit", "--omit=dev", "--json"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  console.log("Audit de produção: nenhuma vulnerabilidade encontrada.");
  process.exit(0);
} catch (error) {
  report = JSON.parse(error.stdout || "{}");
}
const blocking = Object.entries(report.vulnerabilities || {}).filter(([name, item]) =>
  ["high", "critical"].includes(item.severity)
);
if (blocking.length) {
  console.error("Vulnerabilidades altas/críticas alcançáveis em produção:");
  for (const [name, item] of blocking) console.error(`- ${name}: ${item.severity}`);
  process.exit(1);
}
console.log("Audit de produção aprovado: nenhuma vulnerabilidade alta ou crítica.");
