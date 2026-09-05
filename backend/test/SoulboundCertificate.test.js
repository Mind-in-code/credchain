const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

const NAME = "CredChain Certificate";
const SYMBOL = "CRED";
const URI_1 = "ipfs://bafybeidq7x2fmv0catr9jl5wzy63heb1sokp8und4gx0cmez7vabtlwr5y";
const URI_2 = "ipfs://bafybeicq0x8ftl2vd9nzam5rjy7bshp13euofkw6gd4t8cnvrz0xlmqhb4a";

describe("SoulboundCertificate", function () {
  // admin deploys, so admin is the owner. issuer gets whitelisted. student receives.
  async function deployFixture() {
    const [admin, issuer, student, outsider] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("SoulboundCertificate");
    const contract = await Factory.deploy(NAME, SYMBOL);
    await contract.waitForDeployment();

    return { contract, admin, issuer, student, outsider };
  }

  // A contract that already has one issuer and one minted certificate.
  async function mintedFixture() {
    const base = await loadFixture(deployFixture);
    const { contract, admin, issuer, student } = base;

    await contract.connect(admin).addIssuer(issuer.address);
    await contract.connect(issuer).mintCertificate(student.address, URI_1);

    return { ...base, tokenId: 1n };
  }

  describe("Deployment", function () {
    it("sets the name and symbol", async function () {
      const { contract } = await loadFixture(deployFixture);
      expect(await contract.name()).to.equal(NAME);
      expect(await contract.symbol()).to.equal(SYMBOL);
    });

    it("makes the deployer the owner", async function () {
      const { contract, admin } = await loadFixture(deployFixture);
      expect(await contract.owner()).to.equal(admin.address);
    });

    it("starts with no certificates and no issuers", async function () {
      const { contract, issuer } = await loadFixture(deployFixture);
      expect(await contract.totalSupply()).to.equal(0n);
      expect(await contract.isIssuer(issuer.address)).to.equal(false);
    });
  });

  describe("Issuer whitelist", function () {
    it("lets the owner add an issuer and emits IssuerAdded", async function () {
      const { contract, admin, issuer } = await loadFixture(deployFixture);

      await expect(contract.connect(admin).addIssuer(issuer.address))
        .to.emit(contract, "IssuerAdded")
        .withArgs(issuer.address);

      expect(await contract.isIssuer(issuer.address)).to.equal(true);
    });

    it("lets the owner remove an issuer and emits IssuerRemoved", async function () {
      const { contract, admin, issuer } = await loadFixture(deployFixture);
      await contract.connect(admin).addIssuer(issuer.address);

      await expect(contract.connect(admin).removeIssuer(issuer.address))
        .to.emit(contract, "IssuerRemoved")
        .withArgs(issuer.address);

      expect(await contract.isIssuer(issuer.address)).to.equal(false);
    });

    it("stops a non-owner from adding an issuer", async function () {
      const { contract, outsider } = await loadFixture(deployFixture);

      await expect(
        contract.connect(outsider).addIssuer(outsider.address)
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });

    it("stops a non-owner from removing an issuer", async function () {
      const { contract, admin, issuer, outsider } = await loadFixture(deployFixture);
      await contract.connect(admin).addIssuer(issuer.address);

      await expect(
        contract.connect(outsider).removeIssuer(issuer.address)
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });

    it("rejects the zero address as an issuer", async function () {
      const { contract, admin } = await loadFixture(deployFixture);

      await expect(
        contract.connect(admin).addIssuer(ethers.ZeroAddress)
      ).to.be.revertedWith("Zero address");
    });
  });

  describe("Minting", function () {
    it("lets a whitelisted issuer mint and emits CertificateMinted", async function () {
      const { contract, admin, issuer, student } = await loadFixture(deployFixture);
      await contract.connect(admin).addIssuer(issuer.address);

      await expect(contract.connect(issuer).mintCertificate(student.address, URI_1))
        .to.emit(contract, "CertificateMinted")
        .withArgs(1n, student.address, issuer.address, URI_1);

      expect(await contract.ownerOf(1n)).to.equal(student.address);
      expect(await contract.totalSupply()).to.equal(1n);
    });

    it("starts token IDs at 1 and increments by 1", async function () {
      const { contract, admin, issuer, student } = await loadFixture(deployFixture);
      await contract.connect(admin).addIssuer(issuer.address);

      await contract.connect(issuer).mintCertificate(student.address, URI_1);
      await contract.connect(issuer).mintCertificate(student.address, URI_2);

      const ids = await contract.getCertificatesOf(student.address);
      expect(ids.map(Number)).to.deep.equal([1, 2]);
    });

    it("stops a wallet that is not whitelisted from minting", async function () {
      const { contract, outsider, student } = await loadFixture(deployFixture);

      await expect(
        contract.connect(outsider).mintCertificate(student.address, URI_1)
      ).to.be.revertedWith("Not an authorized issuer");
    });

    it("stops the owner minting unless the owner is also whitelisted", async function () {
      const { contract, admin, student } = await loadFixture(deployFixture);

      await expect(
        contract.connect(admin).mintCertificate(student.address, URI_1)
      ).to.be.revertedWith("Not an authorized issuer");
    });

    it("stops a removed issuer from minting again", async function () {
      const { contract, admin, issuer, student } = await loadFixture(deployFixture);
      await contract.connect(admin).addIssuer(issuer.address);
      await contract.connect(issuer).mintCertificate(student.address, URI_1);
      await contract.connect(admin).removeIssuer(issuer.address);

      await expect(
        contract.connect(issuer).mintCertificate(student.address, URI_2)
      ).to.be.revertedWith("Not an authorized issuer");
    });

    it("rejects minting to the zero address", async function () {
      const { contract, admin, issuer } = await loadFixture(deployFixture);
      await contract.connect(admin).addIssuer(issuer.address);

      await expect(
        contract.connect(issuer).mintCertificate(ethers.ZeroAddress, URI_1)
      ).to.be.revertedWith("Zero address");
    });

    it("stores the tokenURI against the token", async function () {
      const { contract, tokenId } = await loadFixture(mintedFixture);
      expect(await contract.tokenURI(tokenId)).to.equal(URI_1);
    });
  });

  describe("Soulbound enforcement", function () {
    it("blocks transferFrom", async function () {
      const { contract, student, outsider, tokenId } = await loadFixture(mintedFixture);

      await expect(
        contract.connect(student).transferFrom(student.address, outsider.address, tokenId)
      ).to.be.revertedWith("Soulbound: transfer not allowed");
    });

    it("blocks safeTransferFrom", async function () {
      const { contract, student, outsider, tokenId } = await loadFixture(mintedFixture);

      await expect(
        contract
          .connect(student)
          ["safeTransferFrom(address,address,uint256)"](
            student.address,
            outsider.address,
            tokenId
          )
      ).to.be.revertedWith("Soulbound: transfer not allowed");
    });

    it("blocks a transfer even after the owner approves someone", async function () {
      const { contract, student, outsider, tokenId } = await loadFixture(mintedFixture);
      await contract.connect(student).approve(outsider.address, tokenId);

      await expect(
        contract.connect(outsider).transferFrom(student.address, outsider.address, tokenId)
      ).to.be.revertedWith("Soulbound: transfer not allowed");
    });

    it("leaves the certificate with the student after a failed transfer", async function () {
      const { contract, student, outsider, tokenId } = await loadFixture(mintedFixture);

      await expect(
        contract.connect(student).transferFrom(student.address, outsider.address, tokenId)
      ).to.be.reverted;

      expect(await contract.ownerOf(tokenId)).to.equal(student.address);
      expect(await contract.balanceOf(outsider.address)).to.equal(0n);
    });
  });

  describe("Revocation", function () {
    it("lets the issuing wallet revoke and emits CertificateRevoked", async function () {
      const { contract, issuer, tokenId } = await loadFixture(mintedFixture);

      await expect(contract.connect(issuer).revokeCertificate(tokenId))
        .to.emit(contract, "CertificateRevoked")
        .withArgs(tokenId, issuer.address);
    });

    it("lets the contract owner revoke", async function () {
      const { contract, admin, tokenId } = await loadFixture(mintedFixture);

      await expect(contract.connect(admin).revokeCertificate(tokenId))
        .to.emit(contract, "CertificateRevoked")
        .withArgs(tokenId, admin.address);
    });

    it("stops anyone else revoking, including the student", async function () {
      const { contract, student, outsider, tokenId } = await loadFixture(mintedFixture);

      await expect(
        contract.connect(student).revokeCertificate(tokenId)
      ).to.be.revertedWith("Not authorized to revoke");

      await expect(
        contract.connect(outsider).revokeCertificate(tokenId)
      ).to.be.revertedWith("Not authorized to revoke");
    });

    it("stops the same certificate being revoked twice", async function () {
      const { contract, issuer, tokenId } = await loadFixture(mintedFixture);
      await contract.connect(issuer).revokeCertificate(tokenId);

      await expect(
        contract.connect(issuer).revokeCertificate(tokenId)
      ).to.be.revertedWith("Already revoked");
    });

    it("rejects revoking a token that does not exist", async function () {
      const { contract, issuer } = await loadFixture(mintedFixture);

      await expect(
        contract.connect(issuer).revokeCertificate(9999n)
      ).to.be.revertedWith("Nonexistent token");
    });

    it("keeps the certificate in the student wallet after revocation", async function () {
      const { contract, issuer, student, tokenId } = await loadFixture(mintedFixture);
      await contract.connect(issuer).revokeCertificate(tokenId);

      expect(await contract.ownerOf(tokenId)).to.equal(student.address);
      expect(await contract.balanceOf(student.address)).to.equal(1n);
    });
  });

  describe("verifyCertificate", function () {
    it("returns the full record for a valid certificate", async function () {
      const { contract, issuer, student, tokenId } = await loadFixture(mintedFixture);

      const [valid, owner_, certIssuer, uri, issuedAt, revoked] =
        await contract.verifyCertificate(tokenId);

      expect(valid).to.equal(true);
      expect(owner_).to.equal(student.address);
      expect(certIssuer).to.equal(issuer.address);
      expect(uri).to.equal(URI_1);
      expect(issuedAt).to.be.greaterThan(0n);
      expect(revoked).to.equal(false);
    });

    it("reports valid false and revoked true after revocation", async function () {
      const { contract, issuer, tokenId } = await loadFixture(mintedFixture);
      await contract.connect(issuer).revokeCertificate(tokenId);

      const [valid, , , , , revoked] = await contract.verifyCertificate(tokenId);
      expect(valid).to.equal(false);
      expect(revoked).to.equal(true);
    });

    it("reverts for a token that does not exist", async function () {
      const { contract } = await loadFixture(mintedFixture);

      await expect(contract.verifyCertificate(9999n)).to.be.revertedWith(
        "Nonexistent token"
      );
    });

    it("is readable by any wallet, no whitelist needed", async function () {
      const { contract, outsider, tokenId } = await loadFixture(mintedFixture);

      const [valid] = await contract.connect(outsider).verifyCertificate(tokenId);
      expect(valid).to.equal(true);
    });
  });

  describe("getCertificatesOf", function () {
    it("returns every token a wallet holds", async function () {
      const { contract, admin, issuer, student } = await loadFixture(deployFixture);
      await contract.connect(admin).addIssuer(issuer.address);
      await contract.connect(issuer).mintCertificate(student.address, URI_1);
      await contract.connect(issuer).mintCertificate(student.address, URI_2);

      const ids = await contract.getCertificatesOf(student.address);
      expect(ids.map(Number)).to.deep.equal([1, 2]);
    });

    it("returns an empty list for a wallet with none", async function () {
      const { contract, outsider } = await loadFixture(mintedFixture);
      expect(await contract.getCertificatesOf(outsider.address)).to.deep.equal([]);
    });

    it("still lists a revoked certificate, since it stays in the wallet", async function () {
      const { contract, issuer, student, tokenId } = await loadFixture(mintedFixture);
      await contract.connect(issuer).revokeCertificate(tokenId);

      const ids = await contract.getCertificatesOf(student.address);
      expect(ids.map(Number)).to.deep.equal([1]);
    });
  });

  describe("tokenURI", function () {
    it("reverts for a token that does not exist", async function () {
      const { contract } = await loadFixture(mintedFixture);
      await expect(contract.tokenURI(9999n)).to.be.revertedWith("Nonexistent token");
    });
  });

  describe("Multiple issuers", function () {
    it("keeps each certificate attributed to the wallet that minted it", async function () {
      const { contract, admin, issuer, outsider, student } = await loadFixture(deployFixture);
      const issuerB = outsider;

      await contract.connect(admin).addIssuer(issuer.address);
      await contract.connect(admin).addIssuer(issuerB.address);

      await contract.connect(issuer).mintCertificate(student.address, URI_1);
      await contract.connect(issuerB).mintCertificate(student.address, URI_2);

      const [, , issuerOfOne] = await contract.verifyCertificate(1n);
      const [, , issuerOfTwo] = await contract.verifyCertificate(2n);

      expect(issuerOfOne).to.equal(issuer.address);
      expect(issuerOfTwo).to.equal(issuerB.address);
    });

    it("stops one issuer revoking another issuer's certificate", async function () {
      const { contract, admin, issuer, outsider, student } = await loadFixture(deployFixture);
      const issuerB = outsider;

      await contract.connect(admin).addIssuer(issuer.address);
      await contract.connect(admin).addIssuer(issuerB.address);
      await contract.connect(issuer).mintCertificate(student.address, URI_1);

      await expect(
        contract.connect(issuerB).revokeCertificate(1n)
      ).to.be.revertedWith("Not authorized to revoke");
    });
  });
});
