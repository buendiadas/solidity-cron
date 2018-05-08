pragma solidity 0.4.21;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


/**
* Generic Registry, used for Candidates and Voters
*
**/

contract OwnedRegistry is Ownable{
    using SafeMath for uint256;

    mapping (address => bool) public isWhitelisted;
    uint256 public maxNumListings;
    uint256 public listingCounter;

    /**
    * Constructor
    * @param _maxNumListings size of the Registry
    **/

    function OwnedRegistry(uint256 _maxNumListings) public {
        maxNumListings = _maxNumListings;
    }

    /**
    * Adds a new account to the registry
    * @param _accountToWhiteList account to be added to the registry
    **/

    function whiteList(address _accountToWhiteList) public{
        require(msg.sender==owner);
        require(listingCounter <= maxNumListings);
        require(!isWhitelisted[_accountToWhiteList]);
        isWhitelisted[_accountToWhiteList] = true;
        listingCounter = listingCounter.add(1);
        emit WhiteList(_accountToWhiteList);
    }

    /**
    * Removes an account from the registry
    * @param _accountToRemove account to be removed from
    **/

    function remove(address _accountToRemove) external {
        require(msg.sender==owner);
        require(listingCounter <= maxNumListings);
        isWhitelisted[_accountToRemove] = false;
        listingCounter = listingCounter.sub(1);
        emit Remove(_accountToRemove);
    }

    event Remove(address _removedAccount);
    event WhiteList(address _whiteListedAccount);

}
