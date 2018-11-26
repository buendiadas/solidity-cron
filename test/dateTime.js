const advanceToBlock = require('./helpers/advanceToBlock')
const moment = require('moment');

const DateTimeContract = artifacts.require('DateTimeMock')
const MockDate1 = 636015272; // Tue, 26-02-1990 GMT 6:54:32
const MockDate2 = 1542749251; // Tue, 20-11-2018 GMT 9:27:31 pm
const MockDateLeap = 1586649600; // Wed, 21 Nov 2018 15:09:02 
const MockDateFutureLeap = 76686134400; // 02/02/4400 @ 12:00am (UTC)
const MockDateFuture = 76717756800; // 02/02/4401 @ 12:00am (UTC)
let DateTime;


contract('DateTime', function (accounts) {
  beforeEach(async () => {
    DateTime = await DateTimeContract.new()
  })
  describe('Dates From Timestamp', async () => {
    it('Should return the correct year in a normal year', async () => {
      const year = await DateTime.getYear(MockDate1);
      assert.equal(1990, year.toNumber());
    })
    it('Should return the correct year', async () => {
        const year = await DateTime.getYear(MockDateLeap);
        assert.equal(2020, year.toNumber());
    })
    it('Should return the correct year on a  very future date', async () => {
        const year = await DateTime.getYear(MockDateFutureLeap);
        assert.equal(4400, year.toNumber());
    })
    it('Should return the correct year on a  very future date', async () => {
        const year = await DateTime.getYear(MockDateFuture);
        assert.equal(4401, year.toNumber());
    })
    it('Should return the correct month', async () => {
        const month = await DateTime.getMonth(MockDate1);
        assert.equal('2', month.toNumber());
    })
    it('Should return the correct day', async () => {
        const day = await DateTime.getDay(MockDate1);
        assert.equal('26', day.toNumber());
    })
    it('Should return the correct hour', async () => {
        const hour = await DateTime.getHour(MockDate1);
        assert.equal('6', hour.toNumber());
    })
    it('Should return the correct minute', async () => {
        const minute = await DateTime.getMinute(MockDate1);
        assert.equal('54', minute.toNumber());
    })
    it('Should return the correct Weekday', async () => {
        const weekDay = await DateTime.getWeekday(MockDate1);
        assert.equal('1', weekDay.toNumber());
    })
    it('Should return the correct second', async () => {
        const second = await DateTime.getSecond(MockDate1);
        assert.equal('32', second.toNumber());
    })
  })
  describe('Number of days per month', async () => {
    it('Should  return  correct number of days in a normal year', async () => {
        const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        const regularYear = 2018;
        for(let  i=1; i<= 12; i++) {
            let numberOfDays = await DateTime.getDaysInMonth(i, regularYear);
            assert.equal(monthDays[i-1], numberOfDays.toNumber());
        }
    })
    it('Should  return  correct number of days in a leap', async () => {
        const monthDays = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        const leapYear = 2020;
        for(let  i=1; i<= 12; i++) {
            let numberOfDays = await DateTime.getDaysInMonth(i, leapYear);
            assert.equal(monthDays[i-1], numberOfDays.toNumber());
        }
    })
  })
  describe('Leap  years', async () => {
    it('Should be leap year if % 4 and !%100 and !%400', async () => {
        const leapYear = 2020;
        const isLeapYear =  await DateTime.isLeapYear(leapYear);
        assert.equal(true, isLeapYear)
    })
    it('Should not be leap year if % 4 and %100 and %400', async () => {
        const leapYear = 2100;
        const isLeapYear =  await DateTime.isLeapYear(leapYear);
        assert.equal(false, isLeapYear)
    })
    it('Should return correct number of leap years from now until a certain date', async () => { 
        //@warning --> This test gets outdated every 4 years, if you are getting a fail test, then probably the expected number should be decreased by 1
        const nextLeapYears = [2020, 2024, 2028, 2032, 2036, 2040, 2044, 2048, 2052, 2056, 2060, 2064, 2068, 2072, 2076, 2080, 2084,  2088, 2092, 2096]
        const numberLeapYearsNow = await DateTime.leapYearsBefore(2018); 
        const numberOfLeapYears =  await DateTime.leapYearsBefore(2101); 
        assert.equal(nextLeapYears.length, numberOfLeapYears.toNumber()  - numberLeapYearsNow.toNumber())
    })

  })
  describe('Date difference', async () => {
    it('Should return a correct amount of years between two dates', async () => {
        const yearDiff = await DateTime.diffYears(MockDate2, MockDate1);
        assert.equal(28, yearDiff);
    })
    it('Should return a correct amount of months between two dates', async () => {
        const monthDiff = await DateTime.diffMonths(MockDate2, MockDate1);
        assert.equal(9 + 12 * 27, monthDiff.toNumber());
    })
    it('Should return a correct amount of days between two dates', async () => {
        const dayDiff = await DateTime.diffDays(MockDate2, MockDate1);
        assert.equal(10494, dayDiff.toNumber());
    })
  })
  describe('Date difference', async () => {
    it('Should return a correct timestamp given all data', async () => {
        const yearDiff = await DateTime.diffYears(MockDate2, MockDate1);
        assert.equal(28, yearDiff);
    })
    it('Should a correct amount of months between two dates', async () => {
        const monthDiff = await DateTime.diffMonths(MockDate2, MockDate1);
        assert.equal(9 + 12 * 27, monthDiff.toNumber());
    })
    it('Should a correct amount of days between two dates', async () => {
        const dayDiff = await DateTime.diffDays(MockDate2, MockDate1);
        assert.equal(10494, dayDiff.toNumber());
    })
  })


  describe('Time constants', async () => {
    it('Origin time is set to Unix epoch', async () => {
        const epochYear = await DateTime.originYear();
        assert.equal(1970, epochYear.toNumber());
    })
    it('Number of seconds per day returns correct value', async () => {
        const secondsPerDay = await DateTime.dayInSeconds();
        assert.equal(60 * 60 * 24, secondsPerDay);;
    })
    it('Number of seconds per year returns correct value on a normal year', async () => {
        const secondsPerYear = await DateTime.yearInSeconds();
        assert.equal(60 * 60 * 24 * 365, secondsPerYear.toNumber());
    })
    it('Number of seconds per year returns correct value on a leap year', async () => {
        const secondsPerYear = await DateTime.leapYearInSeconds();
        assert.equal(60 * 60 * 24 * 366, secondsPerYear.toNumber());
    })
    it('Number of seconds per hour returns correct value', async () => {
        const secondsPerHour = await DateTime.hourInSeconds();
        assert.equal(60 * 60, secondsPerHour.toNumber());
    })
    it('Number of seconds per minute returns correct value on a leap year', async () => {
        const secondsPerMinute = await DateTime.minuteInSeconds();
        assert.equal(60, secondsPerMinute);
    })
    it('Number of seconds per hour returns correct value', async () => {
        const monthDiff = await DateTime.diffMonths(MockDate2, MockDate1);
        assert.equal(9 + 12 * 27, monthDiff.toNumber());
    })
    it('Should a correct amount of days between two dates', async () => {
        const dayDiff = await DateTime.diffDays(MockDate2, MockDate1);
        assert.equal(10494, dayDiff.toNumber());
    })
  })





})
