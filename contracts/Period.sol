pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";



/**
*  A periodic contract. Enables any contract to change state on a periodic basis
*  Before going into detail, it might be helpful to familiarize with the naming convention:
*  T === period --> Number of blocks to complete a cycle
*  Epoch: Counter of the number of cycles that went by since a given block (blockOffset)
*  height == current epoch
*  blockOffset --> Block where the first epoch start to count
*  Epoch offset --> Starting value of height()
**/


contract Period is Ownable { 

    // Period Number set
    uint256 public T;
    // Initial Block where the period is started
    uint256 public blockOffset;
    // Initial epoch offset
    uint256 public epochOffset;

    /*
    * Constructor
    * Creates a new Period object 
    * @param _T Number of blocks of a Period
    * @param _epochOffset Initial offset where the height starts, useful for Period modification
    */
    
    constructor(uint256 _T) public {
        require(_T > 0, 'EMPTY_PERIOD');
        T = _T;
        blockOffset = block.number;
    }

    /**
    * Modifies the period length. It was created with those use cases where a Smart Contract needs to modify the period length, keeping the same epoch numeration (height)
    * To do that, it is modified the epoch offset, in order to allow future calculation of blocks
    * Also, it is calculated the new block offset, from the point where period will be applied. 
    */

    function setPeriodLength(uint256 _T) public {
        require(msg.sender == owner);
        epochOffset = height();
        blockOffset = block.number + T - getRelativeIndex();
        T = _T;
    }

    /**
    * Getter for the current period number
    * @return current period number
    */
    function height() public view returns (uint256) {
        if (blockOffset > block.number) { // Period has been scheduled or modified. 
            return epochOffset;
        }
        else { // Normal behaviour
            return (block.number - blockOffset) / T + epochOffset;
        }
    }

    /**
    * @return initial block, vector that defines the beginning of this period
    */
    function getOffset() public view returns (uint256){
        return blockOffset + height() * T;
    }
    /*
    * @return Index inside the current period. 
    */
    function getRelativeIndex() public view returns (uint256){ 
        return block.number- getOffset();
    }

}
