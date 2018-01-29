pragma solidity 0.4.18;

import "../lib/Standard20Token.sol";
import "../lib/Owned.sol";


contract PrivateList is Owned {

    mapping (address => uint8) public votesReceived; // Amount that only can be changed in exchange of FTR
    mapping (address => bool) public candidatesList;
    address[] public candidateAddressList;

    uint256 public maxNumCandidates;
    uint256 private candidateCounter;

    address public bountyPoolAddress = 0xdead; // By default, no Pool, tokens are removed

    Standard20Token public token;

    /**
    * Creates a new Instance of a Voting Lists
    * @param _tokenAddress Address of the token used for
    * @param _maxNumCandidates maximum number of candidates
    **/
    function PrivateList(address _tokenAddress, uint256 _maxNumCandidates) public {
        token = Standard20Token(_tokenAddress);
        maxNumCandidates = _maxNumCandidates;
    }

    /**
    * Adds a new candidate to the List
    * @param _candidateAddress Account of the candidate to be added to the List
    **/
    function addCandidate(address _candidateAddress) public onlyOwner {
        require(candidateCounter <= maxNumCandidates);
	require(candidatesList[candidateAddress]==false);
        candidatesList[_candidateAddress] = true;
        candidateAddressList.push(_candidateAddress);
        candidateCounter += 1;
        Add(_candidateAddress);
    }

    /**
    * Removes a candidate to the List
    * @param _candidateAddress Account of the candidate to be removed to the List
    **/
    function removeCandidate (address _candidateAddress) public onlyOwner {
        candidatesList[_candidateAddress] = false;
        candidateCounter -= 1;
        Remove(_candidateAddress);
    }

    /**
    * Adds a new vote for a candidate. It fails if the candidate hasn't approved before the specified amount
    * @param _candidateAddress address of the candidate selected
    * @param _amount of votes used
    **/
    function vote(address _candidateAddress, uint256 _amount) public returns (uint8) {
        require(candidatesList[_candidateAddress] = true);
        require(token.transferFrom(msg.sender, bountyPoolAddress, _amount));
        votesReceived[_candidateAddress] += 1;
        Vote(_candidateAddress, _amount);
    }

    /**
    * Sets the bounty pool address
    * @param _bountyPoolAddress address of the bounty pool
    **/
    function setBountyPool(address _bountyPoolAddress) public {
        bountyPoolAddress = _bountyPoolAddress;
    }

    event Add(address _candidateAddress);
    event Remove(address _candidateAddress);
    event Vote(address _candidateAddress, uint256 _amount);
}
