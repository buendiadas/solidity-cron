pragma solidity 0.4.21;

import "../OwnedRegistry.sol";

/**
* Generic Registry, used for Candidates and Voters
*
**/

contract OwnedRegistryMock is OwnedRegistry{

    function OwnedRegistryMock(address[] _whiteListedAccounts, uint256 _maxNumListings)
        OwnedRegistry(_maxNumListings)
        public
    {
        for (uint i = 0; i < _whiteListedAccounts.length; i++){
            whiteList(_whiteListedAccounts[i]);
        }
    }
}
