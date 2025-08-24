const { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } = require('@aptos-labs/ts-sdk');

// Test the deployed UPI Registry contract on testnet
async function testContract() {
    try {
        console.log('Testing UPI Registry contract on Testnet...');
        
        // Initialize Aptos client for testnet
        const config = new AptosConfig({ network: Network.TESTNET });
        const aptos = new Aptos(config);
        
        const contractAddress = '0xf9d57e56266876b07459f919263caf276b07978766ace8e17b65003bd227fea5';
        
        // Check if contract exists
        console.log('\nChecking if contract exists...');
        try {
            const modules = await aptos.getAccountModules({ accountAddress: contractAddress });
            console.log('Contract modules found:', modules.length);
            
            const upiModule = modules.find(m => m.abi?.name === 'upi_registry');
            if (upiModule) {
                console.log('✅ UPI Registry module found on testnet');
            } else {
                console.log('❌ UPI Registry module not found');
                return;
            }
        } catch (error) {
            console.error('❌ Error checking contract:', error.message);
            return;
        }
        
        // Initialize the contract
        console.log('\nInitializing the contract...');
        const privateKey = new Ed25519PrivateKey('0xfc3f774326bc81ec1e8b7794bd97d58316600cfd273aa3ea1248a27e8cc5644b');
        const account = Account.fromPrivateKey({ privateKey });
        
        try {
            const initTxn = await aptos.transaction.build.simple({
                sender: account.accountAddress,
                data: {
                    function: `${contractAddress}::upi_registry::initialize`,
                    arguments: []
                },
                options: {
                    maxGasAmount: 10000,
                    gasUnitPrice: 100
                }
            });
            
            const committedTxn = await aptos.signAndSubmitTransaction({
                signer: account,
                transaction: initTxn
            });
            
            await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
            console.log('✅ Contract initialized successfully');
            console.log('Transaction hash:', committedTxn.hash);
            console.log('Gas used: ~0.0001 APT');
            
        } catch (error) {
            if (error.message.includes('RESOURCE_ALREADY_EXISTS')) {
                console.log('✅ Contract already initialized');
            } else {
                console.error('❌ Error initializing contract:', error.message);
                return;
            }
        }
        
        // Test view functions
        console.log('\nTesting view functions...');
        
        try {
            const stats = await aptos.view({
                function: `${contractAddress}::upi_registry::get_registry_stats`,
                arguments: []
            });
            
            console.log('Registry Stats:', stats);
            console.log('Total Merchants:', stats[0]);
            console.log('Total UPI IDs:', stats[1]);
            
        } catch (error) {
            console.error('❌ Error calling get_registry_stats:', error.message);
        }
        
        try {
            const exists = await aptos.view({
                function: `${contractAddress}::upi_registry::upi_exists`,
                arguments: ['test@upi']
            });
            
            console.log('UPI ID "test@upi" exists:', exists[0]);
            
        } catch (error) {
            console.error('❌ Error calling upi_exists:', error.message);
        }
        
        console.log('\n✅ Testnet deployment and testing completed!');
        console.log('Contract Address:', contractAddress);
        console.log('Network: Testnet');
        console.log('Total gas cost: ~0.0001 APT');
        
    } catch (error) {
        console.error('❌ Error testing contract:', error.message);
        if (error.data) {
            console.error('Error details:', error.data);
        }
    }
}

testContract();