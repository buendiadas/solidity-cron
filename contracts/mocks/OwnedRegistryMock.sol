pragma solidity 0.4.19;

import "../OwnedRegistry.sol";

/**
* Generic Registry, used for Candidates and Voters
*
**/


contract OwnedRegistryMock is OwnedRegistry{

  function OwnedRegistryMock(address _whiteListedAccount, uint256 _maxNumListings)
      OwnedRegistry(_maxNumListings)
      public
  {
      whiteList(_whiteListedAccount);
  }

}
