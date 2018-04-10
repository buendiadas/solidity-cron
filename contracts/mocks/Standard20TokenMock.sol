pragma solidity ^0.4.18;
import "../lib/Standard20Token.sol";

contract Standard20TokenMock is Standard20Token {

  function Standard20TokenMock(address[] accounts, uint256 initialBalance) public {
    for (uint i= 0; i < accounts.length; i++){
        balances[accounts[i]] = initialBalance;
    }
  }
}
