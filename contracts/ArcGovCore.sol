// SPDX-License-Identifier: MIT
// ArcGov — arcgov.vercel.app

pragma solidity ^0.8.20;

/**
 * @title ArcGovCore
 * @dev The central governance contract for ArcGov, handling proposals and voting on the Arc blockchain.
 */
contract ArcGovCore {
    // --- DATA STRUCTURES ---

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

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => VoteType)) public voterChoice;
    
    uint256 public proposalCount = 0;
    uint256 public constant VOTING_PERIOD = 7 days;
    address public owner;

    // --- EVENTS ---

    event ProposalCreated(
        uint256 indexed id, 
        address indexed proposer, 
        string title, 
        Category category,
        uint256 votingDeadline
    );

    event VoteCast(
        uint256 indexed proposalId, 
        address indexed voter, 
        VoteType voteType,
        uint256 newForVotes,
        uint256 newAgainstVotes,
        uint256 newAbstainVotes
    );

    event ProposalClosed(uint256 indexed id, bool passed);

    // --- CONSTRUCTOR ---

    constructor() {
        owner = msg.sender;
    }

    // --- MODIFIERS ---

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    modifier proposalExists(uint256 id) {
        require(id > 0 && id <= proposalCount, "Proposal does not exist");
        _;
    }

    modifier votingOpen(uint256 id) {
        require(proposals[id].isOpen, "Voting is already closed");
        require(block.timestamp <= proposals[id].votingDeadline, "Voting period has ended");
        _;
    }

    // --- FUNCTIONS ---

    /**
     * @dev Submits a new governance proposal to the contract.
     */
    function submitProposal(
        string memory _title,
        string memory _description, 
        Category _category,
        string memory _ipfsHash
    ) external returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");

        proposalCount++;
        uint256 deadline = block.timestamp + VOTING_PERIOD;

        proposals[proposalCount] = Proposal({
            id: proposalCount,
            title: _title,
            description: _description,
            category: _category,
            ipfsHash: _ipfsHash,
            proposer: msg.sender,
            createdAt: block.timestamp,
            votingDeadline: deadline,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            isOpen: true
        });

        emit ProposalCreated(proposalCount, msg.sender, _title, _category, deadline);
        return proposalCount;
    }

    /**
     * @dev Casts a vote on a specific active proposal.
     */
    function castVote(
        uint256 _proposalId, 
        VoteType _voteType
    ) external proposalExists(_proposalId) votingOpen(_proposalId) returns (bool) {
        require(!hasVoted[_proposalId][msg.sender], "Already voted on this proposal");

        hasVoted[_proposalId][msg.sender] = true;
        voterChoice[_proposalId][msg.sender] = _voteType;

        Proposal storage p = proposals[_proposalId];

        if (_voteType == VoteType.FOR) {
            p.forVotes++;
        } else if (_voteType == VoteType.AGAINST) {
            p.againstVotes++;
        } else if (_voteType == VoteType.ABSTAIN) {
            p.abstainVotes++;
        }

        emit VoteCast(_proposalId, msg.sender, _voteType, p.forVotes, p.againstVotes, p.abstainVotes);
        return true;
    }

    /**
     * @dev Manually closes a proposal and records the outcome (Owner only).
     */
    function closeProposal(uint256 _proposalId) external onlyOwner proposalExists(_proposalId) {
        Proposal storage p = proposals[_proposalId];
        p.isOpen = false;
        
        bool passed = p.forVotes > p.againstVotes;
        emit ProposalClosed(_proposalId, passed);
    }

    /**
     * @dev Allows anyone to close a proposal if the voting deadline has passed.
     */
    function autoCloseIfExpired(uint256 _proposalId) external proposalExists(_proposalId) {
        Proposal storage p = proposals[_proposalId];
        require(p.isOpen, "Proposal already closed");
        require(block.timestamp > p.votingDeadline, "Voting deadline has not passed yet");

        p.isOpen = false;
        bool passed = p.forVotes > p.againstVotes;
        emit ProposalClosed(_proposalId, passed);
    }

    /**
     * @dev Returns the full details of a specific proposal.
     */
    function getProposal(uint256 _id) external view proposalExists(_id) returns (Proposal memory) {
        return proposals[_id];
    }

    /**
     * @dev Returns an array containing all proposals created so far.
     */
    function getAllProposals() external view returns (Proposal[] memory) {
        Proposal[] memory allProposals = new Proposal[](proposalCount);
        for (uint256 i = 1; i <= proposalCount; i++) {
            allProposals[i - 1] = proposals[i];
        }
        return allProposals;
    }

    /**
     * @dev Returns the total number of proposals submitted.
     */
    function getProposalCount() external view returns (uint256) {
        return proposalCount;
    }

    /**
     * @dev Checks if a specific address has already voted on a proposal.
     */
    function hasVotedOn(uint256 _proposalId, address _voter) external view returns (bool) {
        return hasVoted[_proposalId][_voter];
    }

    /**
     * @dev Returns the specific vote choice made by a voter on a proposal.
     */
    function getVoterChoice(uint256 _proposalId, address _voter) external view returns (VoteType) {
        return voterChoice[_proposalId][_voter];
    }

    /**
     * @dev Transfers ownership of the contract to a new address.
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "New owner cannot be the zero address");
        owner = _newOwner;
    }
}
