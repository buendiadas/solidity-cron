pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

/**
* A Smart contract including multiple Vaults identifiable by ID
* Every Vault has the possibility of storing multiple ERC20 tokens
* Don't send tokens directly to this contract using transfer or your funds may be lost, instead, use deposit.
* Inspired by AragonOS Vault https://github.com/aragon/aragon-apps/blob/master/apps/vault/contracts/Vault.sol
*/


contract Allowance is Ownable {
    using SafeMath for uint256;

    mapping (address => Entity) public entitiesAllowance;
    
    uint256 currentTotalAllowance;

    struct Entity {
        string name;
        uint256 allowance;
    }

    constructor() public {
        currentTotalAllowance = 0;
    }

    function addEntity(address entityAddress, string name, uint256 allowance) external{
        require(msg.sender == owner(),"Message sender is not the owner");
        require(allowance != 0 && allowance <= 100, "Invalid allowance value. Has to be 0<x<=100");
        require(allowance.add(currentTotalAllowance) <= 100, "New allowance exceeds 100 as total allowance");

        entitiesAllowance[entityAddress] = Entity(name,allowance);
        currentTotalAllowance = currentTotalAllowance.add(allowance);
    }

    function removeEntity(address entityAddress) external {
        require(msg.sender == owner(),"Message sender is not the owner");

        currentTotalAllowance = currentTotalAllowance.sub(entitiesAllowance[entityAddress].allowance);
        delete entitiesAllowance[entityAddress];
    }

    function getEntityAllowance (address entityAddress) external view returns (uint256 allowance) {
        return entitiesAllowance[entityAddress].allowance;
    }

    function getEntityName (address entityAddress) external view returns (string name) {
        return entitiesAllowance[entityAddress].name;
    }

    function getEntityNameAndAllowance (address entityAddress) external view returns (string name, uint256 allowance) {
        return (entitiesAllowance[entityAddress].name, entitiesAllowance[entityAddress].allowance);
    }
}