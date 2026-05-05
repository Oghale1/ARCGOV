// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ArcGovCore
 * @dev Governance and validator dashboard core contract for Arc blockchain.
 */
contract ArcGovCore {
    enum Category { VALIDATOR, PARAMETER, UPGRADE, ECOSYSTEM }
    enum VoteType { ABSTAIN, FOR, AGAINST }

    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        Category category;
        string ipfsHash;
        uint256 timestamp;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool isOpen;
    }

    address public owner;
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    // proposalId => voterAddress => hasVoted
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(uint256 indexed id, address indexed proposer, string title, Category category);
    event VoteCast(uint256 indexed id, address indexed voter, VoteType vote);
    event ProposalClosed(uint256 indexed id, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Submit a new governance proposal.
     */
    function submitProposal(
        string memory _title,
        string memory _description,
        Category _category,
        string memory _ipfsHash
    ) external returns (uint256) {
        proposalCount++;
        uint256 newId = proposalCount;

        proposals[newId] = Proposal({
            id: newId,
            proposer: msg.sender,
            title: _title,
            description: _description,
            category: _category,
            ipfsHash: _ipfsHash,
            timestamp: block.timestamp,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            isOpen: true
        });

        emit ProposalCreated(newId, msg.sender, _title, _category);
        return newId;
    }

    /**
     * @dev Vote on an open proposal.
     */
    function vote(uint256 _id, VoteType _vote) external {
        Proposal storage prop = proposals[_id];
        require(prop.isOpen, "Proposal is closed");
        require(!hasVoted[_id][msg.sender], "Already voted");

        if (_vote == VoteType.FOR) {
            prop.forVotes++;
        } else if (_vote == VoteType.AGAINST) {
            prop.againstVotes++;
        } else {
            prop.abstainVotes++;
        }

        hasVoted[_id][msg.sender] = true;
        emit VoteCast(_id, msg.sender, _vote);
    }

    /**
     * @dev Close a proposal (Only Owner).
     */
    function closeProposal(uint256 _id) external onlyOwner {
        Proposal storage prop = proposals[_id];
        require(prop.isOpen, "Already closed");

        prop.isOpen = false;
        emit ProposalClosed(_id, prop.forVotes, prop.againstVotes, prop.abstainVotes);
    }

    /**
     * @dev Get a specific proposal.
     */
    function getProposal(uint256 _id) external view returns (Proposal memory) {
        return proposals[_id];
    }

    /**
     * @dev Get all proposals.
     */
    function getAllProposals() external view returns (Proposal[] memory) {
        Proposal[] memory allProps = new Proposal[](proposalCount);
        for (uint256 i = 1; i <= proposalCount; i++) {
            allProps[i - 1] = proposals[i];
        }
        return allProps;
    }

    /**
     * @dev Transfer ownership (Basic).
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "New owner is zero address");
        owner = _newOwner;
    }
}
