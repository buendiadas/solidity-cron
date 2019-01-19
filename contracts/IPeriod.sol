pragma solidity ^0.4.24;


contract IPeriod {
    // Unit defining the period, e.g: 'Hours',  'Months', 'Seconds', 'Years'
    function unit() public view returns (string); 
    // Length of the period, referenced in previous unit 
    function length() public view returns (uint256);
    // Number of current epoch (number of periods) since the Smart Contract was deployed
    function height() public view returns (uint256);
    // Epoch of a predefined timestamp
    function heightOf(uint256 _timeStamp) public view returns (uint256);
    // Next timestamp where the height will be changed, moving to a new epoch
    function next() public view returns (uint256);
}