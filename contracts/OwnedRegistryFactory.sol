pragma solidity 0.4.24;

import "./OwnedRegistry.sol";

/**
* Generic Registry, used for Candidates and Voters
*
**/

contract OwnedRegistryFactory{

    /**
    * Creates a new Owned Registry
    * @param _maxNumListings Maximum number of listings for the created registry
    *
    */
    function newRegistry(uint256 _maxNumListings) public returns (OwnedRegistry _reg){
        OwnedRegistry reg = new OwnedRegistry(_maxNumListings);
        emit OwnedRegistryCreation(msg.sender);
        return reg;
    }

    event OwnedRegistryCreation(address indexed creator);

}
