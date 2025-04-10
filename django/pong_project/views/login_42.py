import os
import requests
from django.core.files.base import ContentFile
from django.http import HttpResponse
from django.contrib.auth import get_user_model, login
from django.utils import timezone

def login_42(request):
    code = request.GET.get("code")
    if not code:
        return HttpResponse("Error: no code")

    # Exchange code for access_token
    client_id = os.environ.get("FORTY_TWO_CLIENT_ID")
    client_secret = os.environ.get("FORTY_TWO_CLIENT_SECRET")
    token_url = "https://api.intra.42.fr/oauth/token"
    redirect_uri = f"https://{request.get_host()}/api/login_42"

    data = {
        "grant_type": "authorization_code",
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
        "redirect_uri": redirect_uri,
    }

    response = requests.post(token_url, data=data)
    token_info = response.json()
    access_token = token_info.get("access_token")

    if not access_token:
        return HttpResponse("Error: no access token")

    # Request user data from 42
    headers = {"Authorization": f"Bearer {access_token}"}
    user_response = requests.get("https://api.intra.42.fr/v2/me", headers=headers)
    user_data = user_response.json()

    # Try to find user by unique 42 ID
    User = get_user_model()
    forty_two_id = user_data["id"]
    user = User.objects.filter(forty_two_id=forty_two_id).first()

    if not user:
        # Generate unique username
        base_username = f"ft_{user_data['login']}"
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{counter}"
            counter += 1

        # Generate unique display_name
        base_display = user_data["login"]
        display_name = base_display
        counter = 1
        while User.objects.filter(display_name=display_name).exists():
            display_name = f"{base_display}_{counter}"
            counter += 1

        # Create user account
        user = User.objects.create_user(
            username=username,
            email=None,
            display_name=display_name,
            last_online=timezone.now(),
            forty_two_id=forty_two_id
        )
        user.set_unusable_password()

        # Save profile image from 42
        image_url = user_data.get("image", {}).get("link")
        if image_url:
            image_response = requests.get(image_url)
            if image_response.status_code == 200:
                user.profile_photo.save(
                    f"{username}.jpg",
                    ContentFile(image_response.content),
                    save=True
                )

        user.save()

    # Log in the user
    login(request, user)

    # Close popup and notify frontend
    html = """
    <html><body>
    <script>
        window.opener.postMessage({ success: true }, "*");
        window.close();
    </script>
    </body></html>
    """
    return HttpResponse(html)
