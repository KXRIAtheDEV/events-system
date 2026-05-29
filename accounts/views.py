from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .auth import (
    authenticate_bearer,
    issue_token_pair,
    json_error,
    login_user,
    parse_json_body,
    revoke_user_tokens,
    token_hash,
)
from .models import APIToken


PUBLIC_REGISTRATION_ROLES = {'attendee', 'organizer'}
PROFILE_FIELDS = ('first_name', 'last_name', 'email', 'phone', 'organization_name', 'location')


def user_payload(user):
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'full_name': f"{user.first_name} {user.last_name}".strip(),
        'phone': user.phone,
        'role': user.role,
        'organization_name': user.organization_name,
        'date_of_birth': getattr(user, 'date_of_birth', None),
        'location': getattr(user, 'location', ''),
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
    }


def requested_registration_role(request, data):
    if request.path.startswith('/api/organizer/'):
        return 'organizer'
    return data.get('role', 'attendee')


@csrf_exempt
@require_http_methods(['POST'])
def register(request):
    data = parse_json_body(request)
    if data is None:
        return json_error('Invalid JSON body.')

    username = (data.get('username') or '').strip()
    email = (data.get('email') or '').strip()
    password = data.get('password') or ''
    role = requested_registration_role(request, data)
    organization_name = (data.get('organization_name') or '').strip()

    errors = {}
    if not username:
        errors['username'] = 'Username is required.'
    if not email:
        errors['email'] = 'Email is required.'
    if not password:
        errors['password'] = 'Password is required.'
    if role not in PUBLIC_REGISTRATION_ROLES:
        errors['role'] = 'Public registration only supports attendee and organizer roles.'
    if role == 'organizer' and not organization_name:
        errors['organization_name'] = 'Organization name is required for organizers.'

    User = get_user_model()
    if username and User.objects.filter(username__iexact=username).exists():
        errors['username'] = 'This username is already in use.'
    if email and User.objects.filter(email__iexact=email).exists():
        errors['email'] = 'This email is already in use.'

    try:
        validate_password(password)
    except ValidationError as exc:
        errors['password'] = list(exc.messages)

    if errors:
        return json_error('Registration failed.', status=400, errors=errors)

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=(data.get('first_name') or '').strip(),
        last_name=(data.get('last_name') or '').strip(),
        phone=(data.get('phone') or '').strip(),
        role=role,
        organization_name=organization_name if role == 'organizer' else '',
    )

    return JsonResponse({
        'message': 'Registration successful.',
        'user': user_payload(user),
        **issue_token_pair(user),
    }, status=201)


@csrf_exempt
@require_http_methods(['POST'])
def login(request):
    data = parse_json_body(request)
    if data is None:
        return json_error('Invalid JSON body.')

    identifier = (data.get('username') or data.get('email') or '').strip()
    password = data.get('password') or ''
    user = login_user(identifier, password)

    if not user:
        return json_error('Invalid username/email or password.', status=401)
    if not user.is_active:
        return json_error('This account is inactive.', status=403)
    if request.path.startswith('/api/organizer/') and user.role != 'organizer' and not user.is_superuser:
        return json_error('Only organizer accounts can access the organizer portal.', status=403)

    return JsonResponse({
        'message': 'Login successful.',
        'user': user_payload(user),
        **issue_token_pair(user),
    })


@csrf_exempt
@require_http_methods(['POST'])
def logout(request):
    user, error = authenticate_bearer(request)
    if error:
        return error

    data = parse_json_body(request) or {}
    revoke_user_tokens(user, refresh_token=data.get('refresh'))
    return JsonResponse({'message': 'Logout successful.'})


@csrf_exempt
@require_http_methods(['POST'])
def refresh_token(request):
    data = parse_json_body(request)
    if data is None:
        return json_error('Invalid JSON body.')

    raw_refresh = data.get('refresh') or ''
    token = (
        APIToken.objects.select_related('user')
        .filter(token_hash=token_hash(raw_refresh), token_type='refresh')
        .first()
    )
    if not token or not token.is_active or not token.user.is_active:
        return json_error('Invalid or expired refresh token.', status=401)

    token.revoked_at = timezone.now()
    token.save(update_fields=['revoked_at'])

    return JsonResponse({
        'message': 'Token refreshed.',
        'user': user_payload(token.user),
        **issue_token_pair(token.user),
    })


@require_http_methods(['GET'])
def check_status(request):
    user, error = authenticate_bearer(request)
    if error:
        return error

    return JsonResponse({
        'authenticated': True,
        'role': user.role,
        'user': user_payload(user),
    })


@require_http_methods(['GET'])
def profile_detail(request):
    user, error = authenticate_bearer(request)
    if error:
        return error

    return JsonResponse({'user': user_payload(user)})


@csrf_exempt
@require_http_methods(['PUT', 'PATCH'])
def profile_update(request):
    user, error = authenticate_bearer(request)
    if error:
        return error

    data = parse_json_body(request)
    if data is None:
        return json_error('Invalid JSON body.')

    if 'email' in data:
        email = (data.get('email') or '').strip()
        if not email:
            return json_error('Email cannot be blank.')
        User = get_user_model()
        if User.objects.exclude(pk=user.pk).filter(email__iexact=email).exists():
            return json_error('This email is already in use.')

    if user.role == 'organizer' and 'organization_name' in data and not (data.get('organization_name') or '').strip():
        return json_error('Organization name is required for organizers.')

    if 'name' in data:
        name_parts = (data.get('name') or '').strip().split(' ', 1)
        user.first_name = name_parts[0] if len(name_parts) > 0 else ''
        user.last_name = name_parts[1] if len(name_parts) > 1 else ''

    if 'dob' in data:
        dob_str = (data.get('dob') or '').strip()
        if dob_str:
            try:
                import dateutil.parser
                user.date_of_birth = dateutil.parser.isoparse(dob_str).date()
            except ValueError:
                pass
        else:
            user.date_of_birth = None

    for field in PROFILE_FIELDS:
        if field in data:
            setattr(user, field, (data.get(field) or '').strip())

    if user.role != 'organizer':
        user.organization_name = ''

    user.save(update_fields=[*PROFILE_FIELDS, 'date_of_birth'])
    return JsonResponse({'message': 'Profile updated.', 'user': user_payload(user)})


@csrf_exempt
@require_http_methods(['POST'])
def change_password(request):
    user, error = authenticate_bearer(request)
    if error:
        return error

    data = parse_json_body(request)
    if data is None:
        return json_error('Invalid JSON body.')

    current_password = data.get('current_password') or ''
    new_password = data.get('new_password') or ''

    if not user.check_password(current_password):
        return json_error('Current password is incorrect.', status=400)

    try:
        validate_password(new_password, user)
    except ValidationError as exc:
        return json_error('Password change failed.', status=400, errors={'new_password': list(exc.messages)})

    user.set_password(new_password)
    user.save(update_fields=['password'])
    revoke_user_tokens(user)
    return JsonResponse({'message': 'Password changed. Please log in again.'})
