from django.http import JsonResponse
from django.contrib.auth import get_user_model
from web3 import Web3
from django.utils import timezone
from datetime import timedelta

import json

CustomUser = get_user_model()

def is_valid_string(value):
    return isinstance(value, str) and value.strip() != ''

def check_game_type(game_type):
    return game_type in ['local', 'online']

def check_winner_name(winner_name, player_names):
    return is_valid_string(winner_name) and winner_name in player_names

def check_player_names(player_names):
    if not isinstance(player_names, list) or len(player_names) < 2:
        return False
    if len(set(player_names)) != len(player_names):
        return False  # duplicates found
    return all(is_valid_string(name) for name in player_names)

def check_match_duration(duration):
    try:
        duration = int(duration)
        return duration >= 0
    except (ValueError, TypeError):
        return False

def check_matches(matches, player_names):
    if not isinstance(matches, list) or len(matches) == 0:
        return False

    for match in matches:
        if not isinstance(match, dict):
            return False

        p1 = match.get('player1', '')
        p2 = match.get('player2', '')

        has_p1 = is_valid_string(p1)
        has_p2 = is_valid_string(p2)

        if not has_p1 and not has_p2:
            return False  # at least one name is required

        if has_p1 and p1 not in player_names:
            return False
        if has_p2 and p2 not in player_names:
            return False

        if has_p1 and has_p2:
            try:
                s1 = int(match.get('score1', -1))
                s2 = int(match.get('score2', -1))
            except (ValueError, TypeError):
                return False
            if not (0 <= s1 < 100 and 0 <= s2 < 100):
                return False

    return True

def check_real_user(real_user, player_names):
    return real_user is None or (is_valid_string(real_user) and real_user in player_names)


def add_tournament(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request method'}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    # Extract data
    game_type = data.get('game_type')
    winner_name = data.get('winner')
    player_names = data.get('players')
    matches = data.get('matches')
    duration = data.get('duration')
    real_user_name = data.get('real_user', None)

    # validations
    if not check_game_type(game_type):
        return JsonResponse({'error': 'Invalid game_type'}, status=400)
    if not check_player_names(player_names):
        return JsonResponse({'error': 'Invalid players list'}, status=400)
    if not check_winner_name(winner_name, player_names): # check after player_names
        return JsonResponse({'error': 'Invalid winner name'}, status=400)
    if not check_matches(matches, player_names):
        return JsonResponse({'error': 'Invalid matches list'}, status=400)
    if not check_match_duration(duration):
        return JsonResponse({'error': 'Invalid duration'}, status=400)
    if not check_real_user(real_user_name, player_names):
        return JsonResponse({'error': 'Invalid real_user'}, status=400)

    # Prepare data for blockchain
    ## Get player IDs and winner ID
    player_ids = [0] * len(player_names)
    winner_id = 0
    if game_type == 'local' and real_user_name:
        try:
            user = CustomUser.objects.get(display_name=real_user_name)
            for i in range(len(player_names)):
                if player_names[i] == real_user_name:
                    player_ids[i] = user.id
            if winner_name == real_user_name:
                winner_id = user.id
        except CustomUser.DoesNotExist:
            return JsonResponse({'error': 'Real user not so real after all'}, status=400)
    elif game_type == 'online':
        for i in range(len(player_names)):
            try:
                user = CustomUser.objects.get(display_name=player_names[i])
                player_ids[i] = user.id
                if (player_names[i] == winner_name):
                    winner_id = user.id
            except CustomUser.DoesNotExist:
                return JsonResponse({'error': f'user {player_names[i]} does not exist in DB'}, status=400)

    ## Calculate start date and format duration
    duration = int(duration)
    start_date = timezone.now() - timedelta(seconds=duration)
    start_date = start_date.isoformat()
    

    ## Get matches data
    players_dict = dict(zip(player_names, player_ids)) # temp for getting match ids
    formatted_matches = []
    for match in matches:
        match_data = {}
        # swap player names if player1 is empty
        p1_name = match.get('player1', '')
        p2_name = match.get('player2', '')
        if p1_name == '':
            p1_name = p2_name
            p2_name = ''
        match_data['player1Name'] = p1_name
        match_data['player1'] = players_dict.get(p1_name, 0)
        match_data['player2Name'] = p2_name
        match_data['player2'] = players_dict.get(p2_name, 0)
        match_data['score1'] = int(match.get('score1', 0)) if p2_name else 0
        match_data['score2'] = int(match.get('score2', 0)) if p2_name else 0
        formatted_matches.append(match_data)
            
    try:
        # Connect to Ganache
        w3 = Web3(Web3.HTTPProvider("http://ganache:7545"))
        if not w3.is_connected():
            return JsonResponse({'error': 'Could not connect to blockchain'}, status=500)

        with open("/ganache/Tournaments.json") as f:
            file = json.load(f)
            contract_address = file.get("address")
            contract_abi = file.get("abi")

        contract = w3.eth.contract(address=contract_address, abi=contract_abi)
        
        with open("/ganache/wallet.json") as f:
            wallet = json.load(f)
            wallet_address = wallet.get("address")
            private_key = wallet.get("private_key")

        # Create Tournament
        nonce = w3.eth.get_transaction_count(wallet_address)
        tx1 = contract.functions.addTournament(
            winner_id,
            winner_name,
            player_ids,
            player_names,
            start_date,
            duration,
            game_type
        ).build_transaction({
            'from': wallet_address,
            'nonce': nonce,
            'gas': 3000000,
            'gasPrice': w3.to_wei('10', 'gwei')
        })
        signed_tx1 = w3.eth.account.sign_transaction(tx1, private_key)
        tx_hash1 = w3.eth.send_raw_transaction(signed_tx1.raw_transaction)
        receipt1 = w3.eth.wait_for_transaction_receipt(tx_hash1)
        tournament_id = contract.events.TournamentCreated().process_receipt(receipt1)[0]['args']['tournamentId']

        # Add Matches
        for match in formatted_matches:

            nonce += 1
            tx2 = contract.functions.addMatch(
                tournament_id,
                match['player1Name'],
                match['player1'],
                match['player2Name'],
                match['player2'],
                match['score1'],
                match['score2']
            ).build_transaction({
                'from': wallet_address,
                'nonce': nonce,
                'gas': 3000000,
                'gasPrice': w3.to_wei('10', 'gwei')
            })
            signed_tx2 = w3.eth.account.sign_transaction(tx2, private_key)
            tx_hash2 = w3.eth.send_raw_transaction(signed_tx2.raw_transaction)
            w3.eth.wait_for_transaction_receipt(tx_hash2)
    except Exception as e:
        return JsonResponse({'error': f'Blockchain transaction failed: {str(e)}'}, status=500)

    return JsonResponse({'success': True, 'tournamentId': tournament_id})
