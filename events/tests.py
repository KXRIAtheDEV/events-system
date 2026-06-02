from django.test import TestCase


class EventPageTests(TestCase):
    def test_events_page_without_trailing_slash_redirects(self):
        response = self.client.get('/events')

        self.assertEqual(response.status_code, 301)
        self.assertEqual(response['Location'], '/events/')

    def test_events_page_with_trailing_slash_loads(self):
        response = self.client.get('/events/')

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Discover Amazing Events')


class OrganizerPortalRoutingTests(TestCase):
    def test_bookings_page_loads_correct_template(self):
        response = self.client.get('/organizer/bookings/')
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'organizer/bookings/bookings.html')

    def test_attendees_page_loads_correct_template(self):
        response = self.client.get('/organizer/attendees/')
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'organizer/attendees/attendees.html')

    def test_profile_page_loads_settings_template(self):
        response = self.client.get('/organizer/profile/')
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'organizer/settings/settings.html')
