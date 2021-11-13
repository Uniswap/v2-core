import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { ERC20 } from "../typechain";
import { expandTo18Decimals, getApprovalDigest } from "./shared/utilities";
import type { Wallet } from "ethers";
import { BigNumber } from "ethers";

const TOTAL_SUPPLY = expandTo18Decimals(10000);
const TEST_AMOUNT = expandTo18Decimals(10);

describe("UniswapV2ERC20", () => {
  const loadFixture = waffle.createFixtureLoader(
    waffle.provider.getWallets(),
    waffle.provider
  );

  async function fixture([wallet, other]: Wallet[]) {
    const factory = await ethers.getContractFactory(
      "contracts/test/ERC20.sol:ERC20"
    );
    const token = await factory.deploy(TOTAL_SUPPLY);
    return { token: token as ERC20, wallet, other };
  }

  it("name, symbol, decimals, totalSupply, balanceOf, DOMAIN_SEPARATOR, PERMIT_TYPEHASH", async () => {
    const { token, wallet } = await loadFixture(fixture);
    const name = await token.name();
    expect(name).to.eq("Uniswap V2");
    expect(await token.symbol()).to.eq("UNI-V2");
    expect(await token.decimals()).to.eq(18);
    expect(await token.totalSupply()).to.eq(TOTAL_SUPPLY);
    expect(await token.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY);
    expect(await token.DOMAIN_SEPARATOR()).to.eq(
      ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["bytes32", "bytes32", "bytes32", "uint256", "address"],
          [
            ethers.utils.keccak256(
              ethers.utils.toUtf8Bytes(
                "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
              )
            ),
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes(name)),
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes("1")),
            1,
            token.address,
          ]
        )
      )
    );
    expect(await token.PERMIT_TYPEHASH()).to.eq(
      ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(
          "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
        )
      )
    );
  });

  it("approve", async () => {
    const { token, wallet, other } = await loadFixture(fixture);
    await expect(token.approve(other.address, TEST_AMOUNT))
      .to.emit(token, "Approval")
      .withArgs(wallet.address, other.address, TEST_AMOUNT);
    expect(await token.allowance(wallet.address, other.address)).to.eq(
      TEST_AMOUNT
    );
  });

  it("transfer", async () => {
    const { token, wallet, other } = await loadFixture(fixture);
    await expect(token.transfer(other.address, TEST_AMOUNT))
      .to.emit(token, "Transfer")
      .withArgs(wallet.address, other.address, TEST_AMOUNT);
    expect(await token.balanceOf(wallet.address)).to.eq(
      TOTAL_SUPPLY.sub(TEST_AMOUNT)
    );
    expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT);
  });

  it("transfer:fail", async () => {
    const { token, wallet, other } = await loadFixture(fixture);
    await expect(token.transfer(other.address, TOTAL_SUPPLY.add(1))).to.be
      .reverted; // ds-math-sub-underflow
    await expect(token.connect(other).transfer(wallet.address, 1)).to.be
      .reverted; // ds-math-sub-underflow
  });

  it("transferFrom", async () => {
    const { token, wallet, other } = await loadFixture(fixture);
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
    const { token, wallet, other } = await loadFixture(fixture);

    await token.approve(other.address, ethers.constants.MaxUint256);
    await expect(
      token
        .connect(other)
        .transferFrom(wallet.address, other.address, TEST_AMOUNT)
    )
      .to.emit(token, "Transfer")
      .withArgs(wallet.address, other.address, TEST_AMOUNT);
    expect(await token.allowance(wallet.address, other.address)).to.eq(
      ethers.constants.MaxUint256
    );
    expect(await token.balanceOf(wallet.address)).to.eq(
      TOTAL_SUPPLY.sub(TEST_AMOUNT)
    );
    expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT);
  });

  it("permit", async () => {
    const { token, wallet, other } = await loadFixture(fixture);
    const nonce = await token.nonces(wallet.address);
    const deadline = ethers.constants.MaxUint256;
    const digest = await getApprovalDigest(
      token,
      { owner: wallet.address, spender: other.address, value: TEST_AMOUNT },
      nonce,
      deadline
    );

    const { r, s, v } = wallet
      ._signingKey()
      .signDigest(Buffer.from(digest.slice(2), "hex"));

    await expect(
      token.permit(
        wallet.address,
        other.address,
        TEST_AMOUNT,
        deadline,
        v,
        r,
        s
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
