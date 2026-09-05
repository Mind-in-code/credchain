// Deploys SoulboundCertificate.
//   Local:   npm run deploy:local     (needs `npm run node` in another terminal)
//   Sepolia: npm run deploy:sepolia   (needs backend/.env filled in)
//
// On the local chain it also whitelists Hardhat account 1 as an issuer, so the
// frontend has something to demo straight away.

const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const NAME = "CredChain Certificate";
const SYMBOL = "CRED";
const LOCAL_CHAIN_ID = 31337n;

// Where the deploy record goes, so exportAbi.js can pick up the address.
const DEPLOYMENTS_DIR = path.join(__dirname, "..", "deployments");

async function main() {
  const { chainId } = await hre.ethers.provider.getNetwork();
  const signers = await hre.ethers.getSigners();
  const admin = signers[0];

  console.log("");
  console.log("Deploying SoulboundCertificate");
  console.log("  Network:  " + hre.network.name + " (chain id " + chainId + ")");
  console.log("  Deployer: " + admin.address);

  const balance = await hre.ethers.provider.getBalance(admin.address);
  console.log("  Balance:  " + hre.ethers.formatEther(balance) + " ETH");

  if (balance === 0n) {
    throw new Error(
      "The deployer wallet has no ETH. On Sepolia, get test ETH from a faucet first."
    );
  }

  const Factory = await hre.ethers.getContractFactory("SoulboundCertificate");
  const contract = await Factory.deploy(NAME, SYMBOL);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const receipt = await contract.deploymentTransaction().wait();

  console.log("");
  console.log("Deployed");
  console.log("  Name:          " + NAME);
  console.log("  Symbol:        " + SYMBOL);
  console.log("  Address:       " + address);
  console.log("  Deploy block:  " + receipt.blockNumber);
  console.log("  Owner (admin): " + (await contract.owner()));

  // On the local chain, whitelist account 1 so the issuer dashboard works at once.
  if (chainId === LOCAL_CHAIN_ID && signers[1]) {
    const issuer = signers[1];
    const tx = await contract.connect(admin).addIssuer(issuer.address);
    await tx.wait();

    console.log("");
    console.log("Local setup");
    console.log("  Issuer whitelisted: " + issuer.address + " (Hardhat account 1)");
    console.log("  isIssuer check:     " + (await contract.isIssuer(issuer.address)));
    if (signers[2]) {
      console.log("  Suggested student:  " + signers[2].address + " (Hardhat account 2)");
    }
  }

  // Save the record so exportAbi.js knows the address without being told.
  fs.mkdirSync(DEPLOYMENTS_DIR, { recursive: true });
  const recordPath = path.join(DEPLOYMENTS_DIR, chainId + ".json");
  fs.writeFileSync(
    recordPath,
    JSON.stringify(
      {
        network: hre.network.name,
        chainId: Number(chainId),
        address,
        deployBlock: receipt.blockNumber,
        name: NAME,
        symbol: SYMBOL,
        deployedAt: new Date().toISOString(),
      },
      null,
      2
    ) + "\n"
  );
  console.log("");
  console.log("  Record saved: deployments/" + chainId + ".json");

  console.log("");
  console.log("Next steps");
  console.log("  1. Copy the ABI and address to the frontend:  npm run export-abi");
  console.log("  2. Put these in frontend/.env:");
  console.log("       VITE_CONTRACT_ADDRESS=" + address);
  console.log("       VITE_DEPLOY_BLOCK=" + receipt.blockNumber);
  console.log("       VITE_CHAIN_ID=" + chainId);
  console.log("");
}

main().catch((error) => {
  console.error("");
  console.error("Deploy failed:");
  console.error(error.message || error);
  process.exitCode = 1;
});
