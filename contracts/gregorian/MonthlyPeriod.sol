import "./lib/DateTime";

contract MonthlyPeriod {
    using DateTime for *;
    
    // Current period length
    uint256 public T; // Length in Months of the period
    uint256 public unitOffset; //timestamp (seconds) 
    
    constructor(uint256 T) {
        unitOffset = block.timestamp;
    }
    
    function epochOffset() public view returns (uint256) {
        return uint256((DateTime.getYear(block.timestamp) - DateTime.getYear(unitOffset)) / T);
    }
    
    function height() public view returns (uint256) {
        return (uint256(DateTime.getMonth(block.timestamp)) - uint256(DateTime.getMonth(unitOffset))) / T + epochOffset();
    }
    
}