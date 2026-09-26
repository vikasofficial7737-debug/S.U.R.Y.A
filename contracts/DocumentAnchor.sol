// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * DocumentAnchor — S.U.R.Y.A. integrity anchor (Polygon Amoy testnet).
 *
 * Design rules (per integration spec §1):
 *   • ONLY SHA-256 hashes + opaque document/version references go on-chain.
 *     No document content, no names, no case metadata, no PII — ever.
 *   • One anchor per document version; re-anchoring the same version+hash is
 *     idempotent; anchoring the same version with a DIFFERENT hash reverts,
 *     so a conflicting hash cannot silently replace an original.
 *   • Anchors are immutable: no update/delete paths exist.
 *   • Cheap: single SSTORE per anchor + one event. Verify is a free view call.
 */
contract DocumentAnchor {
    address public immutable owner;

    struct Anchor {
        bytes32 fileHash;      // SHA-256 of the stored file bytes (left-aligned in bytes32)
        uint64  anchoredAt;    // block timestamp
        address anchoredBy;    // Edge Function wallet
    }

    // docCode => version => anchor   (docCode: opaque uuid/doc-code string hash)
    mapping(bytes32 => mapping(uint256 => Anchor)) private anchors;

    event DocumentAnchored(
        bytes32 indexed docCode,
        uint256 indexed version,
        bytes32 fileHash,
        address indexed anchoredBy,
        uint64 anchoredAt
    );

    error NotOwner();
    error EmptyHash();
    error ConflictingHash(bytes32 existing, bytes32 incoming);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    /**
     * Anchor one document version.
     * @param docCode  keccak256/bytes32 of an opaque reference (uuid or DOC-xxxx) — carries no PII
     * @param version  document version number
     * @param fileHash SHA-256 of file bytes as bytes32 (from hex string off-chain)
     */
    function anchorVersion(bytes32 docCode, uint256 version, bytes32 fileHash) external onlyOwner {
        if (fileHash == bytes32(0)) revert EmptyHash();

        Anchor storage a = anchors[docCode][version];
        if (a.fileHash != bytes32(0)) {
            if (a.fileHash != fileHash) revert ConflictingHash(a.fileHash, fileHash);
            // identical re-anchor: idempotent, emit nothing new worth storing
            return;
        }

        a.fileHash = fileHash;
        a.anchoredAt = uint64(block.timestamp);
        a.anchoredBy = msg.sender;

        emit DocumentAnchored(docCode, version, fileHash, msg.sender, uint64(block.timestamp));
    }

    /** Batch anchor (cheap for backfills): one tx, many versions. */
    function anchorBatch(
        bytes32[] calldata docCodes,
        uint256[] calldata versions,
        bytes32[] calldata fileHashes
    ) external onlyOwner {
        uint256 n = docCodes.length;
        require(n == versions.length && n == fileHashes.length, "length mismatch");
        for (uint256 i = 0; i < n; i++) {
            this.anchorVersion(docCodes[i], versions[i], fileHashes[i]);
        }
    }

    /** Free, public, independent verification — no key needed. */
    function verify(bytes32 docCode, uint256 version)
        external view
        returns (bytes32 fileHash, uint64 anchoredAt, address anchoredBy, bool exists_)
    {
        Anchor storage a = anchors[docCode][version];
        return (a.fileHash, a.anchoredAt, a.anchoredBy, a.fileHash != bytes32(0));
    }

    /** Events are also indexed by docCode for third-party explorers. */
    function ownerAddress() external view returns (address) { return owner; }
}
