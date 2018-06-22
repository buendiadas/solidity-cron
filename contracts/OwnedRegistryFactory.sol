pragma solidity ^0.4.24;

import "./OwnedRegistry.sol";

/**
* Generic Registry, used for Candidates and Voters
*
**/

contract OwnedRegistryFactory{

    mapping (bytes32 => address) public registries;

    /**
    * Creates a new Owned Registry
    * @param _maxNumListings Maximum number of listings for the created registry
    */

    function newRegistry(uint256 _maxNumListings, bytes32 _label) public returns (OwnedRegistry _reg){
        require(registries[_label] == 0x00);
        OwnedRegistry reg = new OwnedRegistry(_maxNumListings);
        emit OwnedRegistryCreation(msg.sender);
        reg.transferOwnership(msg.sender);
        registries[_label] = address(reg);
        return reg;
    }

    function getRegistry(bytes32 _label) public view returns (address){
        return registries[_label];
    }

    event OwnedRegistryCreation(address indexed creator);

}
