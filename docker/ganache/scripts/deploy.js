const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("🔄 Desplegando contrato...");

    // Obtener la fábrica del contrato
    const Tournaments = await ethers.getContractFactory("Tournaments");

    // Desplegar el contrato
    const tournaments = await Tournaments.deploy();
    await tournaments.waitForDeployment();

    // Obtener la dirección
    const contractAddress = tournaments.target;
    console.log("✅ Tournaments contract deployed to:", contractAddress);

    // Guardar la dirección en un archivo JSON
    const data = { address: contractAddress };
    fs.writeFileSync("/app/blockchain_data/contractAddress.json", JSON.stringify(data, null, 2));

    console.log("📁 Dirección guardada en contractAddress.json");
}

main().catch((error) => {
    console.error("❌ Error en el despliegue:", error);
    process.exitCode = 1;
});
