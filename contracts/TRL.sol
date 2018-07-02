pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "@frontier-token-research/role-registries/contracts/Registry.sol";
import "@frontier-token-research/role-registries/contracts/OwnedRegistryFactory.sol";
import "@frontier-token-research/cron/contracts/Period.sol";
import "@frontier-token-research/cron/contracts/PeriodicStages.sol";


/**
* A Token Ranked List (TRL) enables voting with staked tokens periodically, over a registry of candidates
*
**/
contract TRL {
    using SafeMath for uint256;

     // Amount that only can be changed in exchange of FTR (period => account => vote_amount)
    mapping (uint256 => mapping(address => uint256)) public votesReceived;

    // For each period, maps user's address to voteToken balance (period => account => vote_balance)
    mapping (uint256 => mapping(address => uint256)) public votesBalance;

    // Total amount of votes made on a current period, necessary for future Bounty calculation
    mapping(uint256 => uint256) totalPeriodVotes;

    // Registry of candidates to be voted
    Registry public candidateRegistry;

    // Registry of candidates allowed to vote
    Registry public voterRegistry;

    // Master Token, used to buy votes
    StandardToken public token;

    // Stages that come periodically 
    PeriodicStages public periodicStages;


    /**
    * Creates a new Instance of a Voting Lists
    * @param _tokenAddress Address of the token used for
    **/

    constructor(
        address _tokenAddress,
        address _candidateRegistryAddress,
        address _voterRegistryAddress,
        uint256 _initialTTL,
        uint256 _initialActiveTime,
        uint256 _initialClaimTime)
        public
    {
        require(_candidateRegistryAddress != 0x00 && _voterRegistryAddress != 0x00 && _tokenAddress != 0x00); 
        token = StandardToken(_tokenAddress);
        candidateRegistry = Registry(_candidateRegistryAddress);
        voterRegistry = Registry(_voterRegistryAddress);
        emit PeriodInit(_initialTTL, _initialActiveTime, _initialClaimTime);
        initPeriod(_initialTTL, _initialActiveTime, _initialClaimTime);
    }

    /**
    * Initializes a new period, taking as the TTL value the current from storage, and setting the state to 1
    * Requires that the current period is Preparing (0)
    **/

    function initPeriod(uint256 _periodTTL, uint256 _activeTime, uint256 _claimTime) public {
        periodicStages = new PeriodicStages(_periodTTL);
        periodicStages.pushStage(_activeTime);
        periodicStages.pushStage(_claimTime);
    }

    /**
    * Exchanges the main token for an amount of votes
    * Requires previous allowance of expenditure of at least the amount required
    * Currently 1:1 exchange used, but this rate could be changed
    * @param _amount Amount of votes that the voter wants to buy
    **/

    function buyTokenVotes(uint256 _amount) public {
        require(token.transferFrom(msg.sender,this, _amount));
        votesBalance[currentPeriod()][msg.sender] = votesBalance[currentPeriod()][msg.sender].add(_amount);
        emit VotesBought(msg.sender, _amount, currentPeriod());
    }


    /**
    * Adds a new vote for a candidate. It fails if the candidate hasn't approved before the specified amount
    * @param _candidateAddress address of the candidate selected
    * @param _amount of votes used
    **/

    function vote(address _candidateAddress, uint256 _amount) public {
        require(candidateRegistry.isWhitelisted(_candidateAddress));
        require(votesBalance[currentPeriod()][msg.sender] >= _amount);
        require(voterRegistry.isWhitelisted(msg.sender));
        votesReceived[currentPeriod()][_candidateAddress] = votesReceived[currentPeriod()][_candidateAddress].add(_amount);
        votesBalance[currentPeriod()][msg.sender] -= _amount;
        emit Vote(msg.sender,_candidateAddress, _amount, currentPeriod());
    }

    
    /**
    * Claims the correspondant Bounty from the Pool on the current periodIndex
    **/

    function claimBounty() public {
        require(candidateRegistry.isWhitelisted(msg.sender) == true);
        require(totalPeriodVotes[currentPeriod()]>0);
        uint256 totalAmount = votesReceived[currentPeriod()][msg.sender] * token.balanceOf(this)/totalPeriodVotes[currentPeriod()];
        token.transfer(msg.sender, totalAmount);
        emit BountyRelased(msg.sender, totalAmount, currentPeriod());
    }

    function currentPeriod() public view returns(uint256) { 
        address periodAddress = periodicStages.period();
        Period period = Period(periodAddress);
        return period.getPeriodNumber();
    }

    function currentStage() public view returns(uint256){
        return periodicStages.currentStage();
    }

    event ContractCreated (uint256 _time);
    event PeriodInit(uint256 _T, uint256 _active, uint256 _claim);
    event VotesBought(address indexed _recipient, uint256 _amount, uint256 _period);
    event BountyRelased(address indexed _recipient, uint256 _amount, uint256 _period);
    event StateChange(uint256 indexed _stateFrom, uint256 _stateTo, uint256 _time);
    event PeriodForward(uint256 indexed _periodFrom, uint256 _periodTo);
    event Vote(address indexed _voterAddress, address indexed _candidateAddress, uint256 _amount, uint256 _periodIndex);
}
