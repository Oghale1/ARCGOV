// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ArcGovCore
 * @notice Community governance for the Arc blockchain. Handles proposals,
 *         voting, and a simple "execution" (closing) step with a quorum.
 * @dev Voting is 1-address-1-vote (Sybil-resistant via future token gating).
 */
contract ArcGovCore {
    enum Category { VALIDATOR, PARAMETER, UPGRADE, ECOSYSTEM }
    enum VoteType { FOR, AGAINST, ABSTAIN }

    struct Proposal {
        uint256 id;
        string title;
        string description;
        Category category;
        string ipfsHash;
        address proposer;
        uint256 createdAt;
        uint256 votingDeadline;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool isOpen;
    }

    mapping(uint256 => Proposal) private proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => VoteType)) public voterChoice;
    uint256 public proposalCount;

    address public admin;

    /// @notice Minimum number of total votes for a proposal to be able to pass.
    uint256 public constant QUORUM = 5;

    event ProposalCreated(uint256 indexed id, address indexed proposer, string title, Category category, uint256 votingDeadline);
    event VoteCast(uint256 indexed proposalId, address indexed voter, VoteType voteType, uint256 newForVotes, uint256 newAgainstVotes, uint256 newAbstainVotes);
    event ProposalExecuted(uint256 indexed id, bool passed, uint256 forVotes, uint256 againstVotes);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function submitProposal(
        string memory title,
        string memory description,
        Category category,
        string memory ipfsHash
    ) external returns (uint256) {
        proposalCount++;
        uint256 newId = proposalCount;
        uint256 deadline = block.timestamp + 7 days;

        proposals[newId] = Proposal({
            id: newId,
            title: title,
            description: description,
            category: category,
            ipfsHash: ipfsHash,
            proposer: msg.sender,
            createdAt: block.timestamp,
            votingDeadline: deadline,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            isOpen: true
        });

        emit ProposalCreated(newId, msg.sender, title, category, deadline);
        return newId;
    }

    function castVote(uint256 proposalId, VoteType voteType) external returns (bool) {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal");
        require(proposals[proposalId].isOpen, "Proposal closed");
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        require(block.timestamp <= proposals[proposalId].votingDeadline, "Voting ended");

        hasVoted[proposalId][msg.sender] = true;
        voterChoice[proposalId][msg.sender] = voteType;

        Proposal storage p = proposals[proposalId];
        if (voteType == VoteType.FOR) {
            p.forVotes++;
        } else if (voteType == VoteType.AGAINST) {
            p.againstVotes++;
        } else {
            p.abstainVotes++;
        }

        emit VoteCast(proposalId, msg.sender, voteType, p.forVotes, p.againstVotes, p.abstainVotes);
        return true;
    }

    /**
     * @notice Closes a proposal after its deadline and records the result.
     *         Anyone can call this once voting has ended — this is the
     *         "execution" step. A proposal passes only if it reaches QUORUM
     *         total votes AND has more FOR than AGAINST votes.
     */
    function closeProposal(uint256 proposalId) external returns (bool passed) {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal");
        Proposal storage p = proposals[proposalId];
        require(p.isOpen, "Already closed");
        require(block.timestamp > p.votingDeadline, "Voting not ended");

        p.isOpen = false;

        uint256 totalVotes = p.forVotes + p.againstVotes + p.abstainVotes;
        passed = totalVotes >= QUORUM && p.forVotes > p.againstVotes;

        emit ProposalExecuted(proposalId, passed, p.forVotes, p.againstVotes);
        return passed;
    }

    function getProposal(uint256 id) external view returns (Proposal memory) {
        require(id > 0 && id <= proposalCount, "Invalid proposal");
        return proposals[id];
    }

    function getAllProposals() external view returns (Proposal[] memory) {
        Proposal[] memory all = new Proposal[](proposalCount);
        for (uint256 i = 1; i <= proposalCount; i++) {
            all[i - 1] = proposals[i];
        }
        return all;
    }

    function getProposalCount() external view returns (uint256) {
        return proposalCount;
    }

    /// @notice True if `voter` has already voted on `proposalId`.
    function hasVotedOn(uint256 proposalId, address voter) external view returns (bool) {
        return hasVoted[proposalId][voter];
    }

    /// @notice The vote a `voter` cast (0 = FOR, 1 = AGAINST, 2 = ABSTAIN).
    function getVoterChoice(uint256 proposalId, address voter) external view returns (uint8) {
        return uint8(voterChoice[proposalId][voter]);
    }
}
