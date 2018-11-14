import "./lib/DateTime.sol";
import "../IPeriod.sol";

contract DailyPeriod is IPeriod {
    using DateTime for *;
    
    uint256 public T;
    uint256 public unitOffset; 
    
    constructor(uint256 _T) {
        unitOffset = block.timestamp;
        T = _T;
    }

    function getLength() public view returns(uint256) {
        return T;
    }
    
    function months() public view returns (uint256) {
        return uint256((DateTime.getYear(block.timestamp) - DateTime.getYear(unitOffset)));
    }
    
    function height() public view returns (uint256) {
        return months() * 30 + uint256(DateTime.getMonth(block.timestamp)) - uint256(DateTime.getMonth(unitOffset)) ;
    }
    
}