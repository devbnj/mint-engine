/*
 * Copyright DevB Inc All Rights Reserved.
 * www.devb.com
 * Author: devb
 * SPDX-License-Identifier: GPL Limited
 */
'use strict'

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../../fabric/utils/CAUtil.js');
const { buildCCPOrg1, buildCCPOrg2, buildWallet } = require('../../../fabric/utils/AppUtil.js');

const path = require('path');
const channelName = 'mychannel';
const chaincodeName1 = 'basic';
const chaincodeName2 = 'token_erc721';
const mspOrg1 = 'Org1MSP';
const mspOrg2 = 'Org2MSP';
const walletPath = path.join(__dirname, 'wallet1');;
const org1UserId = 'appUser';
const minterId = 'minter';
const recId = 'recipient';

module.exports = async (fastify, opts) => {

	fastify.get('/', async (request, reply) => {
		const { greeting = 'Hello ' } = request.query;
		return reply.view(`hello.hbs`, { greeting })
	})

	fastify.post('/boot1', async (request, reply) => {
		const data = request.body['wallet'];
		
		console.log("wpath", walletPath);

		try {
			const adata = await makeAssets();
			reply.code(201)
			return { adata };
		} catch (err) {
			throw err;
		}
		
	});

	fastify.get('/getAssets', async (request, reply) => {
		const { walleter = 'wallet1' } = request.query;
		try {
			
			const data = await getAssJs();
			return reply.view(`asset.hbs`, { data });
		} catch (err) {
			if (err.message === 'not found') throw notFound()
			throw err
		}
		
	})
}

/**
 * makeAsset
 * @returns 
 */
 async function makeAssets() {
	try {
		
		const ccp1 = buildCCPOrg1();
		const caClient1 = buildCAClient(FabricCAServices, ccp1, 'ca.org1.example.com');
		const wallet = await buildWallet(Wallets, walletPath);

		await enrollAdmin(caClient1, wallet, mspOrg1);
		await registerAndEnrollUser(caClient1, wallet, mspOrg1, org1UserId, 'org1.department1');
		await registerAndEnrollUser(caClient1, wallet, mspOrg1, minterId, 'org1.department1');

		
		const ccp2 = buildCCPOrg2();
		const caClient2 = buildCAClient(FabricCAServices, ccp2, 'ca.org2.example.com');
		await registerAndEnrollUser(caClient2, wallet, mspOrg2, recId, 'org2.department1');

		
		const gateway = new Gateway();

		try {
			await gateway.connect(ccp1, {
				wallet,
				identity: org1UserId,
				discovery: { enabled: true, asLocalhost: true }
			});

			
			const network = await gateway.getNetwork(channelName);

			let contract = network.getContract(chaincodeName1);
			console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of assets on the ledger');
			await contract.submitTransaction('InitLedger');
			console.log('*** Result: committed');

			console.log('\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger');
			let result = await contract.evaluateTransaction('GetAllAssets');
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);

			console.log('\n--> Submit Transaction: CreateAsset, creates new asset with ID, color, owner, size, and appraisedValue arguments');
			result = await contract.submitTransaction('CreateAsset', 'asset13', 'yellow', '5', 'Tom', '1300');
			console.log('*** Result: committed');
			if (`${result}` !== '') {
				console.log(`*** Result: ${prettyJSONString(result.toString())}`);
			}

			console.log('\n--> Evaluate Transaction: ReadAsset, function returns an asset with a given assetID');
			result = await contract.evaluateTransaction('ReadAsset', 'asset13');
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);

			console.log('\n--> Evaluate Transaction: AssetExists, function returns "true" if an asset with given assetID exist');
			result = await contract.evaluateTransaction('AssetExists', 'asset1');
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);

			console.log('\n--> Submit Transaction: UpdateAsset asset1, change the appraisedValue to 350');
			await contract.submitTransaction('UpdateAsset', 'asset1', 'blue', '5', 'Tomoko', '350');
			console.log('*** Result: committed');

			console.log('\n--> Evaluate Transaction: ReadAsset, function returns "asset1" attributes');
			result = await contract.evaluateTransaction('ReadAsset', 'asset1');
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);

			console.log('\n--> Submit Transaction: TransferAsset asset1, transfer to new owner of Tom');
			await contract.submitTransaction('TransferAsset', 'asset1', 'Tom');
			console.log('*** Result: committed');

			console.log('\n--> Evaluate Transaction: ReadAsset, function returns "asset1" attributes');
			result = await contract.evaluateTransaction('ReadAsset', 'asset1');
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);
			
			contract = network.getContract(chaincodeName2);
			try {
				console.log('\n--> Submit Transaction: MintWithTokenURI, Mints a Token');
				result = await contract.submitTransaction('MintWithTokenURI', '101', 'https://example.com/nft101.json');
				console.log('******** MintWithTokenURI FAILED to return an error');
				if (`${result}` !== '') {
					console.log(`*** Result: ${prettyJSONString(result.toString())}`);
				}
				} catch (error) {
				console.log(`*** Successfully caught the error: \n    ${error}`);
			}

			console.log('\n--> Evaluate Transaction: ClientAccountBalance, function ClientAccountBalance');
			result = await contract.evaluateTransaction('ClientAccountBalance');
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);

		} finally {
			gateway.disconnect();
		}
	} catch (error) {
		console.error(`******** FAILED to run: ${error}`);
	}
}

/**
 * getAssJs
 * @returns 
 */
async function getAssJs() {
	const ccp = buildCCPOrg1();
	const gateway = new Gateway();
	const wallet = await buildWallet(Wallets, walletPath);
	await gateway.connect(ccp, {
		wallet,
		identity: org1UserId,
		discovery: { enabled: true, asLocalhost: true } 
	});
	const network = await gateway.getNetwork(channelName);
	const contract = network.getContract(chaincodeName1);
	console.log('\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger');
	let result = await contract.evaluateTransaction('GetAllAssets');
	return result.toString();
}

function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}