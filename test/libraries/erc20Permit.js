const ERC20Permit = artifacts.require('MockERC20Permit');

const BN = web3.utils.BN;
const {ecsign} = require('ethereumjs-util');
const Helper = require('./../helper');
const {expectEvent, expectRevert} = require('@openzeppelin/test-helpers');

let token;
let spender;
let owner;
let ownerPkKey;

contract('ERC20Permit', accounts => {
  before('init account', async () => {
    spender = accounts[2];
    owner = accounts[3];
    // key from hardhat.config.js
    ownerPkKey = '0xee9d129c1997549ee09c0757af5939b2483d80ad649a0eda68e8b0357ad11131';
    otherPkKey = '0x8b24fd94f1ce869d81a34b95351e7f97b2cd88a891d5c00abc33d0ec9501902e';

    token = await ERC20Permit.new('test', 'tst', '1', new BN(10).pow(new BN(27)));
  });

  it('permit', async () => {
    const nonce = await token.nonces(owner);
    let deadline = Helper.MaxUint256;
    const amount = new BN(10).pow(new BN(18));
    const digest = await Helper.getApprovalDigest(token, owner, spender, amount, nonce, deadline);
    // approve should revert for invalid signature
    let signature = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(otherPkKey.slice(2), 'hex'));
    await expectRevert(
      token.permit(owner, spender, amount, deadline, signature.v, signature.r, signature.s),
      'ERC20Permit: INVALID_SIGNATURE'
    );
    // revert if over deadline
    let expiredTimeStamp = (await Helper.getCurrentBlockTime()) - 1;
    const expiredDigest = await Helper.getApprovalDigest(token, owner, spender, amount, nonce, expiredTimeStamp);
    signature = ecsign(Buffer.from(expiredDigest.slice(2), 'hex'), Buffer.from(ownerPkKey.slice(2), 'hex'));
    await expectRevert(
      token.permit(owner, spender, amount, expiredTimeStamp, signature.v, signature.r, signature.s),
      'ERC20Permit: EXPIRED'
    );
    // valid permit call
    signature = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(ownerPkKey.slice(2), 'hex'));
    let txResult = await token.permit(owner, spender, amount, deadline, signature.v, signature.r, signature.s);
    await expectEvent(txResult, 'Approval');
    Helper.assertEqual(await token.nonces(owner), new BN(nonce).add(new BN(1)), 'nonce is mismatch');
    Helper.assertEqual(await token.allowance(owner, spender), amount, 'token amount is mismatch');
  });
});
