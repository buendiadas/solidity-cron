pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./Allowance.sol";
import "./TRL.sol";
import "./Vault.sol";

/**
* The Bank smart-contract keeps track of the balance of each entity
* It is also responsible for interacting with the Vault
*/

contract Bank is Ownable {
	using SafeMath for uint256;

	
	Allowance AllowanceInstance;
	Vault VaultInstance;
	
	struct BalanceRecord {
		uint256 startingBalance;
		uint256 currentBalance;
	}
		//        period              token             entity      balance  
	mapping (uint256 => mapping (address => mapping(address => BalanceRecord))) entityBalanceForPeriod;

	event setBalanceForEntity(address indexed _entity, address indexed _token, uint256 indexed _epoch, uint256 _balance);
	event madePayment(address indexed _entity, address indexed _receiver, address indexed _tokenAddress, uint256 _paymentAmount);

	constructor(address _allowanceContractAddress, address _vaultContractAddress) public {
		require(msg.sender == owner(), "Sender must be the owner");
		
		AllowanceInstance = Allowance(_allowanceContractAddress);
		VaultInstance = Vault(_vaultContractAddress);
	}

	/**
    * @dev Calculates the balance for an array of entities, based on the bounty pool amount for that period
    * @param _entities The entities array
    * @param _tokenAddress The address of the token contract
    * @param _epoch The period to which this balance corresponds to
    **/
	function setBalancesForEntities(address[] _entities, address _tokenAddress, uint256 _epoch) external {
		// only allow 10 at most, more will probably be an input mistake
		require(_entities.length < 10, "Should not provide more than 10 entities");
		// Getting the ammount of tokens in the Bounty Poll
		uint256 periodPool = VaultInstance.balance(_epoch, _tokenAddress);

		//Calculate the balance for each entity, based on its allowance
		for (uint256 i = 0; i < _entities.length; i++) {
			// Get the entity's allowance in Percentage form
			uint256 entityAllowance = AllowanceInstance.getEntityAllowance(_entities[i], _epoch);
			// Get the entity's allowance in number of Tokens, based on the ammount
			// of tokens in the bounty pool
			uint256 entityAbsoluteAllowance = _calculateBalance(entityAllowance, periodPool);
			// Set the entity's balance for the current period as the number of Tokens
			BalanceRecord memory balRecord = BalanceRecord(entityAbsoluteAllowance, entityAbsoluteAllowance);
			entityBalanceForPeriod[_epoch][_tokenAddress][_entities[i]] = balRecord;
		}
	}
	
	/**
    * @dev Makes a payment to a receiver
    * @param _entity The entity that is making the withdraw. This needs to be passed as a param, and not just read from msg.sender, so that it can be triggerd by the owner.
    * @param _receiver The account that will receive the payment
    * @param _tokenAddress The address of the token contract
    * @param _paymentAmount The token amount to be transfered
    **/
	
	function makePayment (address _entity,address _receiver,address _tokenAddress, uint256 _paymentAmount, 
		uint256 _epoch) external 
	{
		// check that it's the owner calling the function    
		require(msg.sender == owner() || msg.sender == _entity, "Only the owner can update this value");
		
		// Get the current balance of this entity, in number of tokens
		uint256 currentBalance = entityBalanceForPeriod[_epoch][_tokenAddress][_entity].currentBalance;
		
		// --> Check that it's not withdrawing more than it has
		require(_paymentAmount <= currentBalance, "Trying to withdraw more than the balance");
		
		// Transfer the value from the Vault
		VaultInstance.transfer(_epoch, _tokenAddress, _receiver, _paymentAmount);
		
		// Update the entity's balance
		entityBalanceForPeriod[_epoch][_tokenAddress][_entity].currentBalance = currentBalance.sub(_paymentAmount);
	}		

	/**
    * @dev Returns an entity's balance for a period and token
    * @param _entity The entity that is making the withdraw. This needs to be passed as a param, and not just read from msg.sender, so that it can be triggerd by the owner.
    * @param _tokenAddress The address of the token contract
    * @param _epoch The period for which the balance is checked
    **/
	
	function getBalance (address _entity, address _tokenAddress, uint256 _epoch) external view returns (uint256) {
		return entityBalanceForPeriod[_epoch][_tokenAddress][_entity].currentBalance;
	}
	
	/**
    * @dev Returns an entity's original balance for a period and token
    * @param _entity The entity that is making the withdraw. This needs to be passed as a param, and not just read from msg.sender, so that it can be triggerd by the owner.
    * @param _tokenAddress The address of the token contract
    * @param _epoch The period for which the original balance is checked
    **/

	function getStartingBalance(address _entity, address _tokenAddress, uint256 _epoch) external view returns (uint256){
		return entityBalanceForPeriod[_epoch][_tokenAddress][_entity].startingBalance;
	}


	/**
    * @dev Pure function that converts a percentage into an absolute number of tokens
    * @param _entityAllowance The entity's % allowance
    * @param _epochPool Amount of tokens in the bounty pool for that period
    **/

	function _calculateBalance(uint256 _entityAllowance, uint256 _epochPool) pure returns (uint256 allowance) {
		uint256 stepCalculation = _entityAllowance.mul(_epochPool);
		return stepCalculation.div(100);
	}
}
