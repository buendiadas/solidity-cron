pragma solidity ^0.4.24;

import "./TRLStorage.sol";
import "./TRLInterface.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "@frontier-token-research/role-registries/contracts/Registry.sol";
import "@frontier-token-research/role-registries/contracts/OwnedRegistryFactory.sol";
import "./cron/contracts/IPeriod.sol";


/**
* Main controler for the Token Ranked List Model.
**/

contract TRL is Ownable, TRLStorage, TRLInterface {
    using SafeMath for uint256;

    /**
    * @dev Exchanges the main token for an amount of votes
    * @param _amount Amount of votes that the voter wants to buy
    * NOTE: Requires previous allowance of expenditure of at least the amount required, right now 1:1 exchange used
    **/

    function buyTokenVotes(uint256 _amount) external {
        _votePayment(msg.sender, _amount);
    }

    /**
    * @dev Exchanges the main token for an amount of votes
    * @param _amount Amount of votes that the voter wants to buy
    * NOTE: Requires previous allowance of expenditure of at least the amount required, right now 1:1 exchange used
    **/

    function executeSubscription(address _account, uint256 _amount) external returns (bool success) {
        require(msg.sender == subscriptionAddress);
        _votePayment(_account, _amount);
        return true;
    }

    /**
    * @dev Adds a new vote for a candidate
    * @param _candidateAddress address of the candidate selected
    * @param _amount of votes used
    **/

    function vote(address _candidateAddress, uint256 _amount) external {
        require(address(voteToken) != 0x00);
        require(canVote(msg.sender, _candidateAddress, _amount));
        voteToken.transferFrom(msg.sender, _candidateAddress, _amount);
        emit Vote(msg.sender, _candidateAddress, _amount, height());
    }

    /*
    * @dev Sets the minimum stake to participate in a period 
    * @param _minimumStakeAmount minimum stake to be added
    **/

    function setMinimumStake(uint256 _minimumStakeAmount) public {
        require(msg.sender == owner());
        stakingConstraints[0] = _minimumStakeAmount;
    }

    /*
    * @dev Sets the minimum stake to participate in a period 
    * @param _minimumStakeAmount minimum stake to be added
    **/

    function setMaximumStake(uint256 _maximumStakeAmount) public {
        require(msg.sender == owner());
        stakingConstraints[1] = _maximumStakeAmount;
    }

    /*
    * @dev Sets a voting limit to allocate to one candidate
    * @param _minimumStakeAmount minimum stake to be added
    **/

    function setMinVotingLimit(uint256 _minVoteAmount) public {
        require(msg.sender == owner());
        votingConstraints[0] = _minVoteAmount; 
    }

    /*
    * @dev Sets a voting limit to allocate to one candidate
    * @param _minimumStakeAmount minimum stake to be added
    **/

    function setMaxVotingLimit(uint256 _maxVoteAmount) public {
        require(msg.sender == owner());
        votingConstraints[1] = _maxVoteAmount; 
    }

    /**
    * @dev Sets the reputation calculation Window Size
    * @param _windowSize Size of the window
    **/

    function setWindowSize(uint256 _windowSize) public returns (uint256) {
        require(msg.sender == owner());
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

    function setReputationLinWeights(uint256[] _weights) public returns (uint256[]) { 
        require(msg.sender == owner());
        require(_weights.length == reputationWindowSize);

        for(uint128 i = 0; i < reputationWindowSize; i++){
            repWeights.push(_weights[i]);
        }

        reputationWeightsSet = true;
        return repWeights;
    }

    /**
    * @dev Calculates the Scoring given an address in the current epoch
    * @param _epoch Epoch where the query is made
    * @param _account Account that is required to get the scoring
    **/

    function scoring(uint256 _epoch, address _account) public view returns (uint256) {
        return voteToken.balanceAt(_epoch,_account);
    }

    /**
    * @dev Calculates the Reputation given an address in the current epoch
    * @param _epoch Epoch where the query is made
    * @param _account Account that is requirexd to get the reputation
    **/

    function reputation(uint256 _epoch, address _account) public view returns (uint256) {
        require(reputationWeightsSet);
        require(reputationWindowSizeSet);
        uint256[] memory votes = new uint256[](reputationWindowSize);

        require(repWeights.length == reputationWindowSize); // if window size was changed
        require(votes.length == reputationWindowSize);

        for(uint i = 0; i < reputationWindowSize; i++) {
            if(_epoch<i){
                votes[i] = 0;
            }
             votes[i]=  voteToken.balanceAt(i,_account);
        }

        return weightedScore(repWeights,votes, reputationWindowSize);
    }

     /**
    * @dev Returns the current period number, by calling the period Lib
    * NOTICE: In deprecation process
    **/

    function currentPeriod() public view returns(uint256) { 
        return height();
    }

    /**
    * @dev Returns the current period number, by calling the period Lib
    **/

    function height() public view returns(uint256) { 
        return period.height();
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
        public view returns (bool) 
    {
        return (stakeInsideConstraints(_amount));

    }

    /**
    * @dev Returns true if the given _amount is insidse the TRL constraints
    * @param _amount Account of the voter that is checked
    * @return true if the amount of votes is inside the constraints set
    **/

    function stakeInsideConstraints(
        uint256 _amount) 
        public view returns (bool) 
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
    * @dev Calculates historical score, in a given epoch
    * @param _weights Array of weights to be used to calculate the score
    * @param _pastScores Array of past scores for the current user
    **/

    function weightedScore(uint256[] _weights, uint256[] _pastScores, uint256 _windowSize) public pure returns(uint256) {
        require(_weights.length == _windowSize);

        uint256 score = 0;
        uint256 currWeight = 0;
        uint256 currScore = 0;
        uint256 currWeightedScore = 0;
        uint256 lastEpoch = _pastScores.length;

        for(uint i = 0; i < _weights.length; i++) {
            
            if(1000000 + lastEpoch - 1 -i < 1000000){
                continue;
            }
            currScore = _pastScores[lastEpoch - 1 - i];
            currWeight = _weights[i];
            currWeightedScore = currScore.mul(currWeight);
            score = score.add(currWeightedScore);
        }
        return score;
    }

    /**
    * @dev Deposits an specified amount to a secure deposit
    * @param _voterAddress Account that will receive votes in exchange of a payment
    * @param _amount Total amount received in the subscription
    */

    function _votePayment(address _voterAddress, uint256 _amount) internal returns (bool success) {
        require(canStake(_voterAddress, _amount));
        require(_deposit(height(), _amount));
        require(address(voteToken) != 0x00);
        voteToken.mint(_voterAddress, _amount);
        emit VotesBought(_voterAddress, _amount, height());
        return true;
    }
    /**
    * @dev Deposits an specified amount to a secure deposit
    * @param _vaultID Number of the vault where the tokens should go
    * @param _amount amount of tokens to be deposited in a vault
    */

    function _deposit(uint256 _vaultID, uint256 _amount) internal returns (bool success) {
        require(token.transferFrom(msg.sender, this, _amount));
        token.approve(address(vault), _amount);
        vault.deposit(_vaultID, address(token), this, _amount);
        return true;
    }

    /**
    * @dev Function that issues a test event. This is used to test the
    *      trl-listener infrastructure
    */

    function launchTestEvent() public{
        emit Vote(address(0), address(0),block.timestamp, 0);
    }
}
