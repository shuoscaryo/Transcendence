import os
import requests
from django.core.files.base import ContentFile
from django.http import HttpResponse
from django.contrib.auth import get_user_model, login
from django.utils import timezone
from PIL import Image, ExifTags
from io import BytesIO
from django.views.decorators.http import require_GET

def apply_exif_orientation(img):
    try:
        exif = img._getexif()
        if exif is not None:
            orientation_key = next(
                k for k, v in ExifTags.TAGS.items() if v == "Orientation"
            )
            orientation = exif.get(orientation_key)

            if orientation == 3:
                img = img.rotate(180, expand=True)
            elif orientation == 6:
                img = img.rotate(270, expand=True)
            elif orientation == 8:
                img = img.rotate(90, expand=True)
    except Exception:
        pass
    return img

def crop_center(img):
    width, height = img.size
    new_edge = min(width, height)
    left = (width - new_edge) // 2
    top = (height - new_edge) // 2
    right = left + new_edge
    bottom = top + new_edge
    return img.crop((left, top, right, bottom))

def process_square_image(image_bytes, size=256):
    """
    Takes raw image bytes, returns JPEG bytes cropped and resized to size x size.
    """
    img = Image.open(BytesIO(image_bytes))
    img = apply_exif_orientation(img)

    # Remove alpha channel
    if img.mode in ('RGBA', 'LA'):
        background = Image.new('RGB', img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[-1])
        img = background
    elif img.mode != 'RGB':
        img = img.convert('RGB')

    img = crop_center(img)
    img = img.resize((size, size))

    buffer = BytesIO()
    img.save(buffer, format='JPEG')
    return buffer.getvalue()

@require_GET
def login_42(request):
    code = request.GET.get("code")
    if not code:
        return HttpResponse("Error: no code")

    # Exchange code for access_token
    client_id = os.environ.get("FORTY_TWO_CLIENT_ID")
    client_secret = os.environ.get("FORTY_TWO_CLIENT_SECRET")
    token_url = "https://api.intra.42.fr/oauth/token"
    redirect_uri = f"https://{request.get_host()}:4443/api/login_42"

    data = {
        "grant_type": "authorization_code",
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
        "redirect_uri": redirect_uri,
    }

    response = requests.post(token_url, data=data)
    token_info = response.json()
    print(token_info)
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
    print(f"42 id: {forty_two_id} name: {user_data['login']}")
    user = User.objects.filter(forty_two_id=forty_two_id).first()
    print(f"User is {user}")
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
        
        # Generate unique email
        base_email = f"{user_data['login']}@42.fr"
        email = base_email
        counter = 1
        while User.objects.filter(email=email).exists():
            email = f"{user_data['login']}_{counter}@42.fr"
            counter += 1

        # Create user account
        user = User.objects.create_user(
            username=username,
            email=email,
            display_name=display_name,
            last_online=timezone.now(),
            forty_two_id=forty_two_id
        )

        user.set_unusable_password()

        # Save profile image from 42
        image_url = user_data.get("image", {}).get("link")
        if image_url:
            response = requests.get(image_url)
            if response.status_code == 200:
                processed_bytes = process_square_image(response.content, size=256)
                user.profile_photo.save(
                    f"{username}.jpg",
                    ContentFile(processed_bytes),
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
