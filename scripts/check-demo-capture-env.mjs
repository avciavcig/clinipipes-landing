#!/usr/bin/env node
const { getCombinedDemoCaptureStatus } = require("../lib/demo-capture-env.js");

async function main() {
  const status = await getCombinedDemoCaptureStatus();
  const { landing, portalProbe, portal } = status;

  console.log("CliniPipes demo capture env\n");
  console.log("Landing (" + landing.service + ")");
  Object.entries(landing.checks).forEach(function ([key, ok]) {
    console.log("  " + (ok ? "✓" : "✗") + " " + key);
  });
  console.log("  mode:", landing.mode);
  if (landing.missing.length) {
    console.log("  missing:", landing.missing.join(", "));
  }

  console.log("\nPortal probe");
  if (portalProbe.ok && portal) {
    console.log("  ✓ portal reachable");
    Object.entries(portal.checks || {}).forEach(function ([key, ok]) {
      console.log("  " + (ok ? "✓" : "✗") + " " + key);
    });
    if (portal.missing && portal.missing.length) {
      console.log("  missing:", portal.missing.join(", "));
    }
  } else {
    console.log("  ✗", portalProbe.error || ("HTTP " + (portalProbe.status || "?")));
  }

  console.log("\nOverall:", status.ready ? "READY" : "NOT READY");
  if (!status.ready && status.combinedMissing.length) {
    console.log("Fix:", status.combinedMissing.join("; "));
  }

  process.exit(status.ready ? 0 : 1);
}

main().catch(function (err) {
  console.error(err.message || err);
  process.exit(1);
});
