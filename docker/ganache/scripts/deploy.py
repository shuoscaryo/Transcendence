import subprocess

print("🔄 Ejecutando despliegue desde JavaScript...")

try:
    result = subprocess.run(
        ["npx", "hardhat", "run", "/app/scripts/deploy.js", "--network", "ganache"],
        capture_output=True, text=True
    )

    print("✅ Salida del script:")
    print(result.stdout)

    if result.returncode != 0:
        print("❌ Error en el despliegue:", result.stderr)

except Exception as e:
    print("❌ Error al ejecutar el script de despliegue:", str(e))
