pragma solidity 0.4.25;

import "./DateTime.sol";
import "../ICron.sol";
import "../Traceable.sol";

contract Yearly is ICron, Traceable {
    using DateTime for *;

    function getLength() public view returns(uint256) {
        return 1;
    }

    function heightOf(uint256 _timestamp) public view returns(uint256) {
        return DateTime.diffYears(_timestamp, 0);
    }

    function height() public view returns (uint256) {
        return heightOf(block.timestamp);
    }
}