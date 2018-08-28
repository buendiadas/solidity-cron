pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * A simple FIFO blockstack. 
 * Enables to manage tasks inside a certain capacity 
 */

contract Stack is Ownable { 
    
    // Each Value represents the final position of a slot
    uint256[] public strg; 
    
    //Assigned value for each Slot
    mapping (uint256 => uint256) public exportValue;

    // Current pointer of the Stack
    uint256 public stackPointer;

    // Total Capacity assigned for this stack
    uint256 public totalCapacity;

    // Current height (number of assigned Slots) of this Stack
    uint256 public height; 


    constructor(uint256 _totalCapacity) public {
        totalCapacity = _totalCapacity;
    }

    /**
     * Current amount of slots that are used inside the stack
     * @return height uint representing the amount of slots already reserved in the stack
     */

    function height() public view returns (uint256) {
        return height;
    }

    /**
     * Push a new value to storage if it fits, thus moving the pointer += size
     * @param _size value that will be inserted into the stack
     */

    function push(uint256 _size) public {
        require((stackPointer + _size) <= totalCapacity, 'BLOCK_NUM_OVERFLOW');
        strg.push(stackPointer + _size);
        stackPointer += _size;
        height ++;
        assert(stackPointer <= totalCapacity);
    }

    /**
     * Pops the last value from storage
     */
    function pop() public {
        require(strg.length > 0, 'EMPTY STORAGE');
        uint256 slotSizeToEmpty = strg[strg.length-1];
        delete strg[strg.length-1];
        strg.length --;
        if (strg.length == 0) {
            height = 0;
            stackPointer = 0;
        }
        else{
            height --;
            stackPointer -= slotSizeToEmpty;
        }
    }

    /**
     * Removes every single value from the Stack
     */
    function empty() public {
        uint256 l = strg.length;
        for (uint i = 0; i < l; i++){
            pop();
        }
        assert(strg.length == 0);
    }

    /**
     * Returns true if a given position is in the range of a certain slot
     * @param slotIndex Position in the storage array
     * @param position Position that is checked to be inside the slot range
     * @return true if the position i is inside the given slot
     */

    function positionIsOnSlot(uint256 slotIndex, uint256 position) public view returns (bool) {
        if(slotIndex == 0){
            return  position <= strg[slotIndex];
        }
        else{
            return (position >= strg[slotIndex-1] && position <= strg[slotIndex]);
        }
    }

}