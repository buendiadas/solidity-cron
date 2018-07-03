pragma solidity ^0.4.24;

import "@frontier-token-research/role-registries/contracts/OwnedRegistry.sol";


/**
* Generic Registry, used for Candidates and Voters
*
**/

contract OwnedRegistryMock is OwnedRegistry{

    constructor(address[] _whiteListedAccounts)
        OwnedRegistry()
        public
    {
        for (uint i = 0; i < _whiteListedAccounts.length; i++){
            whiteList(_whiteListedAccounts[i]);
        }
    }
}