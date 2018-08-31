pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";



/**
*  A periodic contract. Enables any contract to change state on a periodic basis
*  Before going into detail, it might be helpful to familiarize with the naming convention:
*  T === Period Length --> Number of blocks to complete a cycle
*  Epoch: Counter of the number of cycles that went by since a given block (blockOffset)
*  Height == current epoch
*  Age: Tame where period Length has remained the same
*  BlockOffset --> First block inside an age 
*  Epoch offset --> Starting value of height()


Height
       9.00 ┼                              ╭
       8.00 ┤                           ╭──╯
       7.00 ┤                        ╭──╯
       6.00 ┤                     ╭──╯
       5.00 ┤                  ╭──╯
       4.00 ┤               ╭──╯
       3.00 ┤            ╭──╯
       2.00 ┤         ╭──╯   
       1.00 ┤    ╭────╯ ^     
       0.00 ┼────╯──────|───────────────────────                        
                                            Block      
               ^       T=3
               |         
             
             T = 6
            
             <-------><----------------------->
               Age 1            Age 2

The contract was designed in order to be deterministic, so that no need of state changes are required. Thus, most of the parameters are calculated via functions. 

The exception comes when the owner (EOA, or Contract/DAO) decides to modify the period length, transitioning to a new age.

Most of the parameters explained above are programaticall
**/


contract Period is Ownable {    

    // Current period length
    uint256 public T;

    // Number of changes that have been made to the period length
    uint256 public age;

    // Previous previous length, required for transitions between ages
    uint256 public previousLength;

    // Initial Block where an age has started
    uint256 public blockOffset;
    
    // Initial epoch offset
    uint256 public epochOffset;

    /*
    * Constructor
    * Creates a new Period object 
    * @param _T Number of blocks of a Period
    */
    
    constructor(uint256 _T) public {
        require(_T > 0, 'EMPTY_PERIOD');
        blockOffset = block.number;
        T = _T;
    }

    /**
    * @dev Modifies the period length. 
    * It was created with those use cases where a Smart Contract needs to modify the period length, keeping the same epoch numeration (height)
    * After this parameter is set, the flag isAgeTransition will turn to true()
    * After the current epoch ends (with previous length set) ends, it will start a new age.
    * To do that, it is modified the epoch offset, in order to allow future calculation of blocks
    * Also, it is calculated the new block offset, from the point where period will be applied. 
    * @param _T The period lentgh to be applied to the new age
    */

    function setPeriodLength(uint256 _T) public {
        require(msg.sender == owner);
        uint256 tmpHeight = height();
        blockOffset = getLastEpochBlock() + 1;
        epochOffset = tmpHeight;
        age ++;
        previousLength = T;
        T = _T;
    }

    
    /**
    * @dev Forces a transition to a new Age without waiting for the transition time
    @ param _T The period lentgh to be applied to the new age
    */

    function hardAgeTransition(uint256 _T) public {
        require(msg.sender == owner);
        uint256 tmpHeight = height();
        blockOffset = block.number;
        epochOffset = tmpHeight;
        age ++;
        previousLength = T;
        T = _T;
    }

    /**
    * @dev Getter for the total height included in this periodic contract, including age transitions
    * @return current height
    */
    function height() public view returns (uint256) {
        if (blockOffset > block.number) { // Period has been scheduled or modified. 
            return epochOffset;
        }
        else { // Normal behaviour
            return (block.number - blockOffset) / T + epochOffset + age;
        }
    }

    /**
    * @dev Returns the height inside the current age
    * @return height (number of epochs) inside the current age
    */

    function ageHeight() public view returns (uint256) {
        if (isAgeTransition()) { // Period has been scheduled or modified. 
            return epochOffset;
        }
        else { // Normal behaviour
            return (block.number - blockOffset) / T;
        }
    }

    /**
    * @dev Calculates and returns the first block of the current epoch
    * @return First block of the current epoch
    */

    function getFirstEpochBlock() public view returns (uint256) {
        if (isAgeTransition()) {
            return blockOffset - previousLength;
        }
        else { 
            return blockOffset + ageHeight() * T;
        }
    }

    /**
    * @dev Returns the last block in the current epoch
    * @return Last block of the current epoch
    */

    function getLastEpochBlock() public view returns (uint256){
         if (isAgeTransition()) {
             return block.number + previousLength - getRelativeIndex() - 1;
        }
        else {
            return block.number + T  - getRelativeIndex() - 1;
        }
    }

    /*
    * @return Index inside the current epoch. 
    */

    function getRelativeIndex() public view returns (uint256) {
        return block.number - getFirstEpochBlock();
    }
    
    /**
    * @dev Condition to check if an age transition is in progress
    */

    function isAgeTransition() public view returns (bool){
        return blockOffset > block.number;
    }
}