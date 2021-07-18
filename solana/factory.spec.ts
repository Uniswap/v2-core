import { Keypair } from '@solana/web3.js';
import expect from 'expect';
import { establishConnection, Contract, TestConnection, createProgramAddress } from './index';

const AddressZero = '0x0000000000000000000000000000000000000000000000000000000000000000';

const TEST_ADDRESSES: [string, string] = [
    '0x1000000000000000000000000000000000000000000000000000000000000000',
    '0x2000000000000000000000000000000000000000000000000000000000000000'
];

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
        const contractStorageAccount = await con.createStorageAccount(1024);

        let res = await factory.call('createPair', tokens, [contractStorageAccount.publicKey]);

        let pairAddress = feeSetter = '0x' + contractStorageAccount.publicKey.toBuffer().toString('hex');;

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
