pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";


/**
*  A periodic contract. Enables any contract to change state on a periodic basis
*  Basically, it includes three different concepts: 
*  The period: An integer value that will 
*  The offset: Initial Vector that moves the period. Basically the first block of the current period
**/


contract Period { 
    // Period Number set
    uint256 public T;
    // Initial Block where the period is started
    uint256 public initOffset;

    /*
    * Constructor
    * Creates a new Period object 
    * @param _T Number of blocks of a Period
    */
    constructor(uint256 _T) public {
        require(_T > 0, 'EMPTY_PERIOD');
        T = _T;
        initOffset = block.number;
    }
    /**
    * Getter for the current period number
    * @return current period number
    */
    function getPeriodNumber() public view returns (uint256) {
        assert ((block.number - initOffset) >= 0);
        return (block.number - initOffset) / T;
    }

    /**
    * @return initial block, vector that defines the beginning of this period
    */
    function getOffset() public view returns (uint256){
        return initOffset + getPeriodNumber() * T;
    }
    /*
    * @return Index inside the current period. 
    */
    function getRelativeIndex() public view returns (uint256){ 
        return block.number- getOffset();
    }

}
