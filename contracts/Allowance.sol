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

    mapping (uint256 => mapping (address => Entity)) public entitiesAllowance;
    
	mapping (uint256 => uint256) currentTotalAllowance;

    struct Entity {
        string name;
        uint256 allowance;
    }


    function addEntity(address entityAddress, string name, uint256 allowance, uint256 _period) external{
        require(msg.sender == owner(),"Message sender is not the owner");
        require(allowance != 0 && allowance <= 100, "Invalid allowance value. Has to be 0<x<=100");
        require(allowance.add(currentTotalAllowance[_period]) <= 100, "New allowance exceeds 100 as total allowance");

        entitiesAllowance[_period][entityAddress] = Entity(name,allowance);
        currentTotalAllowance[_period] = currentTotalAllowance[_period].add(allowance);
    }

    function removeEntity(address entityAddress, uint256 _period) external {
        require(msg.sender == owner(),"Message sender is not the owner");

        currentTotalAllowance[_period] = currentTotalAllowance[_period].sub(entitiesAllowance[_period][entityAddress].allowance);
        delete entitiesAllowance[_period][entityAddress];
    }

    function getEntityAllowance (address entityAddress, uint256 _period) external view returns (uint256 allowance) {
        return entitiesAllowance[_period][entityAddress].allowance;
    }

    function getEntityName (address entityAddress, uint256 _period) external view returns (string name) {
        return entitiesAllowance[_period][entityAddress].name;
    }

    function getEntityNameAndAllowance (address entityAddress, uint256 _period) external view returns (string name, uint256 allowance) {
        return (entitiesAllowance[_period][entityAddress].name, entitiesAllowance[_period][entityAddress].allowance);
    }
}
