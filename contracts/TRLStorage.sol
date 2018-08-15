pragma solidity ^0.4.24;
    
import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "@frontier-token-research/role-registries/contracts/Registry.sol";
import "@frontier-token-research/cron/contracts/PeriodicStages.sol";


contract TRLStorage {

    mapping (uint256 => mapping(address => uint256)) public votesReceived;
    mapping (uint256 => mapping(address => uint256)) public votesBalance;
    mapping (uint256 => uint256) totalPeriodVotes;
    
    // Registry of candidates to be voted
    Registry public candidateRegistry;
 
    // Registry of candidates allowed to vote
    Registry public voterRegistry;

    // Master Token, used to buy votes
    StandardToken public token;

    // Stages that come periodically 
    PeriodicStages public periodicStages;

    // Minimum stake to participate in the period, 0 by default
    uint256[2] public stakingConstraints = [0, 2^256 - 1];

    // Array setting up the limits when voting [min_amount, Max_amount]
    uint256[2] public votingConstraints = [0, 2^256 - 1];

    /** Setters **/

    function setCandidateRegistry(address _contractAddress) {
        candidateRegistry = Registry(_contractAddress);
    }

    function setVoterRegistry(address _contractAddress) {
        voterRegistry = Registry(_contractAddress);
    }

    function setToken(address _contractAddress) {
        token = StandardToken(_contractAddress);
    }

    function setPeriodicStages(address _contractAddress) {
        periodicStages = PeriodicStages(_contractAddress);
    }

    /*
    * @dev Sets the minimum stake to participate in a period 
    * @param _minimumStakeAmount minimum stake to be added
    **/

    function setMinimumStake(uint256 _minimumStakeAmount) public {
        //require(msg.sender == owner);
        stakingConstraints[0] = _minimumStakeAmount;
    }

    /*
    * @dev Sets the minimum stake to participate in a period 
    * @param _minimumStakeAmount minimum stake to be added
    **/

    function setMaximumStake(uint256 _maximumStakeAmount) public {
        //require(msg.sender == owner);
        stakingConstraints[1] = _maximumStakeAmount;
    }

    /*
    * @dev Sets a voting limit to allocate to one candidate
    * @param _minimumStakeAmount minimum stake to be added
    **/

    function setMinVotingLimit(uint256 _minVoteAmount) public {
        //require(msg.sender == owner);
        votingConstraints[0] = _minVoteAmount; 
    }

    /*
    * @dev Sets a voting limit to allocate to one candidate
    * @param _minimumStakeAmount minimum stake to be added
    **/

    function setMaxVotingLimit(uint256 _maxVoteAmount) public {
        //require(msg.sender == owner);
        votingConstraints[1] = _maxVoteAmount; 
    }
}