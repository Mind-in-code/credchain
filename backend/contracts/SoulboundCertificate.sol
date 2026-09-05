// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title SoulboundCertificate
/// @notice Non-transferable ERC-721 credentials minted by whitelisted issuers.
///         Metadata (student name, course, date, issuer) lives on IPFS; the
///         tokenURI is the IPFS hash/URI stored on-chain per token.
contract SoulboundCertificate is ERC721Enumerable, Ownable {
    struct Certificate {
        address issuer;
        string tokenURI;
        uint256 issuedAt;
        bool revoked;
    }

    /// @dev Whitelisted addresses allowed to mint certificates.
    mapping(address => bool) public isIssuer;

    /// @dev tokenId => certificate record.
    mapping(uint256 => Certificate) public certificates;

    uint256 private _nextTokenId = 1;

    event IssuerAdded(address indexed issuer);
    event IssuerRemoved(address indexed issuer);
    event CertificateMinted(
        uint256 indexed tokenId,
        address indexed to,
        address indexed issuer,
        string tokenURI
    );
    event CertificateRevoked(uint256 indexed tokenId, address indexed issuer);

    modifier onlyIssuer() {
        require(isIssuer[msg.sender], "Not an authorized issuer");
        _;
    }

    constructor(string memory name_, string memory symbol_)
        ERC721(name_, symbol_)
        Ownable(msg.sender)
    {}

    // ---------------------------------------------------------------------
    // Issuer management (owner only)
    // ---------------------------------------------------------------------

    function addIssuer(address issuer) external onlyOwner {
        require(issuer != address(0), "Zero address");
        isIssuer[issuer] = true;
        emit IssuerAdded(issuer);
    }

    function removeIssuer(address issuer) external onlyOwner {
        isIssuer[issuer] = false;
        emit IssuerRemoved(issuer);
    }

    // ---------------------------------------------------------------------
    // Minting
    // ---------------------------------------------------------------------

    /// @param to Student wallet receiving the credential.
    /// @param tokenURI_ IPFS URI (e.g. ipfs://<hash>) pointing to the JSON
    ///        metadata: { name, course, date, issuer, ... }
    function mintCertificate(address to, string calldata tokenURI_)
        external
        onlyIssuer
        returns (uint256)
    {
        require(to != address(0), "Zero address");
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        certificates[tokenId] = Certificate({
            issuer: msg.sender,
            tokenURI: tokenURI_,
            issuedAt: block.timestamp,
            revoked: false
        });
        emit CertificateMinted(tokenId, to, msg.sender, tokenURI_);
        return tokenId;
    }

    // ---------------------------------------------------------------------
    // Revocation
    // ---------------------------------------------------------------------

    /// @notice Marks a certificate invalid without transferring/burning it.
    ///         Callable by the original issuer or the contract owner.
    function revokeCertificate(uint256 tokenId) external {
        require(_ownerOf(tokenId) != address(0), "Nonexistent token");
        Certificate storage cert = certificates[tokenId];
        require(
            msg.sender == cert.issuer || msg.sender == owner(),
            "Not authorized to revoke"
        );
        require(!cert.revoked, "Already revoked");
        cert.revoked = true;
        emit CertificateRevoked(tokenId, msg.sender);
    }

    // ---------------------------------------------------------------------
    // Verification (public, read-only)
    // ---------------------------------------------------------------------

    function verifyCertificate(uint256 tokenId)
        external
        view
        returns (
            bool valid,
            address owner_,
            address issuer,
            string memory tokenURI_,
            uint256 issuedAt,
            bool revoked
        )
    {
        require(_ownerOf(tokenId) != address(0), "Nonexistent token");
        Certificate memory cert = certificates[tokenId];
        return (
            !cert.revoked,
            _ownerOf(tokenId),
            cert.issuer,
            cert.tokenURI,
            cert.issuedAt,
            cert.revoked
        );
    }

    /// @notice Returns all token IDs owned by a wallet (for the "look up by
    ///         address" verification flow).
    function getCertificatesOf(address wallet) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(wallet);
        uint256[] memory tokenIds = new uint256[](balance);
        for (uint256 i = 0; i < balance; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(wallet, i);
        }
        return tokenIds;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Nonexistent token");
        return certificates[tokenId].tokenURI;
    }

    // ---------------------------------------------------------------------
    // Soulbound enforcement: block all transfers except mint/burn
    // ---------------------------------------------------------------------

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721Enumerable)
        returns (address)
    {
        address from = _ownerOf(tokenId);
        require(from == address(0) || to == address(0), "Soulbound: transfer not allowed");
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 amount)
        internal
        override(ERC721Enumerable)
    {
        super._increaseBalance(account, amount);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
