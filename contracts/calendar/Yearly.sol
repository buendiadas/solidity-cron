pragma solidity 0.4.24;

import "./DateTime.sol";
import "../IPeriod.sol";
import "../TracksCreation.sol";

contract Yearly is IPeriod, TracksCreation {
    using DateTime for *;
    
    function getLength() public view returns(uint256) {
        return 1;
    }

    function heightOf(uint256 _timestamp) public view returns(uint256) {
        return DateTime.diffYears(_timestamp, creationTimestamp());
    }

    function height() public view returns (uint256) {
        return heightOf(block.timestamp);
    }
}