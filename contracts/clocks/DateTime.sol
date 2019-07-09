pragma solidity ^0.4.25;


/**
 * Contract code based on pipemerrian's Date Time Smart contract, now available as a library.
 * https://github.com/pipermerriam/ethereum-datetime/blob/master/contracts/DateTime.sol
 * Provide Datetime utils on Ethereum Smart Contracts
 */


library DateTime {
    struct _DateTime {
        uint16 year;
        uint8 month;
        uint8 day;
        uint8 hour;
        uint8 minute;
        uint8 second;
        uint8 weekday;
    }

     function getYear(uint _timestamp) public pure returns (uint16) {
        uint256 secondsAccountedFor = 0;
        uint16 year;
        uint256 numLeapYears;

        // Year
        year = uint16(originYear() + _timestamp / yearInSeconds());
        numLeapYears = leapYearsBefore(year) - leapYearsBefore(originYear());

        secondsAccountedFor += leapYearInSeconds() * numLeapYears;
        secondsAccountedFor += yearInSeconds() * (year - originYear() - numLeapYears);

        while (secondsAccountedFor > _timestamp) {
                if (isLeapYear(uint16(year - 1))) {
                        secondsAccountedFor -= leapYearInSeconds();
                }
                else {
                        secondsAccountedFor -= yearInSeconds();
                }
                year -= 1;
        }
        return year;
    }

    function diffYears(uint256 _x, uint256 _y) public pure returns (uint256) {
        require(getYear(_x) >= getYear(_y), 'First argument provided must be > second argument');
        return uint256(getYear(_x) - getYear(_y));
    }

    function diffMonths(uint256 _x, uint256 _y) public pure returns (uint256) {
        uint8 delta = getMonth(_x) < getMonth(_y) ? 1 : 0;
        return (diffYears(_x, _y) - delta) * 12  + uint256(getMonth(_x) - getMonth(_y)) ;
    }
    
    function diffDays(uint256 _x, uint256 _y) public pure returns (uint256) {
        require(_x > _y);
        return(_x - _y) / 86400;
    }
    
    function diffHours(uint256 _x, uint256 _y) public pure returns (uint256) {
        require(_x > _y);
        return(_x - _y) / hourInSeconds();
    }
    
    function getMonth(uint256 _timestamp) public pure returns (uint8) {
            return parseTimestamp(_timestamp).month;
    }

    function getDay(uint256 _timestamp) public pure returns (uint8) {
            return parseTimestamp(_timestamp).day;
    }

    function getHour(uint256 _timestamp) public pure returns (uint8) {
            return uint8((_timestamp / 60 / 60) % 24);
    }

    function getMinute(uint256 _timestamp) public pure returns (uint8) {
            return uint8((_timestamp / 60) % 60);
    }

    function getSecond(uint256 _timestamp) public pure returns (uint8) {
            return uint8(_timestamp % 60);
    }

    function getWeekday(uint256 _timestamp) public pure returns (uint8) {
            return uint8((_timestamp / dayInSeconds() + 4) % 7);
    }

    function getDaysInMonth(uint16 _month, uint16 _year) public pure returns (uint8) {
        if (_month == 1 || _month == 3 || _month == 5 || _month == 7 || _month == 8 || _month == 10 || _month == 12) {
                return 31;
        }
        else if (_month == 4 || _month == 6 || _month == 9 || _month == 11) {
                return 30;
        }
        else if (isLeapYear(_year)) {
                return 29;
        }
        else {
                return 28;
        }
    }

    function parseTimestamp(uint256 _timestamp) internal pure returns (_DateTime dt) {
        uint256 secondsAccountedFor = 0;
        uint256 buf;
        uint8 i;

        dt.year = getYear(_timestamp);
        buf = leapYearsBefore(dt.year) - leapYearsBefore(originYear());

        secondsAccountedFor += leapYearInSeconds() * buf;
        secondsAccountedFor += yearInSeconds() * (dt.year - originYear() - buf);
        uint256 secondsInMonth;
        for (i = 1; i <= 12; i++) {
                secondsInMonth = dayInSeconds() * getDaysInMonth(i, dt.year);
                if (secondsInMonth + secondsAccountedFor > _timestamp) {
                        dt.month = i;
                        break;
                }
                secondsAccountedFor += secondsInMonth;
        }

        for (i = 1; i <= getDaysInMonth(dt.month, dt.year); i++) {
                if (dayInSeconds() + secondsAccountedFor > _timestamp) {
                        dt.day = i;
                        break;
                }
                secondsAccountedFor += dayInSeconds();
        }

        dt.hour = getHour(_timestamp);
        dt.minute = getMinute(_timestamp);
        dt.second = getSecond(_timestamp);
        dt.weekday = getWeekday(_timestamp);
    }


    function toTimestamp(uint16 _year, uint8 _month, uint8 _day) public pure returns (uint256 _timestamp) {
        return toTimestamp(_year, _month, _day, 0, 0, 0);
    }

    function toTimestamp(uint16 _year, uint8 _month, uint8 _day, uint8 _hour) public pure returns (uint256 _timestamp) {
        return toTimestamp(_year, _month, _day, _hour, 0, 0);
    }

    function toTimestamp(uint16 _year, uint8 _month, uint8 _day, uint8 _hour, uint8 _minute) public pure returns (uint256 _timestamp) {
        return toTimestamp(_year, _month, _day, _hour, _minute, 0);
    }

    function toTimestamp(uint16 year, uint8 month, uint8 day, uint8 hour, uint8 minute, uint8 second) public pure returns (uint256 _timestamp) {
        uint16 i;
        for (i = originYear(); i < year; i++) {
                if (isLeapYear(i)) {
                _timestamp += leapYearInSeconds();
                }
                else {
                _timestamp += yearInSeconds();
                }
        }
        for (i = 1; i < month; i++) {
        _timestamp += dayInSeconds() * getDaysInMonth(i - 1, year);
        }
        _timestamp += dayInSeconds() * (day - 1);
        _timestamp += hourInSeconds() * (hour);
        _timestamp += minuteInSeconds() * (minute);
        _timestamp += second;
        return _timestamp;
    }


    function isLeapYear(uint16 year) public pure returns (bool) {
        if (year % 4 != 0) {
            return false;
        }
        if (year % 100 != 0) {
            return true;
        }
        if (year % 400 != 0) {
            return false;
        }
        return true;
    }
    
    function originYear() public pure returns(uint16){
        return 1970;
    }
    
    function dayInSeconds() public pure returns (uint256) {
        return 86400;
    }
    
    function yearInSeconds() public pure returns (uint256) {
        return 31536000;
    }
    
    function leapYearInSeconds() public pure returns (uint256) { 
        return 31622400;
    }
    
    function minuteInSeconds() public pure returns(uint256) {
        return 60;
    }
    
    function hourInSeconds() public pure returns(uint256) { 
        return 3600;
    }

    function leapYearsBefore(uint256 _year) public pure returns (uint256) {
        _year -= 1;
        return _year / 4 - _year / 100 + _year / 400;
    }
    
    function monthsIncludingDay(uint256 _day) public pure returns (uint256) { 
        if(_day <= 28) {
            return 12;
        }
        
        else if(_day == 29) {
            return 11; /// !!!!! Another exception --> LEAP
        }
        
        else if(_day == 30) {
            return 11;
        }
        
        else if (_day == 31) {
            return 7;
        }
        
    }
    
    function SumMonthsIncludingDayAt(uint256 _day, uint256 _month) public pure returns (uint256) { 
        uint array_index = _month - 1;
        uint8[12] memory d31 = [1, 1, 2, 2, 3, 3, 4, 5, 5, 6, 6, 7]; 
        uint8[12] memory d30 = [1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        uint8[12] memory d29 = [1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        uint8[12] memory d28 =[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        if(_day == 31) return d31[array_index];
        else if(_day ==30) return d30[array_index];
        else if(_day == 29) return d29[array_index];
        else return d28[array_index]; 
    }
    
    ///    *      *      *          *        *
    /// (minute, hour, day(month), month, day(week)
    
    
    
    
        /// Example 1: Every Day 31    
    ///    *      *      31          *        *         * 
    /// (minute, hour, day(month), month, day(week)  year
    
    
    
     function calculateBoundsOffsetMinutes(uint _x, uint _y, uint _minute) returns (uint){
        
         if(_minute <= getMinute(_x)) {
            return 1;
        }
        return 0;
    }
    
     function calculateBoundsOffsetHours(uint _x, uint _y, uint _minute, uint _hour) returns (uint){
        if(_hour < getHour(_x)) {
            return 1;
        }
        else if(_hour == getHour(_x)) {
            return calculateBoundsOffsetMinutes( _x,  _y, _minute);
        }
        return 0;
        
    }
    
     function calculateBoundsOffsetDays(uint _x, uint _y, uint _minute, uint _hour, uint _day) returns (uint){
        
        if(_day < getDay(_x)) {
            return 1;
        }
        else if(_day == getDay(_x)) {
            return calculateBoundsOffsetHours( _x,  _y, _minute, _hour);
        }
        return 0;
    }
    

    function calculateBoundsOffsetMonths(uint _x, uint _y, uint _minute, uint _hour, uint _day, uint _month) returns (uint){
        
        if(_month < getMonth(_x)){
            return 1;
        }
        
        else if(_month == getMonth(_x)){
            return calculateBoundsOffsetDays( _x,  _y, _minute, _hour, _day);
        }
        return 0;
    }
    
     function calculateBoundsOffsetYears(uint _x, uint _y, uint _minute, uint _hour, uint _day, uint _month, uint _year) returns (uint){
        
        if(_year < getYear(_x)){
            return 1;
        }
        
        else if(_year == getYear(_x)){
            return calculateBoundsOffsetMonths( _x,  _y, _minute, _hour, _day, _month);
        }
        return 0;
    }
    
    
    function numMinutes(uint _x, uint _y, uint256 _minute) public view returns (uint256) {
        uint256 middleHourEvents = (diffHours(_x,_y) - 2 + 1) * 24;
        uint256 firstHourEvents = _minute >= getMinute(_y) ? 1:0;
        uint256 lastHourEvents = _minute <= getMinute(_x) ? 1:0;
        return firstHourEvents +  middleHourEvents + lastHourEvents;
    }
    
    /// Example 1: Every Day 31    
    ///    *      *      31          *        *         * 
    /// (minute, hour, day(month), month, day(week)  year
    
    
    function numHours(uint _x, uint _y, uint256 _minute, uint _hour) public view returns (uint256) { 
        if (_hour == 999) {
            return (numMinutes(_x, _y, _minute));
        }
        
        uint256 middleDayEvents = (diffDays(_x,_y) - 2 + 1);
        uint256 firstDayEvents = _hour >= getHour(_y) ? 1:0;
        uint256 lastDayEvents = _hour <= getHour(_x) ? 1:0;
        return firstDayEvents +  middleDayEvents + lastDayEvents;
        
    }
    
        /// Example 1: Every Day 31    
    ///    *      *      31          *        *         * 
    /// (minute, hour, day(month), month, day(week)  year
    
    
    function numDays(uint _x, uint _y, uint256 _minute, uint256 _hour, uint _day) public view returns (uint256) {
        
        if(_day == 999) {
            return numHours( _x, _y,_minute, _hour);
        }
        
        uint256 middleYearEvents = (diffYears(_x,_y) - 2 + 1) * monthsIncludingDay (_day);
        if (_day == 29) {
            middleYearEvents += leapYearsBefore(getYear(_x)) - leapYearsBefore(getYear(_y));   
        }
        uint256 firstYearEvents =  SumMonthsIncludingDayAt(_day, 12) - SumMonthsIncludingDayAt(_day, getMonth(_y));
        uint256 firstMonthEvents = getDay(_x) <= _day ? 1:0;
        uint256 lastYearEvents =  SumMonthsIncludingDayAt(_day, getMonth(_x)) - SumMonthsIncludingDayAt(_day, 1);
        uint256 lastMonthEvents = getDay(_x) >= _day ? 1:0;
        return firstYearEvents +  middleYearEvents + lastYearEvents + lastMonthEvents;
        
    }
    
        
    function numDaysMonth(uint _x, uint _y, uint _minute, uint _hour, uint _day, uint _month) public view returns (uint256) {
        
      if (_month == 999){ 
           return numDays(_x,_y, _minute, _hour, _day);
      }
      
      else {
          uint256 middleYearEvents = diffYears(_x,_y) - 2 + 1;
          uint256 firstYearEvents = (_month > getMonth(_y) || _month == getMonth(_y) && (_day >= getDay(_y)) ) ? 1 : 0;
          uint256 lastYearEvents = (_month < getMonth(_x) || _month ==  getMonth(_x) && (_day <= getDay(_x)) ) ? 1 : 0;
          return firstYearEvents + middleYearEvents + lastYearEvents;
      }
        
   }
   
    function numDaysMonthYear(uint _x, uint _y, uint _minute, uint _hour, uint _day, uint _month, uint256 _year) public view returns (uint256) {
        
      if(_year == 999) { 
          return numDaysMonth(_x,_y, _minute, _hour, _day,_month);
      }
        
      else {
          return calculateBoundsOffsetYears(_x, _y, _minute, _hour, _day, _month, _year);
      }
        
   }

}
    
    
    
    



