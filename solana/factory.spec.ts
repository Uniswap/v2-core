import { Keypair, PublicKey } from '@solana/web3.js';
import expect from 'expect';
import { establishConnection, Contract, TestConnection, createProgramAddress } from './index';
import { utils } from 'ethers';

const AddressZero = '0x0000000000000000000000000000000000000000000000000000000000000000';

const TEST_ADDRESSES: [string, string] = [
    '0x1000000000000000000000000000000000000000000000000000000000000000',
    '0x2000000000000000000000000000000000000000000000000000000000000000'
];

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
    let factory: Contract;
    let feeSetter: string;

    before(async function () {
        this.timeout(50000);

        con = await establishConnection('bundle.so');

        feeSetter = '0x' + con.payerAccount.publicKey.toBuffer().toString('hex');
    });

    beforeEach(async function () {
        factory = await con.deploy('UniswapV2Factory.abi', 'UniswapV2Factory', [feeSetter]);
    });


    it('feeTo, feeToSetter, allPairsLength', async () => {
        let res = await factory.call('feeTo', []);
        expect(res[0].toString()).toEqual(AddressZero);

        res = await factory.call('feeToSetter', []);
        expect(res[0].toString()).toEqual(feeSetter);

        res = await factory.call('allPairsLength', []);
        expect(res[0].toNumber()).toEqual(0);
    })

    async function createPair(tokens: [string, string]) {
        let seed = await getCreate2Address(con.programAccount.publicKey, feeSetter, tokens);

        console.log("pda:" + seed.address);

        let res = await factory.call('createPair', tokens, [con.programAccount.publicKey], [seed], [factory.get_storage_keypair()]);

        const accountInfo = await con.connection.getAccountInfo(seed.address);

        //console.log("data:" + accountInfo!.data.toString('hex'));

        let pairAddress = '0x' + seed.address.toBuffer().toString('hex');

        expect(res[0].toString()).toEqual(pairAddress);

        res = await factory.call('getPair', tokens);
        expect(res[0].toString()).toEqual(pairAddress);

        res = await factory.call('getPair', tokens.slice().reverse());
        expect(res[0].toString()).toEqual(pairAddress);

        res = await factory.call('allPairs', [0]);
        expect(res[0].toString()).toEqual(pairAddress);

        res = await factory.call('allPairsLength', []);
        expect(res[0].toNumber()).toEqual(1);


    }

    it('createPair', async () => {
        await createPair(TEST_ADDRESSES)
    })

    it('createPair:reverse', async () => {
        await createPair(TEST_ADDRESSES.slice().reverse() as [string, string])
    })
});
