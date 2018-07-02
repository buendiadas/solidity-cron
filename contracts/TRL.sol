pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "@frontier-token-research/role-registries/contracts/Registry.sol";
import "@frontier-token-research/role-registries/contracts/OwnedRegistryFactory.sol";
import "@frontier-token-research/cron/contracts/Period.sol";


/**
* A Token Ranked List (TRL) enables voting with staked tokens periodically, over a registry of candidates
*
**/
contract TRL {
    using SafeMath for uint256;

     // Amount that only can be changed in exchange of FTR
    mapping (uint256 => mapping(address => uint256)) public votesReceived;

    // For each period, maps user's address to voteToken balance
    mapping (uint256 => mapping(address => uint256)) public votesBalance;

    // Registry of candidates to be voted
    Registry public candidateRegistry;

    // Registry of candidates allowed to vote
    Registry public voterRegistry;

    // Master Token, used to buy votes
    StandardToken public token;

    // Period contract
    Period public period; 


    enum PeriodState {CREATED, ACTIVE, CLAIM, CLOSED}

    struct PeriodConfig {
        uint256 startTime;
        uint256 totalVotes;
        PeriodState state;
        uint256 TTL;
        uint256 activeTime;
        uint256 claimTime;
    }

    mapping (uint256 => PeriodConfig) public periodRegistry;

    /**
    * Creates a new Instance of a Voting Lists
    * @param _tokenAddress Address of the token used for
    *
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
        periodRegistry[0] = PeriodConfig(block.number, 0, PeriodState.CREATED, _initialTTL, _initialActiveTime, _initialClaimTime);
        initPeriod(_initialTTL);
    }

    /**
    * Initializes a new period, taking as the TTL value the current from storage, and setting the state to 1
    * Requires that the current period is Preparing (0)
    **/

    function initPeriod(uint256 _periodTTL) public {
        require(periodRegistry[0].state == PeriodState.CREATED);
        periodRegistry[0].TTL = _periodTTL;
        period = new Period(_periodTTL);
        periodRegistry[currentPeriod()].startTime = now;
        nextState();
    }

    /**
    * Exchanges the main token for an amount of votes
    * Requires previous allowance of expenditure of at least the amount required
    * Currently 1:1 exchange used, but this rate could be changed
    * @param _amount Amount of votes that the voter wants to buy
    **/

    function buyTokenVotes(uint256 _amount) public {
        require(periodRegistry[currentPeriod()].state == PeriodState.ACTIVE);
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
        uint256 currentPeriod = period.getPeriodNumber();
        require(periodRegistry[currentPeriod].state == PeriodState.ACTIVE);
        require(candidateRegistry.isWhitelisted(_candidateAddress));
        require(votesBalance[currentPeriod][msg.sender] >= _amount);
        require(voterRegistry.isWhitelisted(msg.sender));
        votesReceived[currentPeriod][_candidateAddress] = votesReceived[currentPeriod][_candidateAddress].add(_amount);
        votesBalance[currentPeriod][msg.sender] -= _amount;
        periodRegistry[currentPeriod].totalVotes = periodRegistry[currentPeriod].totalVotes.add(_amount);
        emit Vote(msg.sender,_candidateAddress, _amount, currentPeriod);
    }

    /**
    * Moves the period from active to Claiming.
    *
    **/

    function initClaimingState() public {
        require(periodRegistry[currentPeriod()].state == PeriodState.ACTIVE);
        require ((now - periodRegistry[currentPeriod()].startTime) >= periodRegistry[currentPeriod()].activeTime);
        nextState();
    }

    /**
    * Enables an analyst to claim a bounty in the claim period
    *
    *
    **/

    function claimBounty() public {
        require(periodRegistry[currentPeriod()].state == PeriodState.CLAIM);
        require(candidateRegistry.isWhitelisted(msg.sender) == true);
        require(periodRegistry[currentPeriod()].totalVotes>0);
        uint256 totalAmount = votesReceived[currentPeriod()][msg.sender] * token.balanceOf(this)/periodRegistry[currentPeriod()].totalVotes;
        token.transfer(msg.sender, totalAmount);
        emit BountyRelased(msg.sender, totalAmount, currentPeriod());
    }

    function currentPeriod() returns(uint256) { 
        return period.getPeriodNumber();
    }

    /**
    * Moves from the current state to the Next State {CREATED, ACTIVE, CLAIM, CLOSED}
    *
    **/

    function nextState() internal {
        periodRegistry[currentPeriod()].state = PeriodState(uint(periodRegistry[currentPeriod()].state).add(1));
        emit StateChange(uint(periodRegistry[currentPeriod()].state)-1 , uint(periodRegistry[currentPeriod()].state), now);
    }   

    event ContractCreated (uint256 _time);
    event VotesBought(address indexed _recipient, uint256 _amount, uint256 _period);
    event BountyRelased(address indexed _recipient, uint256 _amount, uint256 _period);
    event StateChange(uint256 indexed _stateFrom, uint256 _stateTo, uint256 _time);
    event PeriodForward(uint256 indexed _periodFrom, uint256 _periodTo);
    event Vote(address indexed _voterAddress, address indexed _candidateAddress, uint256 _amount, uint256 _periodIndex);
}
