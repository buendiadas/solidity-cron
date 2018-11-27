pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

/**
* A smart-contract that keeps track of what
* percentage of the Bounty Pool, each Entity is 
* allowed to receive.
* An entity is a smart-contract
*/


contract Allowance is Ownable {
	using SafeMath for uint256;

	mapping (uint256 => mapping (address => Entity)) public entitiesAllowance;
	
	// This variable is used to keep track of the total allowance of a period
	// It's necessary to make sure the value never exceeds 100	
	mapping (uint256 => uint256) currentTotalAllowance;

	struct Entity {
		string name;
		uint256 allowance;
	}

	/**
    * @dev Authorized a new entity
    * @param _entityAddress The entity's smart-contract address
    * @param _name A human readable name that can be given to that entity
    * @param _allowance A number from 0 to 100,which corresponds to the percentage of the bounty pool that entity is entitled to
    * @param _epoch The period to which this allowance corresponds to
    * TODO: Add a way to make an allowance valid for multiple periods
    **/


	function addEntity(address _entityAddress, string _name, uint256 _allowance, uint256 _epoch) external{
		require(msg.sender == owner(),"Message sender is not the owner");
		require(_allowance != 0 && _allowance <= 100, "Invalid allowance value. Has to be 0<x<=100");
		require(_allowance.add(currentTotalAllowance[_epoch]) <= 100, "New allowance exceeds 100 as total allowance");

		entitiesAllowance[_epoch][_entityAddress] = Entity(_name,_allowance);
		currentTotalAllowance[_epoch] = currentTotalAllowance[_epoch].add(_allowance);
	}

	/**
    * @dev Removes the authorization of an entity
    * @param _entityAddress The entity's smart-contract address
    * @param _epoch The period to which this allowance corresponds to
    **/

	function removeEntity(address _entityAddress, uint256 _epoch) external {
		require(msg.sender == owner(),"Message sender is not the owner");

		currentTotalAllowance[_epoch] = currentTotalAllowance[_epoch].sub(entitiesAllowance[_epoch][_entityAddress].allowance);
		delete entitiesAllowance[_epoch][_entityAddress];
	}

	/**
    * @dev Returns the allowance % of an entity
    * @param _entityAddress The entity's smart-contract address
    * @param _epoch The period to which this allowance corresponds to
    **/

	function getEntityAllowance (address _entityAddress, uint256 _epoch) external view returns (uint256 allowance) {
		return entitiesAllowance[_epoch][_entityAddress].allowance;
	}

	/**
    * @dev Returns the name of an entity
    * @param _entityAddress The entity's smart-contract address
    * @param _epoch The period to which this allowance corresponds to
    **/

	function getEntityName (address _entityAddress, uint256 _epoch) external view returns (string name) {
		return entitiesAllowance[_epoch][_entityAddress].name;
	}

	/**
    * @dev Returns the allowance % of and name of an entity
    * @param _entityAddress The entity's smart-contract address
    * @param _epoch The period to which this allowance corresponds to
    **/

	function getEntityNameAndAllowance (address _entityAddress, uint256 _epoch) external view returns (string name, uint256 allowance) {
		return (entitiesAllowance[_epoch][_entityAddress].name, entitiesAllowance[_epoch][_entityAddress].allowance);
	}
}
