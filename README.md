# Cron

[![Build Status](https://travis-ci.com/carlos-buendia/cron-solidity.svg?token=DJeMzxJJncp3nRaEUuxH&branch=develop)](https://travis-ci.com/carlos-buendia/cron-solidity)
[![codecov](https://codecov.io/gh/Frontier-project/cron/branch/master/graph/badge.svg?token=BGbU5Q6IRV)](https://codecov.io/gh/Frontier-project/cron)



## About

The project adds a library to easily divide the time spectrum in epochs, enabling to schedule state changes on Ethereum. To simplify the problem, the current version only uses pre-defined expressions: `@hourly`, `@daily`, `@monthly`, `@yearly`. Eventually, the project will enable full state programability, with a cron like synthax.

## Motivation

An interface simmilar to Cron in Ethereum would have the following benefits: 

 * **Interoperability**: By decoupling the scheduling logic, Smart Contracts and external services (oracles) can easily sync their clocks.
 * **Programability**: Most Smart Contracts develop their own arithmetic rules every time they want to schedule periodic changes. The complexity of coding an arbitrarily complex rule may prevent the developer to include it
 * **Security**: As having a robust library externalizes the development 



## Install
In order to install the library, just run the following commands on your root solidity directory

```bash
npm init -y
npm i -E solidity-cron
```

## How to use


#### Importing
Just import the Periodic contract into your Smart Contract, and initialize it.
```javascript
import "@frontier-token-research/contracts/Period.sol";
```
#### Initializing
After that you can define your own period in Blocks, just doing

```javascript
Period MyDAppPeriod = new Period(T)
```

Being `T` the amount of blocks that you want to have as a period. 

#### Getting the current period number
After that, from your Smart Contract you can always reference your current period by calling `getCurrentPeriod()`: 

```javascript
uint256 currentPeriod =  myDappPeriod.getCurrentPeriod();
```
It will return an incremented value every `T` blocks. 

### Using Periodic Stages

Your DApp might have **different stages that are repeated over the previously defined period**. For example, you might need to give permissions to certain actions only on a certain stage of your period. In this case, instead of creating just a period, it is possible to create a Periodic Stages instance, defininig just the period number : 

#### Importing
```javascript
import "@frontier-token-research/contracts/Period.sol";

PeriodicStages MyDAppStages = new PeriodicStages(T)
```
#### Pushing stages
You can now push any stage using the stages `FIFO`stack, just defininng the amount of blocks the given stage is going to last:

```javascript
myDappStages.push(duration)
```

This will add to your stack a new scheduled Task, filling the period since last pushed stage index to the specified above `duration`

#### Getting the current stage
Once the stage has been pushed, you can always get the current stage (by reading the current block), by calling 
```javascriptg 
myDappStages.currentStage()
````

## Testing

You can always use the truffle package to test and contribute to the library. The package needs from a running Ethereum rpc instance in `localhost`, port `8545`. You can run a [ganache-cli](https://github.com/trufflesuite/ganache-cli) instance or run [geth](https://github.com/ethereum/go-ethereum). You can run the tests by just running:

```bash
truffle test
```


## Contributing

If you want to contribute, just open a PR making sure your commits follow Angular [Git Commit guidelines](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines), to follow `semantic-release`versioning.

