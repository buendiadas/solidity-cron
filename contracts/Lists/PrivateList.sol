pragma solidity 0.4.18;

import "../lib/Standard20Token.sol";
import "../lib/Owned.sol";

/**
*
*
**/
contract PrivateList is Owned {

    mapping (address => uint256) public votesReceived; // Amount that only can be changed in exchange of FTR
    mapping (address => bool) public candidatesList;
    mapping (address => bool) public voterList;

    uint256 public maxNumCandidates;
    uint256 public maxNumVoters;
    uint256 public candidateCounter;

    address public bountyPoolAddress = 0x00; // By default, no Pool, tokens are removed

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
	      require(candidatesList[_candidateAddress]==false);
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
        require(voterList[msg.sender]==true);
        //require(token.transferFrom(msg.sender, bountyPoolAddress, _amount));
        votesReceived[_candidateAddress] += _amount;
        Vote(_candidateAddress, _amount);
    }

    /**
    * Sets the bounty pool address
    * @param _bountyPoolAddress address of the bounty pool
    **/

    function setBountyPool(address _bountyPoolAddress) public {
        bountyPoolAddress = _bountyPoolAddress;
    }

    event AddCandidate(address _candidateAddress, uint256 _candidateCounter);
    event AddVoter(address _candidateAddress);
    event RemoveCandidate(address _candidateAddress);
    event RemoveVoter(address _voterAddress);
    event Vote(address _candidateAddress, uint256 _amount);
}
