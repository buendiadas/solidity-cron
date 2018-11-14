pragma solidity 0.4.24;

import "./DateTime.sol";
import "../IPeriod.sol";

contract Monthly is IPeriod {
    using DateTime for *;
    
    uint256 public T;
    uint256 public unitOffset; 
    
    constructor(uint256 _T) {
        unitOffset = block.timestamp;
        T = _T;
    }

    function getLength() public view returns(uint256) {
        return T;
    }

    function height() public view returns (uint256) {
        return DateTime.diffMonths(block.timestamp, unitOffset);
    }
    
}