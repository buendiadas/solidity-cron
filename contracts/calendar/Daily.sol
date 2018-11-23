pragma solidity 0.4.24;

import "./DateTime.sol";
import "../IPeriod.sol";
import "../TracksCreation.sol";

/**
 * A particular case of a periodic contract where the height increased by one every period
 */

contract Daily is IPeriod, TracksCreation {
    using DateTime for *;

    /**
     * @return 1 as this contract is set  to be changing every single day. 
     */
    function getLength() public view returns(uint256) {
        return 1;
    }

    /**
     * @param _timestamp unix epoch seconds 
     * @return Number of days that happened since this contract was deployed to the  target timestamp
     */

    function heightOf(uint256 _timestamp) public view returns (uint256) {
        return DateTime.diffDays(_timestamp, 0) - DateTime.diffDays(creationTimestamp(), 0);
    }
    
    /**
     * @return A particular case of heightOf, using the current timestamp
     */

    function height() public view returns (uint256) {
        return heightOf(block.timestamp);
    }
}