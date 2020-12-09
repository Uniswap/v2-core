const MockUniERC20 = artifacts.require('MockUniERC20');
const TestToken = artifacts.require('TestToken');

const {expectRevert, constants} = require('@openzeppelin/test-helpers');
const BN = web3.utils.BN;

const Helper = require('./../helper');

let token;
let mockUniERC20;
let target;

contract('UniERC20', accounts => {
  before('init', async () => {
    mockUniERC20 = await MockUniERC20.new();
    token = await TestToken.new('test token', 'tk', Helper.expandTo18Decimals(100000));
    target = accounts[1];
  });

  it('transfer', async () => {
    let transferAmount = Helper.expandTo18Decimals(3);
    await token.transfer(mockUniERC20.address, transferAmount);
    let beforeBalance = await token.balanceOf(target);
    await mockUniERC20.testTransfer(token.address, target, transferAmount);
    Helper.assertEqual(await token.balanceOf(target), beforeBalance.add(transferAmount));
  });

  it('transferETH', async () => {
    let transferAmount = Helper.expandTo18Decimals(3);
    await Helper.sendEtherWithPromise(accounts[0], mockUniERC20.address, transferAmount);
    let beforeBalance = await Helper.getBalancePromise(target);
    // revert if transfer eth failed
    await expectRevert(
      mockUniERC20.testTransfer(Helper.ethAddress, token.address, transferAmount),
      'UniERC20: failed to transfer eth to target'
    );
    // transfer successful
    await mockUniERC20.testTransfer(Helper.ethAddress, target, transferAmount);
    Helper.assertEqual(await Helper.getBalancePromise(target), beforeBalance.add(transferAmount));
  });

  it('approve', async () => {
    let approveAmount = Helper.expandTo18Decimals(100);
    await mockUniERC20.testApprove(token.address, target, approveAmount);
    Helper.assertEqual(await token.allowance(mockUniERC20.address, target), approveAmount);
    // test approve not change allowance
    await mockUniERC20.testApprove(token.address, target, approveAmount);
    // test change approve
    await mockUniERC20.testApprove(token.address, target, approveAmount.mul(new BN(2)));
    // test remove approve
    await mockUniERC20.testApprove(token.address, target, new BN(0));
  });

  it('approve eth - do nothing', async () => {
    await mockUniERC20.testApprove(Helper.ethAddress, target, Helper.expandTo18Decimals(1));
  });

  it('transferFromSender', async () => {
    await token.approve(mockUniERC20.address, Helper.expandTo18Decimals(100000));

    let transferAmount = Helper.expandTo18Decimals(7);
    let beforeBalance = await token.balanceOf(target);
    await mockUniERC20.testTransferFromSender(token.address, target, transferAmount);
    Helper.assertEqual(await token.balanceOf(target), beforeBalance.add(transferAmount));
    // transfer with zero amount - early return
    await mockUniERC20.testTransferFromSender(token.address, target, new BN(0));
  });

  it('transferFromSender eth', async () => {
    let transferAmount = Helper.expandTo18Decimals(7);
    let beforeBalance = await Helper.getBalancePromise(target);
    // if msg.value < transferAmount -> revert
    await expectRevert(
      mockUniERC20.testTransferFromSender(Helper.ethAddress, target, transferAmount, {
        value: transferAmount.sub(new BN(1))
      }),
      'UniERC20: not enough value'
    );

    // test amount should be transfer back
    await mockUniERC20.testTransferFromSender(Helper.ethAddress, target, transferAmount, {
      value: transferAmount.add(new BN(1))
    });
    Helper.assertEqual(await Helper.getBalancePromise(target), beforeBalance.add(transferAmount));
    // transfer with zero amount - early return
    await mockUniERC20.testTransferFromSender(token.address, target, new BN(0));
    // transfer from to this address
    await mockUniERC20.testTransferFromSender(token.address, mockUniERC20.address, transferAmount, {value: transferAmount});
  });

  it('decimals', async () => {
    Helper.assertEqual(await mockUniERC20.testDecimals(Helper.ethAddress), new BN(18));
    Helper.assertEqual(await mockUniERC20.testDecimals(token.address), new BN(18));
  });
});
