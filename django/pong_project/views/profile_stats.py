from django.http import JsonResponse
from django.contrib.auth import get_user_model
from django.db.models import Q
from pong_project.models import MatchHistory

CustomUser = get_user_model()

def get_profile_stats(display_name):
    try:
        user = CustomUser.objects.get(display_name=display_name)

        # Get all the user's matches
        all_matches = MatchHistory.objects.filter(
            Q(player_left=user) | Q(player_right=user)
        ).order_by('-start_date')

        # aux functions
        def is_win(match):
            if match.player_left == user:
                return match.score_left > match.score_right
            elif match.player_right == user:
                return match.score_right > match.score_left
            return False

        def get_avg_score(matches):
            total_user_score = 0
            total_enemy_score = 0
            count = 0
            for match in matches:
                if match.player_left == user:
                    total_user_score += match.score_left
                    total_enemy_score += match.score_right
                elif match.player_right == user:
                    total_user_score += match.score_right
                    total_enemy_score += match.score_left
                count += 1
            user_average =  round(total_user_score / count, 2) if count > 0 else 0
            enemy_average = round(total_enemy_score / count, 2) if count > 0 else 0
            return user_average, enemy_average

        def get_avg_duration(matches):
            total = sum([match.duration for match in matches])
            return round(total / len(matches), 1) if matches else 0

        def get_longest_winstreak(matches):
            streak = max_streak = 0
            for match in matches:
                if is_win(match):
                    streak += 1
                    max_streak = max(max_streak, streak)
                else:
                    streak = 0
            return max_streak

        # Separate matches by type
        local_matches = all_matches.filter(match_type='local')
        ai_matches = all_matches.filter(match_type='AI')
        online_matches = all_matches.filter(match_type='online')

        # Count normal match stats
        def count_stats(matches):
            wins = sum(1 for m in matches if is_win(m))
            losses = len(matches) - wins
            avg_score_user, avg_score_enemy = get_avg_score(matches)
            return {
                'total': len(matches),
                'wins': wins,
                'losses': losses,
                'avg_score': {
                    'user': avg_score_user,
                    'enemy': avg_score_enemy,
                },
                'avg_duration': get_avg_duration(matches),
                'longest_winstreak': get_longest_winstreak(matches),
            }

        stats = {
            'local': {
                'total': local_matches.count(),
            },
            'ai': count_stats(ai_matches),
            'online': count_stats(online_matches),
            'tournaments_local': {
                'total': 0,  # placeholder, not implemented
            },
            'tournaments_online': {
                'wins': 0,  # placeholder
                'losses': 0,
            },
        }

        return JsonResponse(stats)
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def profile_stats(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Not authenticated'}, status=401)
    return get_profile_stats(request.user.display_name)

def profile_stats_by_display_name(request, display_name):
    return get_profile_stats(display_name)