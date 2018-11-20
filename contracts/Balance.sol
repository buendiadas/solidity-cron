pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./Allowance.sol";
import "./TRL.sol";
import "./Vault.sol";


contract Balance is Ownable {
		using SafeMath for uint256;

		TRL TRLInstance;
		Allowance AllowanceInstance;
		Vault VaultInstance;

		//        period              token             entity      balance  
		mapping (uint256 => mapping (address => mapping(address => uint256))) entityBalanceForPeriod;
		mapping (uint256 => mapping (address => uint256)) public balanceStage; // 0= unset , 1= set, 2= changed

		constructor (address _TRLContractAddress, address _allowanceContractAddress, address _vaultContractAddress) public {
				require(msg.sender == owner(), "Sender must be the owner");
				TRLInstance = TRL(_TRLContractAddress);
				AllowanceInstance = Allowance(_allowanceContractAddress);
				VaultInstance = Vault(_vaultContractAddress);
		}

		// anyone can call this function
		function setBalancesForEntities(address[] _entities, address _tokenAddress) external{
				// only allow 10 at most, more will probably be an input mistake
				require(_entities.length < 10,"Should not provide more than 10 entities");
				// Geting the current period from TRL
				uint256 currentPeriod = TRLInstance.height();
				// Getting the ammount of tokens in the Bounty Poll
				uint256 periodPool = VaultInstance.balance(currentPeriod,_tokenAddress);

				//Calculate the balance for each entity, based on its allowance
				for(uint256 i = 0; i<_entities.length; i++){
						// Get the entity's allowance in Percentage form
						uint256 entityAllowance = AllowanceInstance.getEntityAllowance(_entities[i]);
						// Get the entity's allowance in number of Tokens, based on the ammount
						// of tokens in the bounty pool
						uint256 entityAbsoluteAllowance = _calculateBalance(entityAllowance, periodPool);
						// Set the entity's balance for the current period as the number of Tokens
						entityBalanceForPeriod[currentPeriod][_tokenAddress][_entities[i]] = entityAbsoluteAllowance;
						// Set the balance stage flag to 1, meaning "set".
						// "set" means the balance has been calculated and had not been changed.
						balanceStage[currentPeriod][_tokenAddress] = 1;
				}
		}
		// updates the balance after a withdrawal
		function withdraw(address _entity, address _tokenAddress, uint256 ammountWithdrawn) external {
				// check that it's the owner calling the function    
				require(msg.sender == owner() || msg.sender == _entity,"Only the owner can update this value");
				// Get the current period value from TRL
				uint256 currentPeriod = TRLInstance.height();
				// Get the current balance of this entity, in number of tokens
				uint256 currentBalance = entityBalanceForPeriod[currentPeriod][_tokenAddress][_entity];
				// Check that it's not withdrawing more than it has
				require(ammountWithdrawn <= currentBalance, "Trying to withdraw more than the balance");
				// Update the entity's balance
				entityBalanceForPeriod[currentPeriod][_tokenAddress][_entity] = currentBalance.sub(ammountWithdrawn);
				// Set the balance stage flag to 2, meaning "changed".
				// "changed" means the balance has been changed after it was set.    
				balanceStage[currentPeriod][_tokenAddress] = 2;
		}
		// Get balance for current period
		function getBalance (address _entity, address _tokenAddress) view external returns (uint256){
				uint256 currentPeriod = TRLInstance.height();
				return entityBalanceForPeriod[currentPeriod][_tokenAddress][_entity];
		}

		// Get balance for specific period
		/*
		   function getBalance (address _entity, address _tokenAddress, uint256 _period) view external returns (uint256){
		   return entityBalanceForPeriod[_period][_tokenAddress][_entity];
		   }*/


		//Returns the number of tokens, based on the percentage share of the bounty pool tokens 
		function _calculateBalance(uint256 _entityAllowance, uint256 _periodPool) public pure returns (uint256 allowance){
				uint256 stepCalculation = _entityAllowance.mul(_periodPool);
				return stepCalculation.div(100);
		}
}
