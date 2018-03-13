pragma solidity 0.4.19;

import "./lib/Standard20Token.sol";
import "./OwnedRegistry.sol";

/**
* A Token Ranked List (TRL) enables voting with staked tokens periodically, over a registry of candidates
*
**/
contract TokenRankedList {

     // Amount that only can be changed in exchange of FTR
    mapping (uint256 => mapping(address=> uint256)) public votesReceived;

    // For each period, maps user's address to voteToken balance
    mapping (uint256 => mapping(address => uint256)) public votesBalance;

    // Registry of candidates to be voted
    OwnedRegistry public candidateRegistry;

    // Registry of candidates allowed to vote
    OwnedRegistry public voterRegistry;

    // Master Token, used to buy votes
    Standard20Token public token;


    uint256 public periodIndex=0;

    enum PeriodState{CREATED, ACTIVE, CLAIM, CLOSED}

    struct Period {
        uint256 startTime;
        uint256 totalVotes;
        PeriodState state;
        uint256 TTL;
        uint256 claimTTL;
    }

    mapping (uint256 => Period) public periods;


    /**
    * Creates a new Instance of a Voting Lists
    * @param _tokenAddress Address of the token used for
    *
    **/

    function TokenRankedList(
        address _tokenAddress,
        address _candidateRegistryAddress,
        address _voterRegistryAddress,
        uint256 _initialTTL)
        public {

        token = Standard20Token(_tokenAddress);
        candidateRegistry= OwnedRegistry(_candidateRegistryAddress);
        voterRegistry = OwnedRegistry(_voterRegistryAddress);
        initPeriod(_initialTTL);
    }

    /**
    * Initializes a new period, taking as the TTL value the current from storage, and setting the state to 1
    * Requires that the current period is Preparing (0)
    **/

    function initPeriod(uint256 _periodTTL) public {
        require(periods[periodIndex].state == PeriodState.CREATED);
        periods[periodIndex].TTL= _periodTTL;
        periods[periodIndex + 1].startTime = now;
        nextState();
    }

    /**
    * Moves the period from active to Claiming.
    *
    **/
    function initClaimingState() public {
      require(periods[periodIndex].state == PeriodState.ACTIVE);
      require ((now - periods[periodIndex].startTime) > (periods[periodIndex].TTL + periods[periodIndex].claimTTL));
      nextState();
    }

    /**
    * Enables an analyst to claim a bounty in the claim period
    *
    *
    **/

    function claimBounty() public {
        require(periods[periodIndex].state == PeriodState.CLAIM);
        require(candidateRegistry.isWhitelisted(msg.sender) == true);
        uint256 totalAmount = votesReceived[periodIndex][msg.sender] * token.balanceOf(this)/periods[periodIndex].totalVotes;
        token.transfer(msg.sender, totalAmount);
        BountyRelased(msg.sender, totalAmount);
    }

    /**
    * Closes the current period and sets the current period pointer to the next item, enabling again init.
    *
    **/

    function closePeriod() public {
        require (periods[periodIndex].state == PeriodState.CLAIM);
        require (now - periods[periodIndex].startTime > periods[periodIndex].TTL);
        nextState();
        nextPeriod();
    }

    /**
    * Exchanges the main token for an amount of votes
    * Requires previous allowance of expenditure of at least the amount required
    * @param _amount Amount of votes that the voter wants to buy
    **/

    function buyTokenVotes(uint256 _amount) public {
      require(token.transferFrom(msg.sender,this, _amount));
      votesBalance[periodIndex][msg.sender] += _amount;
    }


    /**
    * Adds a new vote for a candidate. It fails if the candidate hasn't approved before the specified amount
    * @param _candidateAddress address of the candidate selected
    * @param _amount of votes used
    **/

    function vote(address _candidateAddress, uint256 _amount) public {
        require (periods[periodIndex].state == PeriodState.CLAIM);
        require (candidateRegistry.isWhitelisted(_candidateAddress));
        require (voterRegistry.isWhitelisted(msg.sender));
        require(token.transferFrom(msg.sender,this, _amount));
        votesReceived[periodIndex][_candidateAddress] += _amount;
        Vote(_candidateAddress, _amount);
    }


    /**
    * Moves from the current state to the Next State {CREATED, ACTIVE, CLAIM, CLOSED}
    *
    **/

    function nextState() internal {
        periods[periodIndex].state = PeriodState(uint(periods[periodIndex].state) + 1);
        StateChange(uint(periods[periodIndex].state)-1 , uint(periods[periodIndex].state));
    }

    /**
    * Moves from the current period to the next period
    **/

    function nextPeriod() internal {
        periodIndex +=1;
        PeriodForward(periodIndex-1, periodIndex);
    }

    event BountyRelased(address _recipient, uint256 _amount);
    event StateChange(uint256 _stateFrom, uint256 _stateTo);
    event PeriodForward(uint256 _periodFrom, uint256 _periodTo);
    event Vote(address _candidateAddress, uint256 _amount);
}
