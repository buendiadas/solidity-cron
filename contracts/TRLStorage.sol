pragma solidity ^0.4.24;
    
import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "@frontier-token-research/role-registries/contracts/Registry.sol";
import "@frontier-token-research/cron/contracts/PeriodicStages.sol";
import "./scoring/ScoringInterface.sol";

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

    // Scoring Function
    ScoringInterface public scoring;

    // Minimum stake to participate in the period, 0 by default
    uint256[2] public stakingConstraints = [0, 2^256 - 1];

    // Array setting up the limits when voting [min_amount, Max_amount]
    uint256[2] public votingConstraints = [0, 2^256 - 1];

    /** Setters **/

    /**
    * @dev Sets a new candidate registry address
    * @param _contractAddress new contract address to be set
    */

    function setCandidateRegistry(address _contractAddress) public {
        candidateRegistry = Registry(_contractAddress);
    }

    /**
    * @dev Sets a new voter registry address
    * @param _contractAddress new contract address to be set
    */

    function setVoterRegistry(address _contractAddress) public {
        voterRegistry = Registry(_contractAddress);
    }

    /**
    * @dev Sets a new token address
    * @param _contractAddress new contract address to be set
    */

    function setToken(address _contractAddress) public {
        token = StandardToken(_contractAddress);
    }

    /**
    * @dev Sets a new periodic stages address
    * @param _contractAddress new contract address to be set
    */

    function setPeriodicStages(address _contractAddress) public {
        periodicStages = PeriodicStages(_contractAddress);
    }

    /**
    * @dev Sets a new periodic stages address

    */

    function setScoring(address _contractAddress) public {
        scoring = ScoringInterface(_contractAddress);
    }

    /**
    * @dev Sets a new candidate registry address
    */

    /** Getters */

    function getCandidateRegistry() public view returns (address) {
        return address(candidateRegistry);
    }

    /**
    * @dev Sets a new voter registry address
    */

    function getVoterRegistry() public view returns (address) {
        return address(voterRegistry);
    }

    /**
    * @dev Sets a new token address
    */

    function getToken() public view returns (address) {
        return address(token);
    }

    /**
    * @dev Sets a new periodic stages address
    */

    function getPeriodicStages() public view returns (address) {
         return address(periodicStages);
    }

    /**
    * @dev Sets a new periodic stages address
    */

    function getScoring() public view returns (address) {
        return address(scoring);
    }
}