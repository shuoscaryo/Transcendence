from web3 import Web3
from datetime import datetime
import json

# Conectarse a Ganache local
w3 = Web3(Web3.HTTPProvider("http://192.168.1.53:7545"))

# Verificar la conexión
if w3.is_connected():
    print("Conectado a Ganache")
else:
    print("No se pudo conectar a Ganache")

# Leer la dirección del contrato desde el archivo JSON
with open("contractAddress.json", "r") as file:
    contract_data = json.load(file)
    contract_address = contract_data["address"]

# Leer el ABI desde el JSON generado por Hardhat
with open("../artifacts/contracts/Tournaments.sol/Tournaments.json", "r") as file:
    contract_json = json.load(file)
    contract_abi = contract_json["abi"]


# Conectarse al contrato
tournaments = w3.eth.contract(address=contract_address, abi=contract_abi)

# Configurar cuenta de Ganache (usa la dirección y clave de Ganache)
sender_address = "0xc47FA735ed6e74cBF2E9E4008dCB5de178374870"
private_key = "0x576768c98d2012329d3820dd06b84f77505691673368562dc15e81856d154d19"

# 1. Crear un torneo
print("Creando un torneo...")
nonce = w3.eth.get_transaction_count(sender_address)
create_tx = tournaments.functions.createTournament(["Payoscar", "Bob", "Charlie", "Diana"], "Payoscar").build_transaction({
    'from': sender_address,
    'nonce': nonce,
    'gas': 2000000,
    'gasPrice': w3.to_wei('10', 'gwei')
})
signed_tx = w3.eth.account.sign_transaction(create_tx, private_key)
tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
# Escuchar eventos
event_filter = tournaments.events.TournamentCreated.create_filter(fromBlock='latest')

# Verificar si el evento fue emitido
events = event_filter.get_new_entries()

for event in events:
    print("Nuevo torneo creado:")
    print(f"ID: {event['args']['id']}")
    print(f"Jugadores: {event['args']['players']}")

receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

# Procesar el evento desde el recibo
events = tournaments.events.TournamentCreated().process_receipt(receipt)

if events:
    for event in events:
        print("Nuevo torneo creado:")
        print(f"ID: {event['args']['id']}")
        print(f"Jugadores: {event['args']['players']}")
else:
    print("No se detectaron eventos en el recibo.")

print("¡Torneo creado!")

# 2. Obtener detalles del torneo
print("Obteniendo detalles del torneo...")
tournament = tournaments.functions.getTournament(1).call()
print({
    'id': str(tournament[0]),
    'rounds': str(tournament[1]),
    'players': tournament[2],
    'winner': tournament[3],
    'date': datetime.fromtimestamp(tournament[4]).strftime('%Y-%m-%d %H:%M:%S') if tournament[4] > 0 else "No establecido"
})
