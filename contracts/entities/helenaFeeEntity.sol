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

  function calculatePaymentAmount(uint256 _entityBalance, uint256 _period, address _token, address _receiver) returns (uint256 amount){
    // In the case of HelenaFee, it returns the full balance
    // Helena only needs to send the tokens to one account,
    // Because there is no one to share it with.
    return _entityBalance;
  }

  function addAllowedReceiver(address _destination, address _token) external{
    require(msg.sender == owner());

    allowedReceivers[_destination][_token] = true;
    emit addedAllowedReceiver(_destination, _token);
  }

  function collectPayment(address _destination, address _token, uint256 _period) 
  external
  {
    require(allowedReceivers[_destination][_token]);

    uint256 entityBalance = BankInstance.getBalance(address(this), _token, _period);
    uint256 paymentAmount = calculatePaymentAmount(entityBalance, _period, _token, _destination);
    BankInstance.makePayment(address(this), _destination, _token, entityBalance, _period);
    collectedPayment(_destination, _token, _period, paymentAmount);
  }
}


/*
Comments:
    - ~~Adding events~~
    - Get better names for allowance and balance, make it more specific

    */









