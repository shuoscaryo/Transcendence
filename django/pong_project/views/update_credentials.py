from django.http import JsonResponse
import json
import re
import uuid
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
from django.contrib.auth import get_user_model
from django.contrib.auth import update_session_auth_hash

def crop_center(image):
    width, height = image.size
    min_dim = min(width, height)
    left = (width - min_dim) / 2
    top = (height - min_dim) / 2
    right = (width + min_dim) / 2
    bottom = (height + min_dim) / 2
    return image.crop((left, top, right, bottom))

def update_credentials(request, credential):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    user = request.user
    
    # Delete profile_photo
    if request.method == 'DELETE':
        if credential == 'profile_photo':
            if user.profile_photo and user.profile_photo.name != 'profile_photos/default.jpg':
                user.profile_photo.delete(save=False)
                user.save()
                return JsonResponse({'profile_photo': request.user.profile_photo_url})
            return JsonResponse({'error': 'No profile photo to delete'}, status=400)
        return JsonResponse({'error': 'Invalid credential type'}, status=400)
    
    # Allow only POST requests for updating credentials
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    if credential == 'profile_photo':
        if 'profile_photo' not in request.FILES:
            return JsonResponse({'error': 'No image uploaded'}, status=400)

        image_file = request.FILES['profile_photo']
        if not image_file.content_type.startswith('image/'):
            return JsonResponse({'error': 'Uploaded file is not an image'}, status=400)
        try:
            img = Image.open(image_file)
            # Remove alpha channel
            if img.mode in ('RGBA', 'LA'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[-1])
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            # Crop and resize
            img = crop_center(img)
            img = img.resize((256, 256))
            # Save image to buffer
            buffer = BytesIO()
            img.save(buffer, format='JPEG')
            file_name = f"{uuid.uuid4().hex}.jpg"

            # Clean the old image
            if user.profile_photo and user.profile_photo.name != 'profile_photos/default.jpg':
                user.profile_photo.delete(save=False)

            # Save the new image
            user.profile_photo.save(file_name, ContentFile(buffer.getvalue()))
            user.save()

            return JsonResponse({credential: user.profile_photo_url})
        except Exception as e:
            return JsonResponse({'error': f'Invalid image: {str(e)}'}, status=400)

    # If its not a profile photo update, expect JSON data
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    # Check for required fields
    value = data.get('value')
    password = data.get('password')
    if not value:
        return JsonResponse({'error': 'Missing value'}, status=400)
    if credential != 'display_name' and not password:
        return JsonResponse({'error': 'Password is required'}, status=400)
    if credential != 'display_name' and not user.check_password(password):
        return JsonResponse({'error': 'Incorrect password'}, status=403)

    # --- Username ---
    if credential == 'username':
        if not re.fullmatch(r'[a-zA-Z0-9_]{3,20}', value):
            return JsonResponse({'error': 'Invalid username format'}, status=400)
        if value == user.username:
            return JsonResponse({'error': 'Username is the same as current'}, status=400)
        if get_user_model().objects.filter(username=value).exclude(id=user.id).exists():
            return JsonResponse({'error': 'Username already taken'}, status=400)
        user.username = value

    # --- Display name ---
    elif credential == 'display_name':
        if not re.fullmatch(r'[a-zA-Z0-9_]{3,20}', value):
            return JsonResponse({'error': 'Invalid display name format'}, status=400)
        if value == user.display_name:
            return JsonResponse({'error': 'Display name is the same as current'}, status=400)
        if get_user_model().objects.filter(display_name=value).exclude(id=user.id).exists():
            return JsonResponse({'error': 'Display name already taken'}, status=400)
        user.display_name = value

    # --- Password ---
    elif credential == 'password':
        if len(value) < 8 \
            or not re.search(r'[A-Z]', value) \
            or not re.search(r'[a-z]', value) \
            or not re.search(r'[^a-zA-Z0-9]', value):
            return JsonResponse({'error': 'Password must be at least 8 characters and include upper, lower and special characters'}, status=400)
        user.set_password(value)

    else:
        return JsonResponse({'error': 'Invalid credential type'}, status=400)

    user.save()
    update_session_auth_hash(request, user)

    if credential == 'password':
        return JsonResponse({})
    return JsonResponse({credential: value})
