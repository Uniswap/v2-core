module.exports = {
    networks: {
      development: {
        host: "127.0.0.1",     // Localhost (default: none)
        port: 7545,            // Standard Ethereum port (default: none)
        network_id: "*",       // Any network (default: none)
      },
    },
  
    contracts_directory: './solidity_contracts/',
    // Configure your compilers
    compilers: {
      solc: {
        version: 'pragma',

      }
    }
  };
  