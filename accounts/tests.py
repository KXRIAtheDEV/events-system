import json

from django.contrib.auth import get_user_model
from django.test import TestCase


class AccountAPITests(TestCase):
    def post_json(self, path, payload, token=None):
        headers = {}
        if token:
            headers['HTTP_AUTHORIZATION'] = f'Bearer {token}'
        return self.client.post(
            path,
            data=json.dumps(payload),
            content_type='application/json',
            **headers,
        )

    def put_json(self, path, payload, token=None):
        headers = {}
        if token:
            headers['HTTP_AUTHORIZATION'] = f'Bearer {token}'
        return self.client.put(
            path,
            data=json.dumps(payload),
            content_type='application/json',
            **headers,
        )

    def test_organizer_registration_requires_organization_name(self):
        response = self.post_json('/api/organizer/auth/register/', {
            'username': 'organizer',
            'email': 'organizer@example.com',
            'password': 'StrongPass123!',
        })

        self.assertEqual(response.status_code, 400)
        self.assertIn('organization_name', response.json()['errors'])

    def test_organizer_can_register_login_and_update_profile(self):
        register_response = self.post_json('/api/organizer/auth/register/', {
            'username': 'organizer',
            'email': 'organizer@example.com',
            'password': 'StrongPass123!',
            'organization_name': 'Bright Events',
        })

        self.assertEqual(register_response.status_code, 201)
        register_data = register_response.json()
        self.assertEqual(register_data['user']['role'], 'organizer')
        self.assertEqual(register_data['user']['organization_name'], 'Bright Events')
        self.assertIn('access', register_data)
        self.assertIn('refresh', register_data)

        login_response = self.post_json('/api/organizer/auth/login/', {
            'username': 'organizer',
            'password': 'StrongPass123!',
        })

        self.assertEqual(login_response.status_code, 200)
        access = login_response.json()['access']

        profile_response = self.put_json('/api/organizer/profile/update/', {
            'first_name': 'Yvonne',
            'organization_name': 'Bright Events Ltd',
        }, token=access)

        self.assertEqual(profile_response.status_code, 200)
        self.assertEqual(profile_response.json()['user']['first_name'], 'Yvonne')
        self.assertEqual(profile_response.json()['user']['organization_name'], 'Bright Events Ltd')

    def test_attendee_cannot_login_to_organizer_portal(self):
        User = get_user_model()
        User.objects.create_user(
            username='attendee',
            email='attendee@example.com',
            password='StrongPass123!',
            role='attendee',
        )

        response = self.post_json('/api/organizer/auth/login/', {
            'username': 'attendee',
            'password': 'StrongPass123!',
        })

        self.assertEqual(response.status_code, 403)

    def test_refresh_and_logout_token_flow(self):
        register_response = self.post_json('/api/auth/register/', {
            'username': 'attendee',
            'email': 'attendee@example.com',
            'password': 'StrongPass123!',
            'role': 'attendee',
        })
        refresh = register_response.json()['refresh']
        access = register_response.json()['access']

        status_response = self.client.get(
            '/api/auth/check-status/',
            HTTP_AUTHORIZATION=f'Bearer {access}',
        )
        self.assertEqual(status_response.status_code, 200)
        self.assertEqual(status_response.json()['role'], 'attendee')

        refresh_response = self.post_json('/api/auth/refresh-token/', {'refresh': refresh})
        self.assertEqual(refresh_response.status_code, 200)
        new_access = refresh_response.json()['access']

        logout_response = self.post_json('/api/auth/logout/', {}, token=new_access)
        self.assertEqual(logout_response.status_code, 200)

        status_after_logout = self.client.get(
            '/api/auth/check-status/',
            HTTP_AUTHORIZATION=f'Bearer {new_access}',
        )
        self.assertEqual(status_after_logout.status_code, 401)
