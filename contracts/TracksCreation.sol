pragma solidity 0.4.24;

/**
 * Every Standard period is able to return a height based on the creation block of the smart contract, given a time unit used to make calculations.
 */

contract TracksCreation {

    uint256 private _creationTimestamp;
    uint256 private _creationBlock;
    uint256 private _offset;

    constructor() public {
        _creationTimestamp = block.timestamp;
        _creationBlock = block.number;  
    }

    function creationTimestamp() public view returns (uint256) { 
        return _creationTimestamp;
    }

    function creationBlock() public view returns (uint256) {
        return _creationBlock;
     }
    
}