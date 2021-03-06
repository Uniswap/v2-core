import { expect } from "chai";
import { BigNumber, constants as ethconst, utils as ethutils } from "ethers";
import { ecsign } from "ethereumjs-util";
import { ethers } from "hardhat";
import { ERC20 } from "../types";
import { expandTo18Decimals, getApprovalDigest } from "./shared/utilities";

const { MaxUint256 } = ethconst;
const { hexlify, keccak256, defaultAbiCoder, toUtf8Bytes } = ethutils;

const TOTAL_SUPPLY = expandTo18Decimals(10000);
const TEST_AMOUNT = expandTo18Decimals(10);

describe("UniswapV2ERC20", async () => {
  const [wallet, other] = await ethers.getSigners();

  let token: ERC20;
  beforeEach(async () => {
    const factory = await ethers.getContractFactory(
      "contracts/test/ERC20.sol:ERC20"
    );
    token = (await factory.deploy(TOTAL_SUPPLY)) as ERC20;
  });

  it("name, symbol, decimals, totalSupply, balanceOf, DOMAIN_SEPARATOR, PERMIT_TYPEHASH", async () => {
    const name = await token.name();
    expect(name).to.eq("Uniswap V2");
    expect(await token.symbol()).to.eq("UNI-V2");
    expect(await token.decimals()).to.eq(18);
    expect(await token.totalSupply()).to.eq(TOTAL_SUPPLY);
    expect(await token.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY);
    expect(await token.DOMAIN_SEPARATOR()).to.eq(
      keccak256(
        defaultAbiCoder.encode(
          ["bytes32", "bytes32", "bytes32", "uint256", "address"],
          [
            keccak256(
              toUtf8Bytes(
                "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
              )
            ),
            keccak256(toUtf8Bytes(name)),
            keccak256(toUtf8Bytes("1")),
            1,
            token.address,
          ]
        )
      )
    );
    expect(await token.PERMIT_TYPEHASH()).to.eq(
      keccak256(
        toUtf8Bytes(
          "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
        )
      )
    );
  });

  it("approve", async () => {
    await expect(token.approve(other.address, TEST_AMOUNT))
      .to.emit(token, "Approval")
      .withArgs(wallet.address, other.address, TEST_AMOUNT);
    expect(await token.allowance(wallet.address, other.address)).to.eq(
      TEST_AMOUNT
    );
  });

  it("transfer", async () => {
    await expect(token.transfer(other.address, TEST_AMOUNT))
      .to.emit(token, "Transfer")
      .withArgs(wallet.address, other.address, TEST_AMOUNT);
    expect(await token.balanceOf(wallet.address)).to.eq(
      TOTAL_SUPPLY.sub(TEST_AMOUNT)
    );
    expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT);
  });

  it("transfer:fail", async () => {
    await expect(token.transfer(other.address, TOTAL_SUPPLY.add(1))).to.be
      .reverted; // ds-math-sub-underflow
    await expect(token.connect(other).transfer(wallet.address, 1)).to.be
      .reverted; // ds-math-sub-underflow
  });

  it("transferFrom", async () => {
    await token.approve(other.address, TEST_AMOUNT);
    await expect(
      token
        .connect(other)
        .transferFrom(wallet.address, other.address, TEST_AMOUNT)
    )
      .to.emit(token, "Transfer")
      .withArgs(wallet.address, other.address, TEST_AMOUNT);
    expect(await token.allowance(wallet.address, other.address)).to.eq(0);
    expect(await token.balanceOf(wallet.address)).to.eq(
      TOTAL_SUPPLY.sub(TEST_AMOUNT)
    );
    expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT);
  });

  it("transferFrom:max", async () => {
    await token.approve(other.address, MaxUint256);
    await expect(
      token
        .connect(other)
        .transferFrom(wallet.address, other.address, TEST_AMOUNT)
    )
      .to.emit(token, "Transfer")
      .withArgs(wallet.address, other.address, TEST_AMOUNT);
    expect(await token.allowance(wallet.address, other.address)).to.eq(
      MaxUint256
    );
    expect(await token.balanceOf(wallet.address)).to.eq(
      TOTAL_SUPPLY.sub(TEST_AMOUNT)
    );
    expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT);
  });

  it("permit", async () => {
    const nonce = await token.nonces(wallet.address);
    const deadline = MaxUint256;
    const digest = await getApprovalDigest(
      token,
      { owner: wallet.address, spender: other.address, value: TEST_AMOUNT },
      nonce,
      deadline
    );

    const sig = await wallet.signMessage(Buffer.from(digest.slice(2), "hex"));

    await expect(
      token.permit(
        wallet.address,
        other.address,
        TEST_AMOUNT,
        deadline,
        Number.parseInt(sig.slice(128), 16),
        sig.slice(0, 64),
        sig.slice(64, 128)
      )
    )
      .to.emit(token, "Approval")
      .withArgs(wallet.address, other.address, TEST_AMOUNT);
    expect(await token.allowance(wallet.address, other.address)).to.eq(
      TEST_AMOUNT
    );
    expect(await token.nonces(wallet.address)).to.eq(BigNumber.from(1));
  });
});
