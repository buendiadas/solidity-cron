pragma solidity ^0.4.24;


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
        require(getYear(_x) >= getYear(_y), 'First argument provided must be > second argument');
        uint8 delta = getMonth(_x) > getMonth(_y) ? 1 : 0;
        return (diffYears(_x, _y) - delta) * 12  + uint256(getMonth(_x) - getMonth(_y)) ;
    }

    function diffDays(uint256 _x, uint256 _y) public pure returns (uint256) {
        require(_x > _y);
        return(_x - _y) / 86400;
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

}

