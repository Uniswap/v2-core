const ZapIn = artifacts.require('ZapIn');

async function main () {
  // ropsten 
  const wethAddress = '0xc778417e063141139fce010982780140aa0cd5ab';
  const factoryAddress = '0x0639542a5cd99bd5f4e85f58cb1f61d8fbe32de9';

  // bsc testnet
  // const wethAddress = '0xae13d989dac2f0debff460ac112a837c89baa7cd';
  // const factoryAddress = '0x7900309d0b1c8D3d665Ae40e712E8ba4FC4F5453';

  const zapIn = await ZapIn.new(factoryAddress, wethAddress);
  console.log('zapIn deployed to:', zapIn.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
