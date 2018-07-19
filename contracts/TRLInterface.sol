pragma solidity ^0.4.24;

/**
* A Token Ranked List (TRL) enables voting with staked tokens periodically, over a registry of candidates
*
**/
contract TRLInterface {

    event PeriodInit(uint256 _T, uint256 _active, uint256 _claim);
    event VotesBought(address indexed _recipient, uint256 _amount, uint256 _period);
    event BountyRelased(address indexed _recipient, uint256 _amount, uint256 _period);
    event Vote(address indexed _voterAddress, address indexed _candidateAddress, uint256 _amount, uint256 _periodIndex);


    mapping (uint256 => mapping(address => uint256)) public votesReceived;
    mapping (uint256 => mapping(address => uint256)) public votesBalance;
    mapping(uint256 => uint256) totalPeriodVotes;

    function vote(address _candidateAddress, uint256 _amount) public;
    function calculateReward( uint256 _poolAmount, uint256 _claimerVotes, uint256 _totalVotes) pure public returns (uint256);
    function currentPeriod() public view returns(uint256);
    function currentStage() public view returns(uint256);
    function claimBounty() public;
}





