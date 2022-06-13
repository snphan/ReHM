from django.test import TestCase, Client
from django.test.utils import setup_test_environment
from django.urls import reverse, reverse_lazy
from accounts import models as account_models
from django.contrib.auth import (
    SESSION_KEY
)


# Create your tests here.
class DashboardViewTests(TestCase):

    def login(self, email='testinguser@gmail.com', password='password'):
        self.user = account_models.ReHMUser.objects.create(email=email)
        self.user.set_password(password)
        self.user.save()

        response = self.client.post(reverse_lazy("accounts:login"), {
            'username': email,
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

