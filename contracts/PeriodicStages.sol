pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./Stack.sol";
import "./Period.sol";

/**
*  A periodic contract. Enables any contract to change state on a periodic basis
**/

contract PeriodicStages is Ownable {
    using SafeMath for uint256;

    // Set of stages inside a Period
    Period public period;
    Stack public stack;

    /**
    * Constructor. Sets up a new period, initializes the offset.
    * @param _T Initial number of blocks for the period
    **/

    constructor(uint256 _T) public {
        stack = new Stack(_T);
        period = new Period (_T);
    }

    function setPeriodLength(uint256 _T) public {
        require(msg.sender == owner);
        stack.empty();
        period.setPeriodLength(_T);
    }

    function pushStage(uint256 _duration) public {
        require(msg.sender == owner);
        stack.push(_duration);
    }

    /**
    * Getter for the current Stage inside a period where we are, given the current block
    * @return Current stage inside a period, using the internal Index of the given period
    */
    
    function currentStage() public view returns (uint256) {
        uint256 internalBlock = period.getRelativeIndex();
        uint256 size = stack.height();
        if(size == 0) {
            return 0;
        }
        for (uint i = 0 ; i < size; i++) {
            if (stack.positionIsOnSlot(i, internalBlock)) {
                return i;
            } 
        }
    }

}
