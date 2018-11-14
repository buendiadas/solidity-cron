import "./lib/DateTime.sol";
import "../IPeriod.sol";

contract MonthlyPeriod is IPeriod {
    using DateTime for *;
    
    // Current period length
    uint256 public T; // Length in Months of the period
    uint256 public unitOffset; //timestamp (seconds) 
    
    constructor(uint256 _T) {
        unitOffset = block.timestamp;
        T = _T;
    }

    function getLength() public view returns(uint256) {
        return T;
    }
    
    function epochOffset() public view returns (uint256) {
        return uint256((DateTime.getYear(block.timestamp) - DateTime.getYear(unitOffset)));
    }
    
    function height() public view returns (uint256) {
        return epochOffset() * 12 + uint256(DateTime.getMonth(block.timestamp)) - uint256(DateTime.getMonth(unitOffset)) ;
    }
    
}