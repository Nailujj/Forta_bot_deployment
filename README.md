# Bot Function Call Detection

## Description

This bot detects specific function calls made by a known `deployer` address. It monitors transactions for
`Create Agent`, `Update Agent`, and `Disable Agent` function calls.

## Supported Chains

- Polygon
- Any other EVM-compatible chains

## Alerts

### FORTA-CREATE
- **Description**: Fired when a transaction contains a Create Agent function call by the deployer address.
- **Severity**: Low.
- **Type**: "info".
- **Metadata**:
  - `txHash`: The hash of the transaction.
  - `from`: The address that sent the transaction.
  - `to`: The address that received the transaction.
  - `data`: The input data of the transaction.

### FORTA-UPDATE
- **Description**: Fired when a transaction contains an Update Agent function call by the deployer address.
- **Severity**: Low.
- **Type**: "info".
- **Metadata**:
  - `txHash`: The hash of the transaction.
  - `from`: The address that sent the transaction.
  - `to`: The address that received the transaction.
  - `data`: The input data of the transaction.

### FORTA-DISABLE
- **Description**: Fired when a transaction contains a Disable Agent function call by the deployer address.
- **Severity**: Low.
- **Type**: "info".
- **Metadata**:
  - `txHash`: The hash of the transaction.
  - `from`: The address that sent the transaction.
  - `to`: The address that received the transaction.
  - `data`: The input data of the transaction.

## Test Data

The bot behaviour can be verified with the following transactions:

- Create Agent function call example: 0x6a72649c16d5246a207abdef78c8ce2148ed67c6c8a672bdac85e4c6ea2bdac8
- Update Agent function call example: 0x878cf23f0c3533941bc32f519a982fa294057a33ce52e8943bf03fe62ededeac
- Disable Agent function call example: 0xe028ae4fdc771946b2fbef8c989f9074f317aa069d3a9b1d53086905bac7f8b8

