# Cron 
*Schedule state changes on the EVM*

[![Build Status](https://travis-ci.com/carlos-buendia/cron-solidity.svg?token=DJeMzxJJncp3nRaEUuxH&branch=develop)](https://travis-ci.com/carlos-buendia/cron-solidity)
[![codecov](https://codecov.io/gh/Frontier-project/cron/branch/master/graph/badge.svg?token=BGbU5Q6IRV)](https://codecov.io/gh/Frontier-project/cron)



## About

The repo provides tools to let you easily schedule state changes on the EVM. It does it by dividing time in epochs through onchain "clocks". Clocks are single contracts following a common interface (`ICron.sol`)


## How it works

Every cron contract calculates the number of ocurrences a given pattern has done since a initial date, called `initialTimestamp()`, using modular arithmetics through the DateTime library.

This number is provided via `heigh()` function, enabling you to handle states referencing this contract.  They also provide the following event, through a `next()`function. This one is useful for schedule external contract execution through oracles.

#### initialTimestamp

Timestamp(in seconds) where the counter starts. 


```solidity
   function initTimestamp() public view returns (uint256);
  ```
   
#### height

Return the number of occurrences of the stored crontab expression from `initialTimestamp()` to `block.timestamp`


```solidity
 function height(bytes32 _id) public view returns (uint256);
  ```
   
#### heightOf

Return the number of occurrences of the stored crontab expression from `initTimestamp()` to a given `_timestamp`



```solidity
function heightOf(bytes32 _id, uint256 _timestamp) public view returns (uint256);
  ```


#### next

Return the next timestamp where height will be changed, `2^256-1` if no new event is expected
 
```solidity
 function next(bytes32 _id) public view returns (uint256);
```


## Using Cron

While we explore a generic clock compiler, some clocks are provided to test in Rinkeby, and their solidity code can be found at [./contracts/clocks](./contracts/clocks). 

| Test Contract | Cron expression | Network | Address           | Link  |
| ------------- |----|------|:-------------:| -----:|
| Hourly      |0 * * * * / @hourly| Rinkeby | |  |
| Daily      |0 0 * * *  / @Daily| Rinkeby |      |   $12 |
| Monthly |0 0 1 * * /@Monthly| Rinkeby |      |    $1 |




## Testing

You can always use the truffle package to test and contribute to the library. The package needs from a running Ethereum rpc instance in `localhost`, port `8545`. You can run a [ganache-cli](https://github.com/trufflesuite/ganache-cli) instance or run [geth](https://github.com/ethereum/go-ethereum). You can run the tests by just running:

```bash
truffle test
```


## Contributing

The project is open to contributions, just open a PR! We follow Angular [Git Commit guidelines](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines), to follow `semantic-release`versioning.

