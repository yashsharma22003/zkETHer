const snarkjs = require("snarkjs");
const fs = require("fs");

async function testMultiplierCircuit() {
    console.log("🧪 Testing multiplier circuit...");

    // Input values for testing
    const input = {
        a: 3,
        b: 5
    };

    console.log("📥 Input:", input);

    try {
        // Generate witness (simplified approach)
        console.log("🔄 Generating witness...");

        // Generate proof
        console.log("🔄 Generating proof...");
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            "build/multiplier_js/multiplier.wasm",
            "multiplier_final.zkey"
        );

        console.log("📤 Public signals (output):", publicSignals);
        console.log("✅ Expected output:", input.a * input.b);

        // Verify proof
        console.log("🔄 Verifying proof...");
        const vKey = JSON.parse(fs.readFileSync("verification_key.json"));
        const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);

        if (res === true) {
            console.log("✅ Proof verification successful!");
        } else {
            console.log("❌ Proof verification failed!");
        }

        return {
            proof,
            publicSignals,
            verified: res
        };

    } catch (error) {
        console.error("❌ Circuit test failed:", error);
        throw error;
    }
}

// Run test if called directly
if (require.main === module) {
    testMultiplierCircuit()
        .then(() => {
            console.log("🎉 Circuit test completed successfully!");
            process.exit(0);
        })
        .catch((error) => {
            console.error("💥 Circuit test failed:", error);
            process.exit(1);
        });
}

module.exports = { testMultiplierCircuit };
