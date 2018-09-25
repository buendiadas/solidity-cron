pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";

/**
* A Smart contract including multiple Vaults identifiable by ID
* Inspired by AragonOS Vault https://github.com/aragon/aragon-apps/blob/master/apps/vault/contracts/Vault.sol
*/


contract Vault is Ownable {
    using SafeMath for uint256;

    event Transfer(uint256 indexed id, address indexed token, address indexed to, uint256 amount);
    event Deposit(uint256 indexed id, address indexed token, address indexed sender, uint256 amount);

    mapping (uint256 => mapping (address => uint256)) vaultBalance;


    /**
    * @dev Deposit `_value` `_token` to the vault
    * @param _vaultID ID of the vault where tokens are being deposited
    * @param _token Address of the token being transferred
    * @param _from Entity that currently owns the tokens
    * @param _value Amount of tokens being transferred
    */

    function deposit(uint256 _vaultID, address _token, address _from, uint256 _value) external {
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
        external
    {
        require(msg.sender == owner);
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

    function _deposit(uint256 _vaultID, address _token, address _from, uint256 _value) internal {
        require(_value > 0);
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