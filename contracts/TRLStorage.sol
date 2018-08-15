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
    uint256[2] public stakingConstraints = [0, 2^256 -1];

    // Array setting up the limits when voting [min_amount, Max_amount]
    uint256[2] public votingConstraints = [0, 2^256 -1];
    
}