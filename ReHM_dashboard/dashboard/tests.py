from django.test import TestCase, Client
from django.test.utils import setup_test_environment
from django.urls import reverse, reverse_lazy

# Create your tests here.
class DashboardViewTests(TestCase):
    def test_correct_patient(self):
        """Check if the correct patient is selected
        """

        response = self.client.get(reverse('dashboard:info', args=['hi']))
        self.assertEqual(response.status_code, 200)
        # Patient selection maybe delegated to the client in an API call in the future
        self.assertEqual(response.context['patient_id'], 'hi')

        