pragma solidity ^0.4.24;
import "../calendar/DateTime.sol";

/**
 * Contract code based on pipemerrian's Date Time Smart contract, now available as a library.
 * https://github.com/pipermerriam/ethereum-datetime/blob/master/contracts/DateTime.sol
 * Provide Datetime utils on Ethereum Smart Contracts
 */

contract DateTimeMock {
    using DateTime for *;
  

     function getYear(uint _timestamp) public pure returns (uint16) {
       return DateTime.getYear(_timestamp);
    }

    function getMonth(uint256 _timestamp) public pure returns (uint8) {
        return DateTime.getMonth(_timestamp);
    }

    function getDay(uint256 _timestamp) public pure returns (uint8) {
        return DateTime.getDay(_timestamp);
    }

    function getHour(uint256 _timestamp) public pure returns (uint8) {
        return DateTime.getHour(_timestamp);
    }

    function getMinute(uint256 _timestamp) public pure returns (uint8) {
        return DateTime.getMinute(_timestamp);
    }

    function getSecond(uint256 _timestamp) public pure returns (uint8) {
        return DateTime.getSecond(_timestamp);
    }

    function getWeekday(uint256 _timestamp) public pure returns (uint8) {
        return DateTime.getWeekday(_timestamp);
    }

    function getDaysInMonth(uint16 _month, uint16 _year) public pure returns (uint8) {
       return DateTime.getDaysInMonth(_month, _year);
    }

    function diffYears(uint256 _x, uint256 _y) public pure returns (uint256) {
        return DateTime.diffYears(_x, _y);
    }

    function diffMonths(uint256 _x, uint256 _y) public pure returns (uint256) {
        return DateTime.diffMonths(_x, _y);
    }

    function diffDays(uint256 _x, uint256 _y) public pure returns (uint256) {
        return DateTime.diffDays(_x, _y);
    }

    function isLeapYear(uint16 _year) public pure returns (bool) {
        return DateTime.isLeapYear(_year);
    }
    
    function originYear() public pure returns(uint16) {
        return DateTime.originYear();
    }
    
    function dayInSeconds() public pure returns (uint256) {
        return DateTime.dayInSeconds();
    }
    
    function yearInSeconds() public pure returns (uint256) {
        return DateTime.yearInSeconds();
    }
    
    function leapYearInSeconds() public pure returns (uint256) { 
        return DateTime.leapYearInSeconds();
    }
    
    function minuteInSeconds() public pure returns(uint256) {
        return DateTime.minuteInSeconds();
    }
    
    function hourInSeconds() public pure returns(uint256) { 
        return DateTime.hourInSeconds();
    }

    function leapYearsBefore(uint256 _year) public pure returns (uint256) {
        return DateTime.leapYearsBefore(_year);
    }
}

