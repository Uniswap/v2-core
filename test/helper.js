const BN = web3.utils.BN;
const MINIMUM_LIQUIDITY = new BN(10).pow(new BN(3));

const precisionUnits = new BN(10).pow(new BN(18));
const zeroBN = new BN(0);
const ethAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bn')(BN))
  .should();

module.exports = {precisionUnits, assertEqual, assertApproximate, zeroBN, ethAddress, MINIMUM_LIQUIDITY};

function assertEqual (val1, val2, errorStr) {
  assert(new BN(val1).should.be.a.bignumber.that.equals(new BN(val2)), errorStr);
}

function assertApproximate (val1, val2, errorStr) {
  if (new BN(val1).gt(new BN(val2))) {
    assert(
      new BN(val1).sub(new BN(val2)).should.be.a.bignumber.that.lessThan(new BN(val1).div(new BN(10000))),
      errorStr
    );
  } else {
    assert(
      new BN(val2).sub(new BN(val1)).should.be.a.bignumber.that.lessThan(new BN(val2).div(new BN(10000))),
      errorStr
    );
  }
}

module.exports.getCurrentBlock = function () {
  return new Promise(function (fulfill, reject) {
    web3.eth.getBlockNumber(function (err, result) {
      if (err) reject(err);
      else fulfill(result);
    });
  });
};

module.exports.getCurrentBlockTime = function () {
  return new Promise(function (fulfill, reject) {
    web3.eth.getBlock('latest', false, function (err, result) {
      if (err) reject(err);
      else fulfill(result.timestamp);
    });
  });
};

module.exports.getCreate2Address = function (deployer, salt, bytecodeHash) {
  return web3.utils.soliditySha3('0xff' + deployer.slice(2) + salt.slice(2) + bytecodeHash.slice(2));
};

module.exports.expandTo18Decimals = function (n) {
  return new BN(n).mul(new BN(10).pow(new BN(18)));
};

module.exports.mineNewBlockAt = async function (timestamp) {
  return new Promise((resolve, reject) => {
    web3.currentProvider.send.bind(web3.currentProvider)(
      {
        jsonrpc: '2.0',
        method: 'evm_mine',
        params: [timestamp],
        id: new Date().getTime()
      },
      (err, res) => {
        if (err) {
          return reject(err);
        }
        resolve(res);
      }
    );
  });
};

module.exports.sqrt = function (y) {
  if (y.gt(new BN(3))) {
    let z = new BN(y);
    let x = y.div(new BN(2)).add(new BN(1));
    while (x.lt(z)) {
      z = new BN(x);
      x = y
        .div(x)
        .add(x)
        .div(new BN(2));
    }
    return z;
  } else if (y.eq(0)) {
    return new BN(1);
  }
  return new BN(0);
};

module.exports.getBalancePromise = function (account) {
  return new Promise(function (fulfill, reject) {
    web3.eth.getBalance(account, function (err, result) {
      if (err) reject(err);
      else fulfill(new BN(result));
    });
  });
};

module.exports.sendEtherWithPromise = function (sender, recv, amount) {
  return new Promise(function (fulfill, reject) {
    web3.eth.sendTransaction({to: recv, from: sender, value: amount}, function (error, result) {
      if (error) {
        return reject(error);
      } else {
        return fulfill(true);
      }
    });
  });
};
