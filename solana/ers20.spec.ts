import { Keypair, PublicKey } from '@solana/web3.js';
import expect from 'expect';
import { establishConnection, Contract, TestConnection, createProgramAddress } from './index';
import { BigNumber, utils } from 'ethers';
import nacl from 'tweetnacl';

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
    let tokenAddress: string;
    const coder = new utils.AbiCoder();

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
        token = await con.deploy('ERC20.abi', 'ERC20', [TOTAL_SUPPLY], [], 8192 * 8);
        tokenAddress = '0x' + token.contractStorageAccount.publicKey.toBuffer().toString('hex');
    });

    it('name, symbol, decimals, totalSupply, balanceOf, DOMAIN_SEPARATOR, PERMIT_TYPEHASH', async function () {
        this.timeout(500000);

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

        res = await token.call('DOMAIN_SEPARATOR', []);
        expect(res[0]).toEqual(domain_seperator('Uniswap V2'));

    })

    function domain_seperator(name: string): string {
        return utils.keccak256(coder.encode(['bytes32', 'bytes32', 'bytes32', 'uint256', 'uint256'], [
            utils.keccak256(
                utils.toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')
            ),
            utils.keccak256(utils.toUtf8Bytes(name)),
            utils.keccak256(utils.toUtf8Bytes('1')),
            1,
            tokenAddress
        ]));
    }


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

    it('permit', async () => {
        let res = await token.call('nonces', [wallet]);
        const nonce = res[0].toNumber();

        res = await token.call('DOMAIN_SEPARATOR', []);
        expect(res[0]).toEqual(domain_seperator('Uniswap V2'));

        // const nonce = await token.nonces(wallet.address)
        const deadline = BigNumber.from(2).pow(256).sub(1);
        const message = Buffer.concat([
            Uint8Array.from([0x19, 0x1]),
            Buffer.from(domain_seperator('Uniswap V2').replace('0x', ''), 'hex'),
            Buffer.from(utils.keccak256(coder.encode(
                ['bytes32', 'bytes32', 'bytes32', 'uint256', 'uint256', 'uint256'],
                ['0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9',
                    wallet, otherAddress, TEST_AMOUNT, nonce, deadline])).replace('0x', ''), 'hex'),
        ]);

        const digest = utils.keccak256(message);

        let signature = nacl.sign.detached(Buffer.from(digest.replace('0x', ''), 'hex'), con.payerAccount.secretKey);
        console.log("javascript digest:" + digest + " signer:" + con.payerAccount.publicKey.toBuffer().toString('hex') + " signature:" + Buffer.from(signature).toString('hex'));


        const sig = '0x' + Buffer.from(signature).toString('hex');

        await token.call('permit', [wallet, otherAddress, TEST_AMOUNT, deadline, sig]);

        res = await token.call('allowance', [wallet, otherAddress]);
        expect(res[0]).toEqual(TEST_AMOUNT);
        res = await token.call('nonces', [wallet]);
        expect(res[0].toNumber()).toEqual(1);
    })

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
