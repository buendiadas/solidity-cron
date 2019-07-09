pragma solidity 0.4.25;

import "./DateTime.sol";
import "../ICron.sol";
import "../Traceable.sol";

contract Monthly is ICron, Traceable {
    using DateTime for *;
    
    function length() public view returns(uint256) {
        return 1;
    }

    function height() public view returns (uint256) {
        return heightOf(block.timestamp);
    }
    
    function heightOf(uint256 _timestamp) public view returns(uint256) {
        return (DateTime.diffMonths(_timestamp, 0) - DateTime.diffMonths(creationTimestamp(), 0));
    }
}