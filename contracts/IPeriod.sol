pragma solidity 0.4.24;


contract IPeriod { 
    function getLength() public view returns (uint256);
    function height() public view returns (uint256);
}