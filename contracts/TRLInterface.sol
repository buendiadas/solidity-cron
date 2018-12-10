pragma solidity ^0.4.24;

/**
* A Token Ranked List (TRL) enables voting with staked tokens periodically, over a registry of candidates
*
**/
contract TRLInterface {

    event VotesBought(address indexed _recipient, uint256 _amount, uint256 _periodIndex);
    event MinimumStakeSet(uint256 _amount);
    event Vote(address indexed _voterAddress, address indexed _candidateAddress, uint256 _amount, uint256 _periodIndex);
    event PeriodicStagesCreated(address _a);

    function vote(address _candidateAddress, uint256 _amount) external;
    function launchTestEvent() public;
    
}






