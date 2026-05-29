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
