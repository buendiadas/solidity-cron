# Cron 🕒 

[![Build Status](https://travis-ci.com/carlos-buendia/cron-solidity.svg?token=DJeMzxJJncp3nRaEUuxH&branch=develop)](https://travis-ci.com/carlos-buendia/cron-solidity)
[![codecov](https://codecov.io/gh/Frontier-project/cron/branch/master/graph/badge.svg?token=BGbU5Q6IRV)](https://codecov.io/gh/Frontier-project/cron)



## About

The project helps the developer divide the time spectrum in epochs, enabling to schedule state changes on Ethereum Smart Contracts. It uses a contract per clock, each one of them following the same interface. The final scope of the project includes a cron generator, creating a new contract for each Crontab pattern.

## Motivation

The library summarizes and generalizes the work and lessons learnt in different projects, where the time recurring pattern for different onchain events had to be specifically developed for each project. Decoupling the scheduling logic from the Smart Contract developer has the following benefits:

 * **Interoperability**: By decoupling the scheduling logic, Smart Contracts and external services (oracles) can easily sync their clocks.
 * **Programability**: Most Smart Contracts develop their own arithmetic rules every time they want to schedule periodic changes. The complexity of coding an arbitrarily complex rule may prevent the developer to include it
 * **Security**: Relaying all programable logic to a single trusted source.
 
 ## Structure
 
 
![image](https://i.ibb.co/vLN4K5L/Untitled-Diagram-42.png)


## How to use

The rationale of the project is to make it easy for developers to deploy and use their cron signal.

#### 1. Install

```bash
npm init -y
npm i -E solidity-cron
```

#### 2. Deploying a new cron

Every cron deployed must include the `ICron` interface. While a crontab generator is WIP, you can deploy one of the Smart Contracts provided at [./contracts/calendar](https://github.com/carlos-buendia/solidity-cron/tree/develop/contracts/calendar)



#### 3. Include the Periodic Interface

```javascript
import "@frontier-token-research/contracts/Period.sol";
```

#### 4. Use it 

```javascript
Period p = IPeriod(T)
uint256 currentPeriod =  myDappPeriod.getCurrentPeriod();
```

## Examples


## Testing

You can always use the truffle package to test and contribute to the library. The package needs from a running Ethereum rpc instance in `localhost`, port `8545`. You can run a [ganache-cli](https://github.com/trufflesuite/ganache-cli) instance or run [geth](https://github.com/ethereum/go-ethereum). You can run the tests by just running:

```bash
truffle test
```


## Contributing

The project is open to contributions, just open a PR! We follow Angular [Git Commit guidelines](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines), to follow `semantic-release`versioning.

