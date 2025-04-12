from django.http import JsonResponse
from django.contrib.auth import get_user_model
from django.db.models import Q
from pong_project.models import MatchHistory
import json
from datetime import datetime
from web3 import Web3

CustomUser = get_user_model()

def merge_by_date(list1, list2):
    combined = list1 + list2

    # Convert to datetime objects for sorting (temporarily)
    for item in combined:
        if isinstance(item['start_date'], str):
            item['start_date'] = datetime.fromisoformat(item['start_date'])

    # Sort by latest date first
    combined.sort(key=lambda x: x['start_date'], reverse=True)

    # Convert back to ISO format
    for item in combined:
        item['start_date'] = item['start_date'].isoformat()

    return combined

def format_tournament(tournament):
    # update player names
    player_names = tournament["player_names"]
    player_ids = tournament["player_ids"]
    for i in range(len(player_ids)):
        if player_ids[i] != 0:
            user = CustomUser.objects.get(id=player_ids[i])
            player_names[i] = user.display_name
    players_map = dict(zip(player_ids, player_names))

    # update winner
    winner_id = tournament["winner_id"]
    winner_name = tournament["winner_name"]
    if winner_id != 0:
        winner_name = players_map[winner_id]

    # update matches
    matches = []
    for match in tournament["matches"]:
        new_match = {}
        new_match["playerLeft"] = players_map[match["player1"]]\
            if match["player1"] else match["player1_name"]
        new_match["playerRight"] = players_map[match["player2"]]\
            if match["player2"] else match["player2_name"]
        new_match["scoreLeft"] = match["score1"]
        new_match["scoreRight"] = match["score2"]
        matches.append(new_match)  
  
    return {
        "match_type": f'tournament_{tournament["game_type"]}',
        "players": player_names,
        "winner": winner_name,
        "duration": tournament["duration"],
        "start_date": tournament["start_date"],
        "matches": matches,
    }
    

def get_tournament(contract, user_id, pos):
    # request tournament data
    t = contract.functions.getUserTournament(user_id, pos).call()

    tournament_data = {
        "winner_id": t[0],
        "winner_name": t[1],
        "player_ids": t[2],
        "player_names": t[3],
        "match_count": t[4],
        "start_date": t[5],
        "duration": t[6],
        "game_type": t[7],
        "matches": []
    }

    # request matches data
    for i in range(t[4]):
        m = contract.functions.getUserMatch(user_id, pos, i).call()
        tournament_data["matches"].append({
            "player1_name": m[0],
            "player1": m[1],
            "player2_name": m[2],
            "player2": m[3],
            "score1": m[4],
            "score2": m[5]
        })
    
    tournament_data = format_tournament(tournament_data)
    return tournament_data

def get_tournaments(user_id, offset, length):
    # Connect to the blockchain
    w3 = Web3(Web3.HTTPProvider("http://ganache-hardhat:7545"))
    if not w3.is_connected():
        raise Exception("Could not connect to the blockchain")

    with open("/app/blockchain_data/contractAddress.json") as f:
        contract_address = json.load(f)["address"]

    with open("/app/blockchain_data/Tournaments.json") as f:
        contract_abi = json.load(f)["abi"]

    contract = w3.eth.contract(address=contract_address, abi=contract_abi)

    # Get the total number of tournaments for the user
    total = contract.functions.getTournamentCountForUser(user_id).call()

    # Get each tournament data
    results = []
    start = max(0, total - offset - length)
    end = max(0, total - offset)
    for i in range(end - 1, start - 1, -1):
        t = get_tournament(contract, user_id, i)
        results.append(t)

    return results, total

def get_matches(user, offset, limit):
    # Get the matches for the user
    matches = MatchHistory.objects.filter(
        Q(player_left=user) | Q(player_right=user)
    ).order_by('-start_date').values(
        'id', 'player_left__display_name', 'player_right__display_name',
        'score_left', 'score_right', 'start_date', 'duration', 'match_type'
    )[offset:offset + limit]

    # Format dates so it doesn't crash the JSON serializer
    formatted_matches = []
    for match in matches:
        match['start_date'] = match['start_date'].isoformat()
        formatted_matches.append(match)

    # Total matches
    total_matches = MatchHistory.objects.filter(
        Q(player_left=user) | Q(player_right=user)
    ).count()

    return formatted_matches, total_matches

def get_match_history(display_name, request):
    try:
        user = CustomUser.objects.get(display_name=display_name)
        user_id = user.id
        offset = int(request.GET.get('offset', 0))
        limit = int(request.GET.get('limit', 10))

        matches, total_matches = get_matches(user, offset, limit)
        tournaments, total_tournaments = get_tournaments(user_id, offset, limit)
        merged_games = merge_by_date(matches, tournaments)
        total = total_matches + total_tournaments
        print(merged_games)

        return JsonResponse({'matches': merged_games, 'total_matches': total})
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def match_history(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Not authenticated'}, status=401)
    return get_match_history(request.user.display_name, request)

def match_history_by_display_name(request, display_name):
    return get_match_history(display_name, request)