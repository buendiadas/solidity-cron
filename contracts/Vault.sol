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


contract Vault is Ownable {
	using SafeMath for uint256;

	event Transfer(uint256 indexed id, address indexed token, address indexed to, uint256 amount);
	event Deposit(uint256 indexed id, address indexed token, address indexed sender, uint256 amount);

	mapping (uint256 => mapping (address => uint256)) vaultBalance;
	
	mapping (uint256 => mapping (address => uint256)) vaultClosingValues;

	address balanceContractAddress;    
  

	/**
    * @dev Sets the address of the Bank smart-contract, so that transfers can be authorized
    * @param _balanceContractAddress Bank smart-contract address
    **/

	function setBankContractAddress(address _balanceContractAddress) external {
		require(msg.sender == owner(), "only owner can set the contract address");

		balanceContractAddress = _balanceContractAddress;
	}

	/**
	* @dev Close the vault for `_token` the vault `_period`
	* @param _vaultID ID of the vault where tokens are being deposited
	* @param _token Address of the token being transferred
	*/

	function close(uint256 _vaultID, address _token) external{
		require(msg.sender == owner(), "Only the owner can close the vault");
		vaultClosingValues[_vaultID][_token] = vaultBalance[_vaultID][_token];
	}

	/**
	* @dev Checks the vault is closed
	* @param _vaultID ID of the vault where tokens are being deposited
	* @param _token Address of the token being transferred
	*/

	modifier vaultIsClosed(uint256 _vaultID, address _token){
		require(vaultClosingValues[_vaultID][_token] > 0,"The vault is not closed");
		_;
	}
   
   /**
	* @dev Checks the vault is open
	* @param _vaultID ID of the vault where tokens are being deposited
	* @param _token Address of the token being transferred
	*/

	modifier vaultIsOpen(uint256 _vaultID, address _token){
		require(vaultClosingValues[_vaultID][_token] == 0,"The vault is not open");
		_;
	}


	/**
	* @dev Deposit `_value` `_token` to the vault
	* @param _vaultID ID of the vault where tokens are being deposited
	* @param _token Address of the token being transferred
	* @param _from Entity that currently owns the tokens
	* @param _value Amount of tokens being transferred
	*/

	function deposit(uint256 _vaultID, address _token, address _from, uint256 _value) external 
	vaultIsOpen(_vaultID, _token)
	{
		_deposit(_vaultID, _token, _from, _value);
	}

	/**
	* @dev Transfer `_value` `_token` from the Vault to `_to`
	* @param _vaultID ID of the vault where tokens are being tranferred
	* @param _token Address of the token being transferred
	* @param _to Address of the recipient of tokens
	* @param _value Amount of tokens being transferred
	*/

	function transfer(uint256 _vaultID, address _token, address _to, uint256 _value)
		external vaultIsClosed(_vaultID, _token)
	{
		require(msg.sender == owner() || msg.sender == balanceContractAddress, "Not authorized to transfer");
		_transfer(_vaultID, _token, _to, _value);
	}

	/**
	* @dev Returns balance given a `_vaultID`
	* @param _vaultID Identifier of the vault where the tokens have been deposited
	* @param _token Adress of the ERC20 token
	*/

	function balance(uint256 _vaultID, address _token) public view returns (uint256) {
		return vaultBalance[_vaultID][_token];
	}

	/**
	* @dev Returns bounty pool amount given a `_vaultID`
	* @param _vaultID Identifier of the vault where the tokens have been deposited
	* @param _token Adress of the ERC20 token
	*/

	function bountyPoolAmount(uint256 _vaultID, address _token) public view returns (uint256) {
		return vaultClosingValues[_vaultID][_token];
	}

 

	function _deposit(uint256 _vaultID, address _token, address _from, uint256 _value) internal {
		require(_value != 0);
		// todo: remove require(msg.sender == _from); the transfer was approved before
		require(msg.sender == _from);
		require(ERC20(_token).transferFrom(_from, this, _value));
		vaultBalance[_vaultID][_token] = vaultBalance[_vaultID][_token].add(_value);
		emit Deposit(_vaultID, _token, _from, _value);
	}

	function _transfer(uint256 _vaultID, address _token, address _to, uint256 _value) internal {
		require(_value > 0);
		require(ERC20(_token).transfer(_to, _value));
		vaultBalance[_vaultID][_token] = vaultBalance[_vaultID][_token].sub(_value);
		emit Transfer(_vaultID, _token, _to, _value);
	}
}
