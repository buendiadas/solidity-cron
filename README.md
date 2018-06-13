# Cron

[![Build Status](https://travis-ci.com/Frontier-project/cron.svg?token=DJeMzxJJncp3nRaEUuxH&branch=master)](https://travis-ci.com/Frontier-project/cron)



## About

This solidity library enable schedule periodical states on the Ethereum Blockchain from a Smart Contract , making it possible for external contracts to lazily allow other state changes on a periodic Basis.


![stages](https://image.ibb.co/f6cMZd/Periodic_Stages.png)

## Install
In order to install the library, just run the following commands on your root solidity directory

```bash
npm init -y
npm i -E @frontiertokenresearch/cron
```
## How to use

There are two different cases where the library could be used: 
- **Periods**: When your DApp just needs an index counting the amount of blocks passed since a certain block-
- **Periodic Stages**: When your DApp includes also certain actions inside every period.

### Using Periods
A periodic Ethereum DApp that needs to handle the current period index. 

#### Importing
Just import the Periodic contract into your Smart Contract, and initialize it.
```javascript
import "@frontiertokenresearch/contracts/Period.sol";
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
import "@frontiertokenresearch/contracts/Period.sol";

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

