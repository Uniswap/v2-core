const truffleAssert = require('truffle-assertions');
const abi = require('ethereumjs-abi');
const ethers = require('ethers');
var path = require('path');
var fs = require('fs');

const UniswapV2Factory = artifacts.require("UniswapV2Factory");
const IUniswapV2Pair = artifacts.require("IUniswapV2Pair");
// import '../build/UniswapV2Pair.json'

const MT001 = "0x1000000000000000000000000000000000000000";
const MT002 = "0x2000000000000000000000000000000000000000";
let uniswapV2Factory;

contract('Factory', (accounts) => {
  // beforeEach(async () => {
    // console.log(accounts[0]);
    // var balance = await web3.eth.getBalance(accounts[0]);
    // console.log(balance/1e18);
  // });

  it('init', async () => {
   // newchain devnet环境
    // UniswapV2Factory = await UniswapV2Factory.at("");
    uniswapV2Factory = await UniswapV2Factory.deployed();

    var feeTo = await uniswapV2Factory.feeTo.call();
    assert.equal(feeTo, "0x0000000000000000000000000000000000000000");
    var feeToSetter = await uniswapV2Factory.feeToSetter.call();
    assert.equal(feeToSetter, accounts[0]);
    var allPairsLength = await uniswapV2Factory.allPairsLength.call();
    assert.equal(allPairsLength, 0);
  });

  it('createPair', async () => {
    var file = path.join(__dirname, '../build/contracts/UniswapV2Pair.json');
    const bytecode = JSON.parse(fs.readFileSync(file)).bytecode;
    assert.equal(ethers.utils.keccak256(bytecode),'0x9e412b0c43545320c5ffd072573387d3d24b01790dea161731c0e56efd7a76a2');
    const create2Inputs = [
      '0xff',
      uniswapV2Factory.address,
      ethers.utils.keccak256(ethers.utils.solidityPack(['address', 'address'], [MT001, MT002])),
      ethers.utils.keccak256(bytecode)
    ];
    const sanitizedInputs = `0x${create2Inputs.map(i => i.slice(2)).join('')}`
    const getPairAddress = ethers.utils.getAddress(`0x${ethers.utils.keccak256(sanitizedInputs).slice(-40)}`);
    // console.log(getPairAddress);

    // 为MT001和MT002创建交易对
    var tx = await uniswapV2Factory.createPair(MT001, MT002);
    // console.log(tx);
    // console.log(tx.logs);
    var eventPairCreated= '0x' + abi.soliditySHA3(['string'], ["PairCreated(address,address,address,uint256)"]).toString("hex");
    // console.log(eventPairCreated);
    var log = tx.receipt.rawLogs.find(element => element.topics[0].match(eventPairCreated));
    // console.log(log);
    var data = web3.eth.abi.decodeParameters(["address","uint256"],log.data);
    // console.log(data);  
    assert.equal(data[0], getPairAddress);
   
    var mt001And002PairAddress = await uniswapV2Factory.getPair(MT001, MT002);
    assert.equal(mt001And002PairAddress, getPairAddress);

    var uniswapV2Pair = await IUniswapV2Pair.at(mt001And002PairAddress);
    const factory = await uniswapV2Pair.factory();
    assert.equal(factory, uniswapV2Factory.address);
    const token0 = await uniswapV2Pair.token0();
    assert.equal(token0, MT001);
    const token1 = await uniswapV2Pair.token1();
    assert.equal(token1, MT002);
    const reserves = await uniswapV2Pair.getReserves();
    assert.equal(Number(reserves[0]), 0);
    assert.equal(Number(reserves[1]), 0);
  });

});















