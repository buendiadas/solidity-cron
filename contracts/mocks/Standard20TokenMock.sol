pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract Standard20TokenMock is ERC20 {

    constructor(address[] accounts, uint256 initialBalance) public {
        for (uint i = 0; i < accounts.length; i++){
            _mint(accounts[i],initialBalance);
        }
    }

    function issueTokens(address[] accounts, uint256 tokenAmount) external {
    	for (uint i = 0; i < accounts.length; i++){
            _mint(accounts[i],tokenAmount);
        }
    }
}
