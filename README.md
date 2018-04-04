## About

Frontier Lists enable to create periodic incentivized Ballots and Token Ranked Lists (TRL)


## Dependencies

The package needs from a running Ethereum rpc instance in `localhost`, port `8545`. You can run a [ganache-cli](https://github.com/trufflesuite/ganache-cli) instance or run [geth](https://github.com/ethereum/go-ethereum)


## Install

```bash
npm install
```

## Test
The repo has a comprehensive test suite. You can run it with:

```bash
npm run test
```

## Compile
In order to get the ABI and bytecode, it is opened a npm command

```bash
npm run compile
```

## Deploy

Registries and TRL are deployed by calling the migrate command

```bash
npm run migrate
```
