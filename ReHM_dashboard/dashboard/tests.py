from django.test import TestCase, Client
from django.test.utils import setup_test_environment
from django.urls import reverse, reverse_lazy
from django.contrib.auth.models import User
from django.contrib.auth import (
    BACKEND_SESSION_KEY, REDIRECT_FIELD_NAME, SESSION_KEY,
)


# Create your tests here.
class DashboardViewTests(TestCase):

    def login(self, username='testinguser', password='password'):
        self.user = User.objects.create(username=username)
        self.user.set_password(password)
        self.user.save()

        response = self.client.post(reverse_lazy("accounts:login"), {
            'username': username,
            'password': password,
        })
        self.assertIn(SESSION_KEY, self.client.session)
        return response

    def test_correct_patient(self):
        """Check if the correct patient is selected
        """
        self.login()

        response = self.client.get(reverse('dashboard:info', args=['hi']))
        self.assertEqual(response.status_code, 200)
        # Patient selection maybe delegated to the client in an API call in the future
        self.assertEqual(response.context['patient_id'], 'hi')

