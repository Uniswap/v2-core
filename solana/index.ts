import {
    Keypair,
    Connection,
    BpfLoader,
    BPF_LOADER_PROGRAM_ID,
    PublicKey,
    LAMPORTS_PER_SOL,
    SystemProgram,
    TransactionInstruction,
    Transaction,
    sendAndConfirmTransaction, SYSVAR_CLOCK_PUBKEY,
} from '@solana/web3.js';
import fs from 'fs';
import { utils } from 'ethers';
import crypto from 'crypto';

const default_url: string = "http://localhost:8899";

export async function establishConnection(sopath: string): Promise<TestConnection> {
    let url = process.env.RPC_URL || default_url;
    let connection = new Connection(url, 'recent');
    const version = await connection.getVersion();
    console.log('Connection to cluster established:', url, version);

    // Fund a new payer via airdrop
    let payerAccount = await newAccountWithLamports(connection);

    const lamports = await connection.getBalance(payerAccount.publicKey);
    console.log(
        'Using account',
        payerAccount.publicKey.toBase58(),
        'containing',
        lamports / LAMPORTS_PER_SOL,
        'Sol to pay for fees',
    );

    let program = await loadProgram(connection, payerAccount, sopath);

    return new TestConnection(connection, payerAccount, program);
}

export async function createProgramAddress(program: PublicKey, salt: Buffer): Promise<any> {
    let seed = Buffer.concat([salt, Buffer.from('\x00')]);

    while (true) {
        let pda: any = undefined;

        await PublicKey.createProgramAddress([seed], program).then(v => { pda = v; }).catch(_ => { });

        if (pda) {
            return { address: pda, seed };
        }

        console.log("next")
        seed[seed.length - 1] += 1;
    }
}

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

async function newAccountWithLamports(
    connection: Connection,
    lamports: number = 10000000000,
): Promise<Keypair> {
    const account = Keypair.generate();

    let retries = 10;
    await connection.requestAirdrop(account.publicKey, lamports);
    for (; ;) {
        await sleep(500);
        if (lamports == (await connection.getBalance(account.publicKey))) {
            return account;
        }
        if (--retries <= 0) {
            break;
        }
        console.log('Airdrop retry ' + retries);
    }
    throw new Error(`Airdrop of ${lamports} failed`);
}

async function loadProgram(connection: Connection, payer: Keypair, sopath: string): Promise<Keypair> {
    console.log(`Loading ${sopath} ...`)

    const data: Buffer = fs.readFileSync(sopath);

    const programAccount = Keypair.generate();

    await BpfLoader.load(
        connection,
        payer,
        programAccount,
        data,
        BPF_LOADER_PROGRAM_ID,
    );
    const programId = programAccount.publicKey;

    console.log('Program loaded to account', programId.toBase58());

    return programAccount;
}

function encode_seeds(seeds: any[]): Buffer {
    let seed_encoded = Buffer.alloc(1 + seeds.map(seed => seed.seed.length + 1).reduce((a, b) => a + b, 0));

    seed_encoded.writeUInt8(seeds.length);
    let offset = 1;

    seeds.forEach((v) => {
        let seed = v.seed;

        seed_encoded.writeUInt8(seed.length, offset);
        offset += 1;
        seed.copy(seed_encoded, offset);
        offset += seed.length;
    });

    return seed_encoded;
}

export class TestConnection {
    constructor(public connection: Connection, public payerAccount: Keypair, public programAccount: Keypair) { }

    async createStorageAccount(space: number): Promise<Keypair> {
        const lamports = await this.connection.getMinimumBalanceForRentExemption(
            space
        );

        let account = Keypair.generate();

        const transaction = new Transaction().add(
            SystemProgram.createAccount({
                fromPubkey: this.payerAccount.publicKey,
                newAccountPubkey: account.publicKey,
                lamports,
                space,
                programId: this.programAccount.publicKey,
            }),
        );

        await sendAndConfirmTransaction(
            this.connection,
            transaction,
            [this.payerAccount, account],
            {
                skipPreflight: false,
                commitment: 'recent',
                preflightCommitment: undefined,
            },
        );

        console.log('Contract storage account', account.publicKey.toBase58());

        return account;
    }


    async deploy(abipath: string, contract: string, params: any[], seeds: any[] = [], contractStorageSize: number = 2048): Promise<Contract> {
        const abidata: string = JSON.parse(fs.readFileSync(abipath, 'utf-8'));

        const contractStorageAccount = await this.createStorageAccount(contractStorageSize);

        let abi = new utils.Interface(abidata);

        const input = abi.encodeDeploy(params);

        let hash = utils.keccak256(Buffer.from(contract));

        const data = Buffer.concat([
            contractStorageAccount.publicKey.toBuffer(),
            this.payerAccount.publicKey.toBuffer(),
            Buffer.from(hash.substr(2, 8), 'hex'),
            encode_seeds(seeds),
            Buffer.from(input.replace('0x', ''), 'hex')
        ]);

        console.log('calling constructor [' + params + ']');

        const instruction = new TransactionInstruction({
            keys: [
                { pubkey: contractStorageAccount.publicKey, isSigner: false, isWritable: true }],
            programId: this.programAccount.publicKey,
            data,
        });

        await sendAndConfirmTransaction(
            this.connection,
            new Transaction().add(instruction),
            [this.payerAccount],
            {
                skipPreflight: false,
                commitment: 'recent',
                preflightCommitment: undefined,
            },
        );

        return new Contract(this, contractStorageAccount, abi);
    }

    contractFromAddress(abipath: string, contractStorageAccount: Keypair): Contract {
        const abidata: string = JSON.parse(fs.readFileSync(abipath, 'utf-8'));

        let abi = new utils.Interface(abidata);

        return new Contract(this, contractStorageAccount, abi);
    }
}

export class Contract {
    constructor(public connection: TestConnection, public contractStorageAccount: Keypair, private abi: utils.Interface) { }

    async call(name: string, params: any[], pubkeys: PublicKey[] = [], seeds: any[] = [], signers: Keypair[] = []): Promise<utils.Result> {
        let fragment = this.abi.getFunction(name);

        const input = this.abi.encodeFunctionData(name, params);

        const data = Buffer.concat([
            this.contractStorageAccount.publicKey.toBuffer(),
            this.connection.payerAccount.publicKey.toBuffer(),
            Buffer.from('00000000', 'hex'),
            encode_seeds(seeds),
            Buffer.from(input.replace('0x', ''), 'hex')
        ]);

        let debug = 'calling function ' + name + ' [' + params + ']';

        let keys = [];

        seeds.forEach((seed) => {
            keys.push({ pubkey: seed.address, isSigner: false, isWritable: true });
        });

        keys.push({ pubkey: this.contractStorageAccount.publicKey, isSigner: false, isWritable: true });
        keys.push({ pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false });
        keys.push({ pubkey: PublicKey.default, isSigner: false, isWritable: false });

        for (let i = 0; i < pubkeys.length; i++) {
            keys.push({ pubkey: pubkeys[i], isSigner: false, isWritable: true });
        }

        const instruction = new TransactionInstruction({
            keys,
            programId: this.connection.programAccount.publicKey,
            data,
        });

        signers.unshift(this.connection.payerAccount);

        await sendAndConfirmTransaction(
            this.connection.connection,
            new Transaction().add(instruction),
            signers,
            {
                skipPreflight: false,
                commitment: 'recent',
                preflightCommitment: undefined,
            },
        );

        if (fragment.outputs?.length) {
            const accountInfo = await this.connection.connection.getAccountInfo(this.contractStorageAccount.publicKey);

            let length = Number(accountInfo!.data.readUInt32LE(4));
            let offset = Number(accountInfo!.data.readUInt32LE(8));

            let encoded = accountInfo!.data.slice(offset, length + offset);

            let returns = this.abi.decodeFunctionResult(fragment, encoded);

            debug += " returns [";
            for (let i = 0; i.toString() in returns; i++) {
                debug += returns[i];
            }
            debug += "]"
            console.log(debug);

            return returns;
        } else {
            console.log(debug);
            return [];
        }
    }

    async contract_storage(test: TestConnection, upto: number): Promise<Buffer> {
        const accountInfo = await test.connection.getAccountInfo(this.contractStorageAccount.publicKey);

        return accountInfo!.data;
    }


    get_storage_keypair(): Keypair {
        return this.contractStorageAccount;
    }
}
