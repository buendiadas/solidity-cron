pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "@frontier-token-research/role-registries/contracts/OwnedRegistry.sol";
import "@frontier-token-research/role-registries/contracts/Registry.sol";
import "../Bank.sol";
import "../Vault.sol";
import "../TRLInterface.sol";
import "./IFeeEntity.sol";

contract MainSalaryEntity is Ownable, IFeeEntity {

  using SafeMath for uint256;

/*
TODOS

- make the whitelisted verification direclty on the owned registry contract
- create function to close trl for period, and then getting the total number of votes cast on that period
- create function to calculate the compensation for each user.
*/

  address vaultAddress;
  address balanceAddress;

  Bank BankInstance;
  Vault VaultInstance;
  OwnedRegistry candidateRegistry;
  TRLInterface TRLInstance;

  // New storage

  mapping (uint256 => mapping(address => uint256)) salaryAmountPerPeriod;

  //        epoch            user               token        paid
  mapping (uint256=> mapping(address => mapping(address => bool))) paidUsers;
  //        epoch            user               token        amount
  mapping (uint256=> mapping(address => mapping(address => uint256))) salaryAmountPerEpochPerUser;

  constructor (address _vaultAddress, address _balanceAddress, address _trlAddress){   
    BankInstance = Bank(_balanceAddress);
    VaultInstance = Vault(_vaultAddress);
    TRLInstance = TRLInterface(_trlAddress);
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
    return salaryAmountPerEpochPerUser[_epoch][_receiver][_token];
  }

  function height() public view returns (uint256) {
    return 0;
  }

  /**
  * @dev Triggers the payment to a receiver. 
  * @param _destination Address of the receiver
  * @param _token Token for which the transfer is being triggered
  * @param _epoch Period for which the transfer is being triggered
  */
  
  function collectPayment(address _destination, address _token, uint256 _epoch) 
  external
  { 
    // set a deadline for collecting, like 12 epochs 
    require(_epoch < height());

    // modify the TRLInstance.votesReceived function

    // check user is an allowed receiver
    //require(allowedReceivers[_destination][_token]);
    require(candidateRegistry.wasWhitelisted(_destination,_epoch));

    // check that user has not been paid yet
    require(!paidUsers[_epoch][_destination][_token]);
    // check if the salary has been calculated for this epoch and token
    if(salaryAmountPerPeriod[_epoch][_token] == 0){
        // Get the basic salary entity allowance 
        uint256 entityBalance = BankInstance.getStartingBalance(address(this), _token, _epoch);
        calculateMainSalaryForEpochForUser(_epoch, _token, entityBalance);
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

  function calculateMainSalaryForEpochForUser(uint256 _epoch, address _token, uint256 _entityBalance) public {
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
