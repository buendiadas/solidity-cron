pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "../Bank.sol";
import "../Vault.sol";
import "./IFeeEntity.sol";

contract helenaAgent is Ownable, IFeeEntity {

  using SafeMath for uint256;


  mapping (address => mapping(address => bool)) allowedReceivers; 

  address vaultAddress;
  address balanceAddress;


  Bank BankInstance;
  Vault VaultInstance;

  constructor (address _vaultAddress, address _balanceAddress){   
    BankInstance = Bank(_balanceAddress);
    VaultInstance = Vault(_vaultAddress);
  }

  /**
  * @dev Calculates the amount that the receiver should receive.
  * @param _entityBalance Balance of the entity
  * @param _epoch Period for which the value is to be calculated
  * @param _token Token for which the value is to be calculated
  * @param _receiver Receiver for which the value is to be calculated
  */

  function calculatePaymentAmount(uint256 _entityBalance, uint256 _epoch, address _token, address _receiver) returns (uint256 amount){
    // In the case of HelenaFee, it returns the full balance
    // Helena only needs to send the tokens to one account,
    // Because there is no one to share it with.
    return _entityBalance;
  }

  /**
  * @dev Adds a new authorized receiver for transfers made by this entity
  * @param _destination Address of the receiver
  * @param _token Token for which the transfers are authorized
  */

  function addAllowedReceiver(address _destination, address _token) external{
    require(msg.sender == owner());

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
  {
    require(allowedReceivers[_destination][_token]);

    uint256 entityBalance = BankInstance.getBalance(address(this), _token, _epoch);
    uint256 paymentAmount = calculatePaymentAmount(entityBalance, _epoch, _token, _destination);
    BankInstance.makePayment(address(this), _destination, _token, entityBalance, _epoch);
    emit collectedPayment(_destination, _token, _epoch, paymentAmount);
  }
}
