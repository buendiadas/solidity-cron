pragma solidity 0.4.19;

import "./lib/Standard20Token.sol";
import "./lib/Owned.sol";

/**
* Generic Registry, used for Candidates and Voters
*
**/


contract OwnedRegistry is Owned{

  mapping (address => bool) public isWhitelisted;
  uint256 public maxNumListings;
  uint256 public listingCounter;

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
      isWhitelisted[_accountToWhiteList]=true;
      listingCounter +=1;
      WhiteList(_accountToWhiteList);
  }

  /**
  * Removes an account from the registry
  * @param _accountToRemove account to be removed from
  **/

  function remove(address _accountToRemove) external {
      require(msg.sender==owner);
      require(listingCounter <= maxNumListings);
      isWhitelisted[_accountToRemove]=false;
      listingCounter -=1;
      Remove(_accountToRemove);

  }


  event Remove(address _removedAccount);
  event WhiteList(address _whiteListedAccount);



}
