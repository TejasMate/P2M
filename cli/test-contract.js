const { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } = require('@aptos-labs/ts-sdk');

// Test the deployed UPI Registry contract
async function testContract() {
    try {
        console.log('Testing deployed UPI Registry contract...');
        
        // Initialize Aptos client for devnet
        const config = new AptosConfig({ network: Network.DEVNET });
        const aptos = new Aptos(config);
        
        const contractAddress = '0xc46da6d2055a40f380c9aeab7648a81773b701bfc5a14c3c682b42458f1af156';
        
        // First, let's check if the contract exists
        console.log('\nChecking if contract exists...');
        try {
            const modules = await aptos.getAccountModules({ accountAddress: contractAddress });
            console.log('Contract modules found:', modules.length);
            
            const upiModule = modules.find(m => m.abi?.name === 'upi_registry');
            if (upiModule) {
                console.log('✅ UPI Registry module found');
            } else {
                console.log('❌ UPI Registry module not found');
                return;
            }
        } catch (error) {
            console.error('❌ Error checking contract:', error.message);
            return;
        }
        
        // Skip initialization for now and test view functions directly
        console.log('\nTesting view functions directly...');
        
        // Now test view functions
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
        
        console.log('\n✅ Contract testing completed!');
        
    } catch (error) {
        console.error('❌ Error testing contract:', error.message);
        if (error.data) {
            console.error('Error details:', error.data);
        }
    }
}

testContract();