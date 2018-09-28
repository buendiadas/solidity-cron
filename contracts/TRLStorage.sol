pragma solidity ^0.4.24;

import "./Vault.sol";
import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "@frontier-token-research/role-registries/contracts/Registry.sol";
import "@frontier-token-research/cron/contracts/PeriodicStages.sol";

contract TRLStorage {

    mapping (uint256 => mapping(address => uint256)) public votesReceived;
    mapping (uint256 => mapping(address => uint256)) public votesBalance;
    mapping (uint256 => uint256) public totalEpochVotes;

    
    // Registry of candidates to be voted
    Registry public candidateRegistry;
 
    // Registry of candidates allowed to vote
    Registry public voterRegistry;

    // Master Token, used to buy votes
    StandardToken public token;

    // Stages that come periodically 
    PeriodicStages public periodicStages;

    // Contract Storing the funds
    Vault public vault;

    // Contract managing Subscriptions
    address public subscriptionAddress;

    // Minimum stake to participate in the period, 0 by default
    uint256[2] public stakingConstraints = [0, 2^256 -1];

    // Array setting up the limits when voting [min_amount, Max_amount]
    uint256[2] public votingConstraints = [0, 2^256 -1];

    uint256 public reputationWindowSize = 0; 
    bool reputationWindowSizeSet = true;
    bool reputationWeightsSet = false;
    uint256[] public repWeights;

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
    * @dev Sets a new Vault Address
    * @param _contractAddress new contract address to be set
    */

    function setVault(address _contractAddress) public {
        vault = Vault(_contractAddress);
    }

    function setSubscriptionAccount(address _account) public {
        subscriptionAddress = _account;
    }

}