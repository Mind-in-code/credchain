# On-Chain Verifiable Credentials (Soulbound Certificates)

HackBlox — Problem Statement #2 (Domain: Identity / Education)

A dApp where whitelisted issuers (universities, course platforms) mint
non-transferable NFT certificates to a student's wallet, and anyone can
instantly verify a certificate's authenticity and issuer on-chain.

## What's included

- **`contracts/SoulboundCertificate.sol`** — ERC-721 (Enumerable) modified to
  block all transfers after minting, with an issuer whitelist, IPFS metadata
  references, a public `verifyCertificate` view function, and a revocation
  flag (bonus feature).
- **`test/SoulboundCertificate.test.js`** — Hardhat/Mocha test suite covering
  every core requirement.
- **`scripts/deploy.js`** — deployment script for any EVM testnet.
- **`frontend/index.html`** — single-file frontend (no build step) with three
  views: public verification, issuer dashboard (mint/revoke), and an owner
  admin panel (whitelist management). Uses ethers.js v6 via CDN + MetaMask.

This has been compiled and behaviorally tested (mint, transfer-block,
revoke, verify, enumerate, whitelist add/remove) against a local EVM node —
see "How this was verified" below.

## Core requirements covered

- ✅ Non-transferable (soulbound) NFT — `_update` override reverts on any
  transfer that isn't a mint or burn.
- ✅ Only whitelisted issuer addresses can mint — `onlyIssuer` modifier +
  owner-controlled `addIssuer`/`removeIssuer`.
- ✅ Certificate metadata stored on IPFS, referenced on-chain — `tokenURI`
  per certificate, set at mint time.
- ✅ Public verification page — enter a token ID or wallet address, see all
  valid certificates + issuer info.
- ✅ Issuer dashboard to mint new certificates.

## Bonus features covered

- ✅ Revocation — issuer (or owner) can call `revokeCertificate`, which
  flags a certificate invalid without transferring or burning it.
- ⬜ QR code linking to the verification page — not built yet; straightforward
  to add client-side (e.g. a QR library encoding `yoursite.com/?verify=<id>`)
  if you have hackathon time left.
- ⬜ Multi-tier issuers (department sub-approval) — not built; current model
  is a flat owner-controlled whitelist, which covers the core requirement.

## Quick start

```bash
npm install
cp .env.example .env
# edit .env: add an RPC URL (Alchemy/Infura) and a throwaway deployer private key

npx hardhat compile
npx hardhat test

npm run deploy:sepolia
# or: npm run deploy:mumbai
```

The deploy script prints the new contract address. Paste it into
`CONTRACT_ADDRESS` near the top of `frontend/index.html`'s `<script>` tag,
then just open that file in a browser (or serve it — e.g. `npx serve frontend`).

## Demo flow

1. **Connect wallet** (top bar) with the account you deployed from — that's
   the contract owner.
2. **Admin tab** → Add Issuer → paste an issuer wallet address (can be a
   second MetaMask account, or your university's wallet).
3. Switch MetaMask to that issuer account → **Issuer Dashboard tab** → Mint
   Certificate → student wallet + an IPFS metadata URI.
   - For a real IPFS URI: upload a JSON like
     `{"name": "Jane Doe", "course": "CS 101", "date": "2026-09-05", "issuer": "State University"}`
     to nft.storage or web3.storage/Pinata, and use the returned `ipfs://...` URI.
   - For a fast demo without IPFS setup, any placeholder URI string works —
     the contract doesn't validate it, it just stores it.
4. **Public Verification tab** → paste the token ID (or the student's wallet
   address) → see the certificate, its issuer, and validity.
5. Back in the issuer account, try **Revoke Certificate** on that token ID,
   then re-verify — it now shows invalid/revoked, still in the student's wallet.
6. Try transferring the token from the student's account (e.g. via Etherscan's
   "Write Contract" tab) — it will revert, demonstrating the soulbound property.

## How this was verified

Hardhat's own compiler downloader needs network access to
`binaries.soliditylang.org`, which wasn't available in the environment this
was built in. To still validate correctness before handing it off:

1. Compiled the contract with the `solc` npm package directly (Solidity
   0.8.24, `evmVersion: cancun`, optimizer on) — zero errors, ABI generated.
2. Started a local Hardhat EVM node and, using ethers.js directly against the
   compiled bytecode/ABI, ran through the full flow end-to-end: non-issuer
   mint rejected, non-owner whitelist rejected, issuer mint succeeds,
   transfer from student wallet reverts with "Soulbound: transfer not
   allowed", public `verifyCertificate` returns correct data, unauthorized
   revoke rejected, authorized revoke correctly invalidates the certificate,
   `getCertificatesOf` correctly enumerates a wallet's tokens, and a removed
   issuer can no longer mint.

All of the above passed. Once you have normal internet access, `npx hardhat
compile` and `npx hardhat test` will run the same checks (plus the full
Mocha suite in `test/`) directly.

## Tech stack

Solidity (ERC-721 modified for non-transferability via OpenZeppelin
`ERC721Enumerable`), Hardhat, ethers.js v6, plain HTML/JS frontend,
IPFS for metadata, deployable to Sepolia or Polygon Mumbai.
