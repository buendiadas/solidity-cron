pragma solidity ^0.4.24;


contract ScoringInterface {
    function score(uint256 _epoch, address account) public view returns (uint256);
}
