pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Stack.sol";
import "./Period.sol";

/**
*  A periodic contract. Enables any contract to change state on a periodic basis
**/

contract PeriodicStages {
    using SafeMath for uint256;

    // Set of stages inside a Period
    Period public period;
    Stack public stageStack;

    /**
    * Constructor. Sets up a new period, initializes the offset.
    * @param _T Initial number of blocks for the period
    **/

    constructor(uint256 _T) public {
        stageStack = new Stack(_T);
        period = new Period (_T);
    }

    function pushStage(uint256 _duration) public {
        stageStack.push(_duration);
    }

    /**
    * Getter for the current Stage inside a period where we are, given the current block
    * @return Current stage inside a period, using the internal Index of the given period
    */
    
    function currentStage() public view returns (uint256) {
        uint256 internalBlock = period.getRelativeIndex();
        uint256 size = stageStack.height();
        if(size == 0) {
            return 0;
        }
        for (uint i = 0 ; i < size; i++) {
            if (stageStack.positionIsOnSlot(i, internalBlock)) {
                return i;
            } 
        }
    }

}
