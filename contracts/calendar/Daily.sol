pragma solidity 0.4.24;

import "./DateTime.sol";
import "../IPeriod.sol";
import "../TracksCreation.sol";

contract Daily is IPeriod, TracksCreation {
    using DateTime for *;
    
    function getLength() public view returns(uint256) {
        return 1;
    }

    function heightOf(uint256 _timestamp) public view returns (uint256) {
        return DateTime.diffDays(_timestamp, 0) - DateTime.diffDays(creationTimestamp(), 0);
    }

    function height() public view returns (uint256) {
        return heightOf(block.timestamp);
    }
}