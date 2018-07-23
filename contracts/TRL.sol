pragma solidity ^0.4.24;

import "./TRLInterface.sol";
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
contract TRL is TRLInterface, Ownable {
    using SafeMath for uint256;

    // Registry of candidates to be voted
    Registry public candidateRegistry;

    // Registry of candidates allowed to vote
    Registry public voterRegistry;

    // Master Token, used to buy votes
    StandardToken public token;

    // Stages that come periodically 
    PeriodicStages public periodicStages;

    // Minimum stake to participate in the period, 0 by default
    uint256 public minimumStakeAmount;

    // Sets the maximum number of votes to allocate per period
    uint256 public maximumVoteAmount = 2^256 -1;


    /**
    * Creates a new Instance of a Voting Lists
    * @param _tokenAddress Address of the token used as an incentive for the pool
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
        require(
            _candidateRegistryAddress != address(0) && 
            _voterRegistryAddress != address(0) && 
            _tokenAddress != address(0)
        ); 
        token = StandardToken(_tokenAddress);
        candidateRegistry = Registry(_candidateRegistryAddress);
        voterRegistry = Registry(_voterRegistryAddress);
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
        emit PeriodInit(_periodTTL, _activeTime, _claimTime);
    }

    /**
    * @dev Exchanges the main token for an amount of votes
    * @dev Requires previous allowance of expenditure of at least the amount required
    * @dev Currently 1:1 exchange used, but this rate could be changed
    * @param _amount Amount of votes that the voter wants to buy
    **/

    function buyTokenVotes(uint256 _amount) public {
        require(currentStage() == 0);
        require(canStake(msg.sender, _amount));
        require(token.transferFrom(msg.sender,this, _amount));
        votesBalance[currentPeriod()][msg.sender] = votesBalance[currentPeriod()][msg.sender].add(_amount);
        emit VotesBought(msg.sender, _amount, currentPeriod());
    }


    /**
    * @dev Adds a new vote for a candidate. It fails if the candidate hasn't approved before the specified amount
    * @param _candidateAddress address of the candidate selected
    * @param _amount of votes used
    **/

    function vote(address _candidateAddress, uint256 _amount) public {
        require(currentStage() == 0);
        require(canVote(msg.sender, _candidateAddress, _amount));
        require(votesBalance[currentPeriod()][msg.sender] >= _amount);
        votesReceived[currentPeriod()][_candidateAddress] = votesReceived[currentPeriod()][_candidateAddress].add(_amount);
        votesBalance[currentPeriod()][msg.sender] -= _amount;
        emit Vote(msg.sender,_candidateAddress, _amount, currentPeriod());
    }
    /*
    * @dev Sets the minimum stake to participate in a period 
    * @param _minimumStakeAmount minimum stake to be added
    **/

    function setMinimumStake(uint256 _minimumStakeAmount) public {
        require(msg.sender == owner);
        minimumStakeAmount = _minimumStakeAmount;
    }

    /*
    * @dev Sets a voting limit to allocate to one candidate
    * @param _minimumStakeAmount minimum stake to be added
    **/

    function setVotingLimit(uint256 _maximumVoteAmount) public {
        require(msg.sender == owner);
        maximumVoteAmount = _maximumVoteAmount;
    }

    
    /**
    * @dev Claims the correspondant Bounty from the Pool on the current periodIndex
    **/

    function claimBounty() public {
        require(currentStage() == 1);
        require(candidateRegistry.isWhitelisted(msg.sender) == true);
        require(totalPeriodVotes[currentPeriod()]>0);
        uint256 totalAmount = calculateReward(
            token.balanceOf(this),
            votesReceived[currentPeriod()][msg.sender],
            totalPeriodVotes[currentPeriod()]
        );
        token.transfer(msg.sender, totalAmount);
        emit BountyRelased(msg.sender, totalAmount, currentPeriod());
    }

    /**
    * @dev Returns the current period number
    **/

    function currentPeriod() public view returns(uint256) { 
        address periodAddress = periodicStages.period();
        Period period = Period(periodAddress);
        return period.getPeriodNumber();
    }
    
    /**
    * @dev Returns the current stage number
    **/

    function currentStage() public view returns(uint256){
        return periodicStages.currentStage();
    } 
    
    
    /**
    * @dev Returns true if the given _sender can vote for a given _receiver
    * @param _sender Account of the voter that is checked
    * @param _receiver Account of the candidate to be voted
    * @return true if the user can vote and the receiver is a candidate
    **/

    function canVote(
        address _sender, 
        address _receiver,
        uint256 _amount) 
        internal view returns (bool) 
    { 
        return voterRegistry.isWhitelisted(_sender) &&
        candidateRegistry.isWhitelisted(_receiver) && 
        _amount <= maximumVoteAmount;
    }

    /**
    * @dev Returns true if the given _sender stake an amount of tokens
    * @param _sender Account of the voter that is checked
    * @param _amount Amount that is attempted to stake
    * @return true if the user can vote and the receiver is a candidate
    **/

    function canStake(
        address _sender, 
        uint256 _amount) 
        internal view returns (bool) 
    {
        return (_amount + votesBalance[currentPeriod()][_sender]) >= minimumStakeAmount;

    }

    /**
    * @dev Function that determines the current reward for each sender
    * @param _poolAmount Total amount that is going to be shared among participants
    * @param _claimerVotes Amount of votes of the candidate that is going to claim for the reward
    * @param _totalVotes Total Amount of votes on a certain period
    */

    function calculateReward(
        uint256 _poolAmount,
        uint256 _claimerVotes,
        uint256 _totalVotes)
        pure public returns (uint256)
    {
        require(_totalVotes != 0);
        uint256 auxDecimalVotes = _claimerVotes * 100;
        uint256 auxPercentageVotes = auxDecimalVotes / _totalVotes;
        uint256 totalAmount = _poolAmount * auxPercentageVotes / 100;
        return totalAmount;
    }
}
