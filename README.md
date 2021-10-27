# Mint-Engine

## stop the network, set up a channel and deploy chaincode
```
cd fabric/network
./network.sh down
./network.sh up createChannel -c mychannel -ca
./network.sh deployCC -ccn basic -ccp ../asset-transfer/ -ccl javascript
./network.sh deployCC -ccn token_erc721 -ccp ../token-erc-721/chaincode-javascript/ -ccl javascript
./network.sh deployCC -ccn token_erc20 -ccp ../token-erc-20/ -ccl javascript
```
## different terminal
docker logs -f ca_org1

## third terminal
```
cd server
npm start
```

## fourth terminal
node -e "http.request('http://localhost:3000/nft/boot1', { method: 'post', headers: {'content-type': 'application/json'}}, (res) => res.setEncoding('utf8').once('data', console.log.bind(null, res.statusCode))).end(JSON.stringify({'wallet': 'wallet2'}))"
