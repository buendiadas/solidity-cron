
pragma solidity 0.4.25;
import "../ICron.sol";


contract PeriodMock is ICron { 

    uint256 private _counter = 0; 

    function getLength() public view returns (uint256) {
        return 1;
    }

    function heightOf(uint256 _timestamp) public view returns (uint256) {
        return 0;
    }
    function height() public view returns (uint256) {
        return _counter;
    }

    function next() public view returns (uint256) {
        _counter ++;
    }
}