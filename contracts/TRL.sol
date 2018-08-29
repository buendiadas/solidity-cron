pragma solidity ^0.4.24;

import "./TRLInterface.sol";
import "./TRLStorage.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "@frontier-token-research/role-registries/contracts/Registry.sol";
import "@frontier-token-research/role-registries/contracts/OwnedRegistryFactory.sol";
import "@frontier-token-research/cron/contracts/Period.sol";
import "@frontier-token-research/cron/contracts/PeriodicStages.sol";


/**
* A Token Ranked List (TRL) enables voting with staked tokens periodically, over a registry of candidates, and sets the compensation of the candidates based on previous interactions 
**/

contract TRL is TRLStorage, Ownable, TRLInterface {
    using SafeMath for uint256;

    /**
    * @dev Initializes a new period, by creating a new instance of Periodic Stages contract (https://github.com/Frontier-project/cron) 
    * If not set, the TRL will not be periodic. When set, different states will be stored indexed by periods.
    * @param _T Period that is about to be set
    **/

    function initPeriod(uint256 _T) public {
        periodicStages = new PeriodicStages(_T);
        emit PeriodicStagesCreated(periodicStages);
    }

    /**
    * @dev Initializes a set of states inside a period, that will repeat periodically.
    * Requires that (_activeTime + _claimTime) < _T
    * By default, no stage will be defined, and the Smart Contract will stay on stage 0.
    * @param _activeTime  Temporal epoch when the Smart Contract is set as "Active", most of the interactions inside the period will come here
    * @param _claimTime  Temporal epoch where participants can claim their compensation based on the interactions mader on activeTime
    * TODO: Generalize to a general number of periods.
    **/

    function initStages(uint256 _activeTime, uint256 _claimTime) public {  
        periodicStages.pushStage(_activeTime);
        periodicStages.pushStage(_claimTime);
        address periodAddress = periodicStages.period();
        Period period = Period(periodAddress);
        uint256 T = period.T(); // Avoids Breaking changes on period Handlers, should be deprecated
        emit PeriodInit(T, _activeTime, _claimTime);
    }

    /**
    * @dev Exchanges the main token for an amount of votes
    * Requires previous allowance of expenditure of at least the amount required
    * Right now 1:1 exchange used
    * @param _amount Amount of votes that the voter wants to buy
    * TODO: Generalize to different ratios 
    **/

    function buyTokenVotes(uint256 _amount) public {
        require(currentStage() == 0);
        require(canStake(msg.sender, _amount));
        require(token.transferFrom(msg.sender, this, _amount));
        votesBalance[currentPeriod()][msg.sender] = votesBalance[currentPeriod()][msg.sender].add(_amount);
        emit VotesBought(msg.sender, _amount, currentPeriod());
    }

    /**
    * @dev Adds a new vote for a candidate
    * @param _candidateAddress address of the candidate selected
    * @param _amount of votes used
    **/

    function vote(address _candidateAddress, uint256 _amount) public {
        require(currentStage() == 0);
        require(canVote(msg.sender, _candidateAddress, _amount));
        require(votesBalance[currentPeriod()][msg.sender] >= _amount);
        votesReceived[currentPeriod()][_candidateAddress] = votesReceived[currentPeriod()][_candidateAddress].add(_amount);
        votesBalance[currentPeriod()][msg.sender] -= _amount;
        emit Vote(msg.sender, _candidateAddress, _amount, currentPeriod());
    }

    /**
    * @dev Claims the correspondant Bounty from the Pool on the current periodIndex. 
    **/

    function claimBounty() public {
        require(currentStage() == 1);
        require(candidateRegistry.isWhitelisted(msg.sender) == true);
        require(totalPeriodVotes[currentPeriod()] > 0);
        uint256 totalAmount = calculateReward(
            token.balanceOf(this),
            votesReceived[currentPeriod()][msg.sender],
            totalPeriodVotes[currentPeriod()]
        );
        token.transfer(msg.sender, totalAmount);
        emit BountyRelased(msg.sender, totalAmount, currentPeriod());
    }

    /*
    * @dev Sets the minimum stake to participate in a period 
    * @param _minimumStakeAmount minimum stake to be added
    **/

    function setMinimumStake(uint256 _minimumStakeAmount) public {
        require(msg.sender == owner);
        stakingConstraints[0] = _minimumStakeAmount;
    }

    /*
    * @dev Sets the minimum stake to participate in a period 
    * @param _minimumStakeAmount minimum stake to be added
    **/

    function setMaximumStake(uint256 _maximumStakeAmount) public {
        require(msg.sender == owner);
        stakingConstraints[1] = _maximumStakeAmount;
    }

    /*
    * @dev Sets a voting limit to allocate to one candidate
    * @param _minimumStakeAmount minimum stake to be added
    **/

    function setMinVotingLimit(uint256 _minVoteAmount) public {
        require(msg.sender == owner);
        votingConstraints[0] = _minVoteAmount; 
    }

    /*
    * @dev Sets a voting limit to allocate to one candidate
    * @param _minimumStakeAmount minimum stake to be added
    **/

    function setMaxVotingLimit(uint256 _maxVoteAmount) public {
        require(msg.sender == owner);
        votingConstraints[1] = _maxVoteAmount; 
    }

    /**
    * @dev Calculates the Scoring given an address in the current epoch
    * @param _epoch Epoch where the query is made
    * @param _account Account that is required to get the scoring
    **/

    function scoring(uint256 _epoch, address _account) public view returns (uint256) {
        return votesReceived[_epoch][_account];
    }

    /**
    * @dev Sets the reputation calculation Window Size
    * @param _windowSize Size of the window
    **/

    function setWindowSize(uint256 _windowSize) public returns (uint256){
        require(msg.sender == owner);
        require(_windowSize != 0);
        require(_windowSize < 100);

        reputationWindowSize = _windowSize;
        reputationWindowSizeSet = true;
        return reputationWindowSize;

    }

    /**
    * @dev Sets the Linear Weights used to Calculate the reputation
    * @param _weights uint256[]
    **/

    function setReputationLinWeights(uint256[] _weights) public returns (uint256[]){
        require(msg.sender == owner);
        require(_weights.length == reputationWindowSize);

        for(uint128 i = 0; i<reputationWindowSize;i++){
            repWeights.push(_weights[i]);
        }

        reputationWeightsSet=true;
        return repWeights;
    }

    /**
    * @dev Calculates the Reputation given an address in the current epoch
    * @param _epoch Epoch where the query is made
    * @param _account Account that is requirexd to get the reputation
    **/

    function reputation(uint256 _epoch, address _account) public view returns (uint256) {
        require(reputationWeightsSet);
        require(reputationWindowSizeSet);

        uint256 epochCounter;
        uint256[] memory votes = new uint256[](reputationWindowSize);

        require(repWeights.length == reputationWindowSize); // if window size was changed
        require(votes.length == reputationWindowSize);

        for(uint i = 0; i< 5; i++){
            if(_epoch<i){
                votes[i] = 0;
            }
             votes[i]=  votesReceived[i][_account];
        }

        return weightedScore(repWeights,votes, reputationWindowSize);
    }

    
    /**
    * @dev Calculates historical score, in a given epoch
    * @param _weights Array of weights to be used to calculate the score
    * @param _pastScores Array of past scores for the current user
    **/

    function weightedScore(uint256[] _weights, uint256[] _pastScores, uint256 _windowSize) public pure returns(uint256){
 
        require(_weights.length == _windowSize);

        uint256 score = 0;
        uint256 currWeight = 0;
        uint256 currScore = 0;
        uint256 currWeightedScore = 0;
        uint256 lastPeriodIndex = _pastScores.length;

        for(uint i =0; i< _weights.length;i++){
            
            //if((lastPeriodIndex-1-i)<0){
            if(1000000+lastPeriodIndex-1-i<1000000){
                continue;
            }
            currScore = _pastScores[lastPeriodIndex-1-i];
            //currScore = 100;
            currWeight = _weights[i];
            currWeightedScore = currScore.mul(currWeight);
            score = score.add(currWeightedScore);
        }
        return score;
    }


    /**
    * @dev Returns the current period number, by calling the period Lib
    **/

    function currentPeriod() public view returns(uint256) { 
        address periodAddress = periodicStages.period();
        Period period = Period(periodAddress);
        return period.getPeriodNumber();
    }
    
    /**
    * @dev Returns the current stage number, by calling the PeriodicStages lib
    **/

    function currentStage() public view returns(uint256) {
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
        voteInsideConstraints(_amount); 
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
        return (stakeInsideConstraints(_amount + votesBalance[currentPeriod()][_sender]));

    }

    /**
    * @dev Returns true if the given _amount is insidse the TRL constraints
    * @param _amount Account of the voter that is checked
    * @return true if the amount of votes is inside the constraints set
    **/

    function stakeInsideConstraints(
        uint256 _amount) 
        internal view returns (bool) 
    { 
        return _amount >= stakingConstraints[0] &&
        _amount <= stakingConstraints[1];
    }

    /**
    * @dev Returns true if the given _amount is insidse the TRL constraints
    * @param _amount Account of the voter that is checked
    * @return true if the amount of votes is inside the constraints set
    **/

    function voteInsideConstraints(
        uint256 _amount) 
        internal view returns (bool) 
    { 
        return _amount >= votingConstraints[0] &&
        _amount <= votingConstraints[1];
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
