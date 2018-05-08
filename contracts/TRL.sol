pragma solidity 0.4.21;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "./OwnedRegistry.sol";

/**
* A Token Ranked List (TRL) enables voting with staked tokens periodically, over a registry of candidates
*
**/
contract TRL {
    using SafeMath for uint256;

     // Amount that only can be changed in exchange of FTR
    mapping (uint256 => mapping(address=> uint256)) public votesReceived;

    // For each period, maps user's address to voteToken balance
    mapping (uint256 => mapping(address => uint256)) public votesBalance;

    // Registry of candidates to be voted
    OwnedRegistry public candidateRegistry;

    // Registry of candidates allowed to vote
    OwnedRegistry public voterRegistry;

    // Master Token, used to buy votes
    StandardToken public token;

    // Index, Defines the current period
    uint256 public periodIndex;

    enum PeriodState {CREATED, ACTIVE, CLAIM, CLOSED}

    struct Period {
        uint256 startTime;
        uint256 totalVotes;
        PeriodState state;
        uint256 TTL;
        uint256 activeTime;
        uint256 claimTime;
    }

    mapping (uint256 => Period) public periodRegistry;

    /**
    * Creates a new Instance of a Voting Lists
    * @param _tokenAddress Address of the token used for
    *
    **/

    function TRL(
        address _tokenAddress,
        address _candidateRegistryAddress,
        address _voterRegistryAddress,
        uint256 _initialTTL,
        uint256 _initialActiveTime,
        uint256 _initialClaimTime)
        public
    {
        token = StandardToken(_tokenAddress);
        candidateRegistry = OwnedRegistry(_candidateRegistryAddress);
        voterRegistry = OwnedRegistry(_voterRegistryAddress);
        periodRegistry[periodIndex] = Period(block.timestamp, 0,PeriodState.CREATED, _initialTTL, _initialActiveTime, _initialClaimTime);
        initPeriod(_initialTTL);
    }

    /**
    * Initializes a new period, taking as the TTL value the current from storage, and setting the state to 1
    * Requires that the current period is Preparing (0)
    **/

    function initPeriod(uint256 _periodTTL) public {
        require(periodRegistry[periodIndex].state == PeriodState.CREATED);
        periodRegistry[periodIndex].TTL = _periodTTL;
        periodRegistry[periodIndex].startTime = now;
        nextState();
    }

    /**
    * Exchanges the main token for an amount of votes
    * Requires previous allowance of expenditure of at least the amount required
    * Currently 1:1 exchange used, but this rate could be changed
    * @param _amount Amount of votes that the voter wants to buy
    **/

    function buyTokenVotes(uint256 _amount) public {
        require(periodRegistry[periodIndex].state == PeriodState.ACTIVE);
        require(token.transferFrom(msg.sender,this, _amount));
        votesBalance[periodIndex][msg.sender] = votesBalance[periodIndex][msg.sender].add(_amount);
        emit VotesBought(msg.sender, _amount, periodIndex);
    }

    /**
    * Adds a new vote for a candidate. It fails if the candidate hasn't approved before the specified amount
    * @param _candidateAddress address of the candidate selected
    * @param _amount of votes used
    **/

    function vote(address _candidateAddress, uint256 _amount) public {
        require(periodRegistry[periodIndex].state == PeriodState.ACTIVE);
        require(candidateRegistry.isWhitelisted(_candidateAddress));
        require(votesBalance[periodIndex][msg.sender] >= _amount);
        require(voterRegistry.isWhitelisted(msg.sender));
        votesReceived[periodIndex][_candidateAddress] = votesReceived[periodIndex][_candidateAddress].add(_amount);
        votesBalance[periodIndex][msg.sender] -= _amount;
        periodRegistry[periodIndex].totalVotes = periodRegistry[periodIndex].totalVotes.add(_amount);
        emit Vote(msg.sender,_candidateAddress, _amount, periodIndex);
    }

    /**
    * Moves the period from active to Claiming.
    *
    **/

    function initClaimingState() public {
        require(periodRegistry[periodIndex].state == PeriodState.ACTIVE);
        require ((now - periodRegistry[periodIndex].startTime) >= periodRegistry[periodIndex].activeTime);
        nextState();
    }

    /**
    * Enables an analyst to claim a bounty in the claim period
    *
    *
    **/

    function claimBounty() public {
        require(periodRegistry[periodIndex].state == PeriodState.CLAIM);
        require(candidateRegistry.isWhitelisted(msg.sender) == true);
        require(periodRegistry[periodIndex].totalVotes>0);
        uint256 totalAmount = votesReceived[periodIndex][msg.sender] * token.balanceOf(this)/periodRegistry[periodIndex].totalVotes;
        token.transfer(msg.sender, totalAmount);
        emit BountyRelased(msg.sender, totalAmount, periodIndex);
    }

    /**
    * Closes the current period and sets the current period pointer to the next item, enabling again init.
    *
    **/

    function closePeriod() public {
        require (periodRegistry[periodIndex].state == PeriodState.CLAIM);
        require (now - periodRegistry[periodIndex].startTime > periodRegistry[periodIndex].TTL);
        nextState();
        nextPeriod();
    }


    /**
    * Moves from the current state to the Next State {CREATED, ACTIVE, CLAIM, CLOSED}
    *
    **/

    function nextState() internal {
        periodRegistry[periodIndex].state = PeriodState(uint(periodRegistry[periodIndex].state).add(1));
        emit StateChange(uint(periodRegistry[periodIndex].state)-1 , uint(periodRegistry[periodIndex].state), now);
    }

    /**
    * Moves from the current period to the next period
    **/

    function nextPeriod() internal {
        periodIndex = periodIndex.add(1);
        emit PeriodForward(periodIndex-1, periodIndex);
    }

    event ContractCreated (uint256 _time);
    event VotesBought(address indexed _recipient, uint256 _amount, uint256 _period);
    event BountyRelased(address indexed _recipient, uint256 _amount, uint256 _period);
    event StateChange(uint256 indexed _stateFrom, uint256 _stateTo, uint256 _time);
    event PeriodForward(uint256 indexed _periodFrom, uint256 _periodTo);
    event Vote(address indexed _voterAddress, address indexed _candidateAddress, uint256 _amount, uint256 _periodIndex);
}
