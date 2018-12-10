pragma solidity ^0.4.24;

import "../TRL.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
* A Token Ranked List (TRL) enables voting with staked tokens periodically, over a registry of candidates, and sets the compensation of the candidates based on previous interactions 
**/

contract TRLMock is TRL {
    using SafeMath for uint256;

    uint256 epoch = 0;
   

    function height() public view returns(uint256) { 
        return epoch;
    }

    function mock_next() public {
        epoch++;
    }

    function mock_next(uint256 epochsToAdvance) public {
        epoch = epoch + epochsToAdvance;
    }
}
