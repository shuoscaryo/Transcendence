from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from web3 import Web3
from datetime import datetime

@csrf_exempt
def tournaments(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        winner = data.get('winner')
        players = data.get('players')

        # Connect to local Ganache
        w3 = Web3(Web3.HTTPProvider("http://192.168.1.53:7545"))

        # Verify connection
        if w3.is_connected():
            print("Connected to Ganache", file=open("log.txt", "a"))
        else:
            print("Could not connect to Ganache", file=open("log.txt", "a"))
            return JsonResponse({'error': 'Could not connect to blockchain'}, status=500)

        # Read contract address from JSON file
        with open("/app/blockchain_data/contractAddress.json", "r") as file:
            contract_data = json.load(file)
            contract_address = contract_data["address"]

        # Read ABI from JSON generated by Hardhat
        with open("/app/blockchain_data/Tournaments.json", "r") as file:
            contract_json = json.load(file)
            contract_abi = contract_json["abi"]

        # Connect to the contract
        tournaments = w3.eth.contract(address=contract_address, abi=contract_abi)

        # Configure Ganache account (use Ganache's address and key)
        sender_address = "0x9dbBE0483E8f7C8231bd9e8c117b0f7821abD8Ea"
        private_key = "0x5832c8b670e026f7d230a7e4f8e2894c432d1a21dd62e29221e460f892258ac0"

        # 1. Create a tournament
        print("Creating a tournament...")
        nonce = w3.eth.get_transaction_count(sender_address)
        create_tx = tournaments.functions.createTournament(players, winner).build_transaction({
            'from': sender_address,
            'nonce': nonce,
            'gas': 2000000,
            'gasPrice': w3.to_wei('10', 'gwei')
        })
        signed_tx = w3.eth.account.sign_transaction(create_tx, private_key)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

        # Process the event from the receipt
        events = tournaments.events.TournamentCreated().process_receipt(receipt)

        event_data = []
        for event in events:
            event_entry = {
                'id': str(event['args']['id']),
                'players': event['args']['players']
            }
            event_data.append(event_entry)
            
            # Save event details to file
            with open("event_log.txt", "a") as file:
                file.write(json.dumps(event_entry, indent=4) + "\n")

        # 2. Get tournament details
        print("Fetching tournament details...")
        tournament = tournaments.functions.getTournament(1).call()
        tournament_data = {
            'id': str(tournament[0]),
            'rounds': str(tournament[1]),
            'players': tournament[2],
            'winner': tournament[3],
            'date': datetime.fromtimestamp(tournament[4]).strftime('%Y-%m-%d %H:%M:%S') if tournament[4] > 0 else "Not set"
        }

        # Save tournament details to file
        with open("tournament_log.txt", "a") as file:
            file.write(json.dumps(tournament_data, indent=4) + "\n")

        return JsonResponse({'success': True, 'events': event_data, 'tournament': tournament_data})
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)