pragma solidity 0.4.19;

import "../lib/Standard20Token.sol";
import "../lib/Owned.sol";

/**
* Simplest case of a TRL, voters and candidates are added by an Admin
*
**/
contract PrivateList is Owned {

     // Amount that only can be changed in exchange of FTR
    mapping (uint256 => mapping(address=> uint256)) public votesReceived;

    // For each period, maps user's address to voteToken balance
    mapping (uint256 => mapping(address => uint256)) public votesBalance;

    mapping (address => bool) public candidatesList; //Replace with registry address
    mapping (address => bool) public voterList; // Replace with registry address


    uint256 public maxNumCandidates; // To the registry
    uint256 public maxNumVoters; // To the registry
    uint256 public candidateCounter; // To the registry
    uint256 public periodTTL;
    address public bountyPoolAddress = 0x00;
    Standard20Token public token;

    uint256 public currentPeriod=0;

    enum PeriodState{CREATED, ACTIVE, CLAIM, CLOSED}

    struct Period {
        Standard20Token votingToken;
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
    * @param _maxNumCandidates maximum number of candidates
    **/

    function PrivateList(address _tokenAddress, uint256 _maxNumCandidates, uint256 _initialTTL) public {
        token = Standard20Token(_tokenAddress);
        maxNumCandidates = _maxNumCandidates;
        periodTTL = _initialTTL;
        initPeriod();
    }

    /**
    * Exchanges the main token for an amount of votes
    * Requires previous allowance of expenditure of at least the amount required
    * @param _amount Amount of votes that the voter wants to buy
    **/

    function buyTokenVotes(uint256 _amount) public {
      require(token.transferFrom(msg.sender,this, _amount));
      votesBalance[currentPeriod][msg.sender] += _amount;
    }

    /**
    * Initializes a new period, taking as the TTL value the current from storage, and setting the state to 1
    * Requires that the current period is Preparing (0)
    **/

    function initPeriod() public{
        require(periods[currentPeriod].state == PeriodState.CREATED);
        periods[currentPeriod].TTL= periodTTL;
        nextState();
        periods[currentPeriod].startTime = now;
    }

    /**
    * Moves the period from active to Claiming.
    *
    **/
    function initClaimingState() public {
      require(periods[currentPeriod].state == PeriodState.ACTIVE);
      require ((now - periods[currentPeriod].startTime) > (periods[currentPeriod].TTL + periods[currentPeriod].claimTTL));
      nextState();
    }

    /**
    * Enables an analyst to claim a bounty in the claim period
    *
    *
    **/

    function claimBounty() public {
        require(periods[currentPeriod].state == PeriodState.CLAIM);
        require(candidatesList[msg.sender] == true);
        uint256 totalAmount = votesReceived[currentPeriod][msg.sender] * token.balanceOf(this)/periods[currentPeriod].totalVotes;
        token.transfer(msg.sender, totalAmount);
    }

    /**
    * Closes the current period and sets the current period pointer to the next item, enabling again init.
    *
    **/

    function closePeriod() public {
        require (periods[currentPeriod].state == PeriodState.CLAIM);
        require (now - periods[currentPeriod].startTime > periods[currentPeriod].TTL);
        nextState();
        nextPeriod();
    }


    /**
    * Adds a new candidate to the List
    * @param _candidateAddress Account of the candidate to be added to the List
    **/
    function addCandidate(address _candidateAddress) public onlyOwner {
        require(candidateCounter <= maxNumCandidates);
	      require(candidatesList[_candidateAddress]==false);
        require(voterList[_candidateAddress]==false); // Candidate cannot be a voter
        candidatesList[_candidateAddress] = true;
        candidateCounter += 1;
        AddCandidate(_candidateAddress, candidateCounter);
    }

    /**
    * Removes a candidate to the List
    * @param _candidateAddress Account of the candidate to be removed to the List
    **/
    function removeCandidate (address _candidateAddress) public onlyOwner {
        candidatesList[_candidateAddress] = false;
        candidateCounter -= 1;
        RemoveCandidate(_candidateAddress);
    }

    /**
    * Adds a new candidate to the voterList
    * @param _voterAddress Account of the voter to be added to the List
    **/
    function addVoter(address _voterAddress) public onlyOwner {
        require(voterList[_voterAddress]==false);
        require(candidatesList[_voterAddress]==false); // Voter cannot be a candidate
        voterList[_voterAddress] = true;
        AddVoter(_voterAddress);
    }

    /**
    * Removes a voter from the voterList
    * @param _voterAddress Account of the candidate to be removed to the List
    **/

    function removeVoter (address _voterAddress) public onlyOwner {
        voterList[_voterAddress] = false;
        RemoveVoter(_voterAddress);
    }

    /**
    * Adds a new vote for a candidate. It fails if the candidate hasn't approved before the specified amount
    * @param _candidateAddress address of the candidate selected
    * @param _amount of votes used
    **/

    function vote(address _candidateAddress, uint256 _amount) public {
        require(candidatesList[_candidateAddress] == true);
        require (periods[currentPeriod].state == PeriodState.CLAIM);
        require(voterList[msg.sender]==true);
        require(token.transferFrom(msg.sender, bountyPoolAddress, _amount));
        votesReceived[currentPeriod][_candidateAddress] += _amount;
        Vote(_candidateAddress, _amount);
    }

    function nextState() internal {
        periods[currentPeriod].state = PeriodState(uint(periods[currentPeriod].state) + 1);
    }

    function nextPeriod() internal {
        currentPeriod +=1;
    }





    event AddCandidate(address _candidateAddress, uint256 _candidateCounter);
    event AddVoter(address _voterAddress);
    event RemoveCandidate(address _candidateAddress);
    event RemoveVoter(address _voterAddress);
    event Vote(address _candidateAddress, uint256 _amount);
}
