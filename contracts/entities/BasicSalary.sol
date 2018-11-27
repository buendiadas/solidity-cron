pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "@frontier-token-research/role-registries/contracts/OwnedRegistry.sol";
import "@frontier-token-research/role-registries/contracts/Registry.sol"; 
import "../Bank.sol";
import "../Vault.sol";
import "./IFeeEntity.sol";

contract BasicSalaryEntity is Ownable, IFeeEntity {

  using SafeMath for uint256;


  mapping (address => mapping(address => bool)) allowedReceivers;

  address vaultAddress;
  address balanceAddress;


  Bank BankInstance;
  Vault VaultInstance;
  OwnedRegistry candidateRegistry;

  // New storage

  mapping (uint256 => mapping(address => uint256)) salaryAmountPerPeriod;

  //        period            user               token        paid
  mapping (uint256=> mapping(address => mapping(address => bool))) paidUsers;

  constructor (address _vaultAddress, address _balanceAddress){   
    BankInstance = Bank(_balanceAddress);
    VaultInstance = Vault(_vaultAddress);
  }

  function setCandidateRegistry(address _candidateRegistryAddress) external {
    require(msg.sender == owner(), "Only the owner can call setCandidateRegistry");
    candidateRegistry = OwnedRegistry(_candidateRegistryAddress);
  }

  /**
  * @dev Calculates the amount that the receiver should receive.
  * @param _entityBalance Balance of the entity
  * @param _epoch Period for which the value is to be calculated
  * @param _token Token for which the value is to be calculated
  * @param _receiver Receiver for which the value is to be calculated
  */

  function calculatePaymentAmount(uint256 _entityBalance, uint256 _epoch, address _token, address _receiver) public returns (uint256 amount){
    // shim function to implement the interface
    return salaryAmountPerPeriod[_epoch][_token];
  }

  /**
  * @dev Adds a new authorized receiver for transfers made by this entity
  * @param _destination Address of the receiver
  * @param _token Token for which the transfers are authorized
  */

  function addAllowedReceiver(address _destination, address _token) external{
    require(msg.sender == owner(), "can only be called by the owner");

    allowedReceivers[_destination][_token] = true;
    emit addedAllowedReceiver(_destination, _token);
  }

  /**
  * @dev Triggers the payment to a receiver. 
  * @param _destination Address of the receiver
  * @param _token Token for which the transfer is being triggered
  * @param _epoch Period for which the transfer is being triggered
  */
  function collectPayment(address _destination, address _token, uint256 _epoch) 
  external
  { // check user is an allowed receiver
    require(allowedReceivers[_destination][_token]);
    // check that user has not been paid yet
    require(!paidUsers[_epoch][_destination][_token]);
    // check if the salary has been calculated for this epoch and token
    if(salaryAmountPerPeriod[_epoch][_token] == 0){
        // Get the basic salary entity allowance 
        uint256 entityBalance = BankInstance.getStartingBalance(address(this), _token, _epoch);
        calculateBasicSalaryForPeriod(_epoch, _token, entityBalance);
    }

	// Calculate how much the user should receive
    uint256 paymentAmount = calculatePaymentAmount(entityBalance, _epoch, _token, _destination);
    // Transfer the funds, through the Bank contract
    BankInstance.makePayment(address(this), _destination, _token, paymentAmount, _epoch);
    // Update the user as having been paid
    paidUsers[_epoch][_destination][_token] = true;
    // emit event that the payment has been collected
    emit collectedPayment(_destination, _token, _epoch, paymentAmount);
  }

  function calculateBasicSalaryForPeriod(uint256 _epoch, address _token, uint256 _entityBalance) public {
  	// it has to be onlyOwner because we have no way of getting the list of users for a given period
   // the only alternative would be to only allow this value to be calculated for the "current period".
   // TODO: generalize role-registry to keep track of list members per period
   require(msg.sender == owner(), "can only be called by the owner");
   
   // we can remove the require owner if we index the candidates by epoch
   uint256 numberOfCandidates = candidateRegistry.listingCounter();

   uint256 basicSalaryForPeriod = _entityBalance.div(numberOfCandidates);
   salaryAmountPerPeriod[_epoch][_token] = basicSalaryForPeriod;
 }
}
