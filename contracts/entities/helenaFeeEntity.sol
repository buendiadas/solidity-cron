pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "../Balance.sol";
import "../Vault.sol";

contract helenaAgent is Ownable {

    using SafeMath for uint256;


    mapping (address => mapping(address => bool)) allowedReceivers; 
    /**
    the helena fee is defined in the allowance contract. We need to 
    add the address of this contract in allowance.
    The first step here should be to execute the function to calculat
    e the balance of this agent.
    Then there should be a function to transfer this entity's funds 
    to an account

    */
   address vaultAddress;
   address balanceAddress;

   TRL TRLInstance;
   Balance BalanceInstance;
   Vault VaultInstance;

   constructor (address _vaultAddress, address _TRLAddress, 
    address _balanceAddress)
    {   
        TRLInstance = TRL(_TRLAddress);
        BalanceInstance = Balance(_balanceAddress);
        VaultInstance = Vault(_vaultAddress);
    }

   function addAllowedReceiver(address _receiver, address _token) external{
        require(msg.sender == owner());
        
        allowedReceivers[_receiver][_token] = true;
   }
    // todo: change the vaultID variable name to period
   function collectPayment(address _destination, address _token, uint256 _period) 
   external
   {
        require(allowedReceivers[_destination][_token]);
        // todo: add checks:
        //      check vault has been closed for period
        //      check that balance has been calculated before
        uint256 entityBalance = BalanceInstance.getBalance(address(this), _token, _period);
       // calculate the specific _destination value; 1 token; send 1 token 
        BalanceInstance.makePayment(address(this), _token, _destination, entityBalance, _period);
//      Vault.transfer(_receiver, entityBalance);
   }
}


/*
Comments:
    - Adding events
    - Fix the identations
    - Get better names for allowance and balance, make it more specific

*/









