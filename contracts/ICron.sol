pragma solidity ^0.4.25;


contract ICron {
    // Number of current epoch (number of periods) since the Smart Contract was deployed
    function height() public view returns (uint256);
    // Epoch of a predefined timestamp
    function heightOf(uint256 _timestamp) public view returns (uint256);
}
