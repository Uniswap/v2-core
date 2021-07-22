import { Keypair, PublicKey } from '@solana/web3.js';
import expect from 'expect';
import { establishConnection, Contract, TestConnection, createProgramAddress } from './index';
import { BigNumber, utils } from 'ethers';

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

    before(async function () {
        this.timeout(50000);

        con = await establishConnection('bundle.so');

        wallet = '0x' + con.payerAccount.publicKey.toBuffer().toString('hex');
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
    })
});
