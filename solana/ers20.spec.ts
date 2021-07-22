import { Keypair, PublicKey } from '@solana/web3.js';
import expect from 'expect';
import { establishConnection, Contract, TestConnection, createProgramAddress } from './index';
import { BigNumber, utils } from 'ethers';
import { Key } from 'readline';

const AddressZero = '0x0000000000000000000000000000000000000000000000000000000000000000';

const TEST_ADDRESSES: [string, string] = [
    '0x1000000000000000000000000000000000000000000000000000000000000000',
    '0x2000000000000000000000000000000000000000000000000000000000000000'
];

export function expandTo18Decimals(n: number): BigNumber {
    return BigNumber.from(n).mul(BigNumber.from(10).pow(18))
}

const TOTAL_SUPPLY = expandTo18Decimals(10000)
const TEST_AMOUNT = expandTo18Decimals(10)

export async function getCreate2Address(
    programId: PublicKey,
    factoryAddress: string,
    [tokenA, tokenB]: [string, string],
): Promise<any> {
    const [token0, token1] = tokenA < tokenB ? [tokenA, tokenB] : [tokenB, tokenA]
    let buf = Buffer.concat([
        Buffer.from(factoryAddress.replace('0x', '')),
        Buffer.from(token0.replace('0x', '')),
        Buffer.from(token1.replace('0x', '')),
    ]);

    const hash = Buffer.from(utils.keccak256(buf).substr(2, 18));
    return await createProgramAddress(programId, Buffer.from(hash));
}

describe('Uniswap Pair', () => {
    let con: TestConnection;
    let token: Contract;
    let wallet: string;
    let otherPair: Keypair;
    let otherAddress: string;
    let spenderPair: Keypair;
    let spenderAddress: string;

    before(async function () {
        this.timeout(50000);

        con = await establishConnection('bundle.so');

        wallet = '0x' + con.payerAccount.publicKey.toBuffer().toString('hex');

        otherPair = Keypair.generate();

        otherAddress = '0x' + otherPair.publicKey.toBuffer().toString('hex');

        spenderPair = Keypair.generate();

        spenderAddress = '0x' + spenderPair.publicKey.toBuffer().toString('hex');

        console.log('other: ' + otherAddress);
    });

    beforeEach(async function () {
        token = await con.deploy('ERC20.abi', 'ERC20', [TOTAL_SUPPLY], [], 8192);
    });

    it('name, symbol, decimals, totalSupply, balanceOf, DOMAIN_SEPARATOR, PERMIT_TYPEHASH', async () => {
        let res = await token.call('name', []);
        const name = res[0].toString();
        expect(name).toEqual('Uniswap V2');
        res = await token.call('symbol', []);
        expect(res[0].toString()).toEqual('UNI-V2');
        res = await token.call('decimals', []);
        expect(res[0]).toEqual(18);
        res = await token.call('totalSupply', []);
        expect(res[0]).toEqual(TOTAL_SUPPLY);
        res = await token.call('balanceOf', [wallet]);
        expect(res[0]).toEqual(TOTAL_SUPPLY);
    })

    // const name = await token.name()
    // expect(name).to.eq('Uniswap V2')
    // expect(await token.symbol()).to.eq('UNI-V2')
    // expect(await token.decimals()).to.eq(18)
    // expect(await token.totalSupply()).to.eq(TOTAL_SUPPLY)
    // expect(await token.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY)
    // expect(await token.DOMAIN_SEPARATOR()).to.eq(
    //     keccak256(
    //         defaultAbiCoder.encode(
    //             ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
    //             [
    //                 keccak256(
    //                     toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')
    //                 ),
    //                 keccak256(toUtf8Bytes(name)),
    //                 keccak256(toUtf8Bytes('1')),
    //                 1,
    //                 token.address
    //             ]
    //         )
    //     )
    // )
    // expect(await token.PERMIT_TYPEHASH()).to.eq(
    //     keccak256(toUtf8Bytes('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)'))
    // )


    it('approve', async () => {
        let res = await token.call('approve', [spenderAddress, TEST_AMOUNT], [], [], [], otherPair.publicKey);
        expect(res[0]).toEqual(true);
        res = await token.call('allowance', [otherAddress, spenderAddress]);
        expect(res[0]).toEqual(TEST_AMOUNT);
    })

    // it('approve', async () => {
    //     await expect(token.approve(other.address, TEST_AMOUNT))
    //       .to.emit(token, 'Approval')
    //       .withArgs(wallet.address, other.address, TEST_AMOUNT)
    //     expect(await token.allowance(wallet.address, other.address)).to.eq(TEST_AMOUNT)
    //   })

    it('transfer', async () => {
        let res = await token.call('transfer', [otherAddress, TEST_AMOUNT]);
        expect(res[0]).toEqual(true);

        res = await token.call('balanceOf', [wallet]);
        expect(res[0]).toEqual(TOTAL_SUPPLY.sub(TEST_AMOUNT));

        res = await token.call('balanceOf', [otherAddress]);
        expect(res[0]).toEqual(TEST_AMOUNT);
    })

    //   it('transfer', async () => {
    //     await expect(token.transfer(other.address, TEST_AMOUNT))
    //       .to.emit(token, 'Transfer')
    //       .withArgs(wallet.address, other.address, TEST_AMOUNT)
    //     expect(await token.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY.sub(TEST_AMOUNT))
    //     expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT)
    //   })

    //   it('transfer:fail', async () => {
    //     await expect(token.transfer(other.address, TOTAL_SUPPLY.add(1))).to.be.reverted // ds-math-sub-underflow
    //     await expect(token.connect(other).transfer(wallet.address, 1)).to.be.reverted // ds-math-sub-underflow
    //   })

    //   it('transferFrom', async () => {
    //     await token.approve(other.address, TEST_AMOUNT)
    //     await expect(token.connect(other).transferFrom(wallet.address, other.address, TEST_AMOUNT))
    //       .to.emit(token, 'Transfer')
    //       .withArgs(wallet.address, other.address, TEST_AMOUNT)
    //     expect(await token.allowance(wallet.address, other.address)).to.eq(0)
    //     expect(await token.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY.sub(TEST_AMOUNT))
    //     expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT)
    //   })

    //   it('transferFrom:max', async () => {
    //     await token.approve(other.address, MaxUint256)
    //     await expect(token.connect(other).transferFrom(wallet.address, other.address, TEST_AMOUNT))
    //       .to.emit(token, 'Transfer')
    //       .withArgs(wallet.address, other.address, TEST_AMOUNT)
    //     expect(await token.allowance(wallet.address, other.address)).to.eq(MaxUint256)
    //     expect(await token.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY.sub(TEST_AMOUNT))
    //     expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT)
    //   })

    //   it('permit', async () => {
    //     const nonce = await token.nonces(wallet.address)
    //     const deadline = MaxUint256
    //     const digest = await getApprovalDigest(
    //       token,
    //       { owner: wallet.address, spender: other.address, value: TEST_AMOUNT },
    //       nonce,
    //       deadline
    //     )

    //     const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(wallet.privateKey.slice(2), 'hex'))

    //     await expect(token.permit(wallet.address, other.address, TEST_AMOUNT, deadline, v, hexlify(r), hexlify(s)))
    //       .to.emit(token, 'Approval')
    //       .withArgs(wallet.address, other.address, TEST_AMOUNT)
    //     expect(await token.allowance(wallet.address, other.address)).to.eq(TEST_AMOUNT)
    //     expect(await token.nonces(wallet.address)).to.eq(bigNumberify(1))
    //   })
});
