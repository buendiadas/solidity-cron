pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";

contract Standard20TokenMock is StandardToken {

    constructor(address[] accounts, uint256 initialBalance) public {
        for (uint i = 0; i < accounts.length; i++){
            balances[accounts[i]] = initialBalance;
        }
    }
}
