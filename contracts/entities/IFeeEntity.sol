pragma solidity 0.4.24;

interface IFeeEntity {
	event collectedPayment(address indexed _destination, address indexed _token, uint256 indexed _epoch, uint256 _amount);
	event addedAllowedReceiver(address indexed _receiver, address indexed _token);
	
	function collectPayment(address _destination, address _token, uint256 _epoch) external;
	function addAllowedReceiver(address _destination, address _token) external;
	function calculatePaymentAmount(uint256 _entityBalance, uint256 _epoch, address _token, address _receiver) external returns (uint256 amount);
}
