'use strict';

const { Context } = require('fabric-contract-api');
const { ChaincodeStub, ClientIdentity } = require('fabric-shim');

const { TokenERC20Contract } = require('chaincode-javascript/');

const path = require('path');
const channelName = 'mychannel';
const chaincodeName = 'basic';
const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet1');
const org1UserId = 'appUser';

let token = new TokenERC20Contract('token-erc20');