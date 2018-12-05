
pragma solidity 0.4.24;
import "../cron/contracts/IPeriod.sol";


contract PeriodMock is IPeriod { 

    uint256 private _counter = 0; 

    function getLength() public view returns (uint256){
        return 1;
    }

    function heightOf(uint256 _timestamp) public view returns (uint256){
        return 0;
    }
    function height() public view returns (uint256){
        return _counter;
    }

    function next()  public{
        _counter ++;
    }
}