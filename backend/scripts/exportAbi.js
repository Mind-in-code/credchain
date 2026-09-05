// Copies the compiled ABI and the deployed addresses into the frontend.
//
//   backend/artifacts/.../SoulboundCertificate.json
//     -> frontend/src/contracts/SoulboundCertificate.json
//   backend/deployments/<chainId>.json
//     -> frontend/src/contracts/addresses.json   { "31337": "0x...", "11155111": "0x..." }
//
// Run it after every deploy:  npm run export-abi
// Addresses for other chains already in addresses.json are kept, not wiped.

const fs = require("fs");
const path = require("path");

const BACKEND = path.join(__dirname, "..");
const ARTIFACT = path.join(
  BACKEND,
  "artifacts",
  "contracts",
  "SoulboundCertificate.sol",
  "SoulboundCertificate.json"
);
const DEPLOYMENTS_DIR = path.join(BACKEND, "deployments");
const OUT_DIR = path.join(BACKEND, "..", "frontend", "src", "contracts");
const ABI_OUT = path.join(OUT_DIR, "SoulboundCertificate.json");
const ADDRESSES_OUT = path.join(OUT_DIR, "addresses.json");

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    return fallback;
  }
}

function main() {
  if (!fs.existsSync(ARTIFACT)) {
    throw new Error(
      "No compiled artifact found.\nRun `npx hardhat compile` first, then try again."
    );
  }

  const artifact = readJson(ARTIFACT, null);
  if (!artifact || !Array.isArray(artifact.abi)) {
    throw new Error("The artifact at " + ARTIFACT + " has no abi array.");
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  // 1. The ABI. Only what the frontend needs, not the whole artifact.
  fs.writeFileSync(
    ABI_OUT,
    JSON.stringify(
      {
        contractName: artifact.contractName,
        abi: artifact.abi,
      },
      null,
      2
    ) + "\n"
  );
  console.log("ABI written: frontend/src/contracts/SoulboundCertificate.json");
  console.log("  " + artifact.abi.length + " entries");

  // 2. The addresses. Start from whatever is already there so a Sepolia
  //    address survives a local redeploy and the other way round.
  const addresses = readJson(ADDRESSES_OUT, {});
  const known = { 31337: "", 11155111: "", ...addresses };

  let found = 0;
  if (fs.existsSync(DEPLOYMENTS_DIR)) {
    for (const file of fs.readdirSync(DEPLOYMENTS_DIR)) {
      if (!file.endsWith(".json")) continue;
      const record = readJson(path.join(DEPLOYMENTS_DIR, file), null);
      if (!record || !record.address || !record.chainId) continue;
      known[record.chainId] = record.address;
      found += 1;
      console.log(
        "Address: chain " +
          record.chainId +
          " -> " +
          record.address +
          " (deploy block " +
          record.deployBlock +
          ")"
      );
    }
  }

  if (found === 0) {
    console.log("");
    console.log("No deployment records found in backend/deployments/.");
    console.log("Deploy first (npm run deploy:local), then run this again.");
    console.log("The ABI was still written, with empty addresses.");
  }

  fs.writeFileSync(ADDRESSES_OUT, JSON.stringify(known, null, 2) + "\n");
  console.log("Addresses written: frontend/src/contracts/addresses.json");
  console.log("");
}

try {
  main();
} catch (error) {
  console.error("");
  console.error("Export failed:");
  console.error(error.message || error);
  process.exitCode = 1;
}
