pragma solidity 0.4.18;

import "../lib/Standard20Token.sol";
import "../lib/Owned.sol";


contract PrivateList is Owned {

    mapping (address => uint8) public votesReceived; // Amount that only can be changed in exchange of FTR
<<<<<<< HEAD
<<<<<<< Updated upstream
    IterableMapping.Itmap public candidatesList;
=======
    mapping (address => bool) public candidatesList;
    address[] candidateAddressList;
>>>>>>> Stashed changes
=======
    mapping (address => bool) public candidatesList;
    address[] public candidateAddressList;
>>>>>>> 662553c416085e70f78a317bdb8bf18a2f60564d

    uint256 public maxNumCandidates;
    uint256 private candidateCounter;

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
<<<<<<< Updated upstream
    function vote(address _candidateAddress, uint256 _amount) public returns (uint8) {
<<<<<<< HEAD
        //require(candidatesList[_candidateAddress] = true);
        require(IterableMapping.contains(candidatesList, _candidateAddress) == true);
=======
    function vote(address _candidateAddress, uint256 _amount) public {
        require(candidatesList[_candidateAddress] = true);
>>>>>>> Stashed changes
=======
        require(candidatesList[_candidateAddress] = true);
>>>>>>> 662553c416085e70f78a317bdb8bf18a2f60564d
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
<<<<<<< HEAD
<<<<<<< Updated upstream
=======

    event Add(address _candidateAddress);
    event Remove(address _candidateAddress);
    event Vote(address _candidateAddress, uint256 _amount);
>>>>>>> Stashed changes
}


=======
>>>>>>> 662553c416085e70f78a317bdb8bf18a2f60564d

    event Add(address _candidateAddress);
    event Remove(address _candidateAddress);
    event Vote(address _candidateAddress, uint256 _amount);
}
