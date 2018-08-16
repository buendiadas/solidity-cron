pragma solidity ^0.4.24;

import "../TRLStorage.sol";
import "./ScoringInterface.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";



contract Scoring is TRLStorage, ScoringInterface {
    using SafeMath for uint256;

    /**
    * Returns the score of a given account on a given epoch calculated as 10 times the number of votes
    * @param _epoch Epoch number where the number of votes is taken
    * @param _account Checked TRL agent
    */
    function score(uint256 _epoch, address _account) public view returns (uint256) {
        return votesReceived[_epoch][_account].mul(10);
    }
}
