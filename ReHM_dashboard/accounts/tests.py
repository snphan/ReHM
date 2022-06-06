from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.contrib.auth import (
    BACKEND_SESSION_KEY, REDIRECT_FIELD_NAME, SESSION_KEY,
)
from django.urls import reverse_lazy

# Create your tests here.
class BasicMathTest(TestCase):
    def test_addition(self):
        self.assertEqual(1 + 1, 2)

class AuthorizationTest(TestCase):

    def login(self, username='testinguser', password='password'):
        self.user = User.objects.get_or_create(username=username)
        if self.user[1]:
            self.user[0].set_password(password)
            self.user[0].save()

        self.user = self.user[0]
        response = self.client.post(reverse_lazy("accounts:login"), {
            'username': username,
            'password': password,
        }, follow=True)
        self.assertIn(SESSION_KEY, self.client.session)
        return response

    def logout(self):
        response = self.client.post(reverse_lazy("accounts:logout"), follow=True)
        self.assertEqual(response.status_code, 200)
        self.assertNotIn(SESSION_KEY, self.client.session)
        return response

    def test_login_and_logout(self):
        response = self.login()
        response = self.logout()

    def test_login_and_logout_message(self):
        self.assertRedirects(self.login(), reverse_lazy("dashboard:index"), 
                                302, 200)
        response = self.logout()
        self.assertIn("logged out", str(response.context["messages"]._loaded_messages[0]).lower())
        response = self.login()
        self.assertIn("logged in", str(response.context["messages"]._loaded_messages[0]).lower())

    def test_double_login_redirect_message(self):
        response = self.login()
        response = self.login()
        self.assertIn("already", str(response.context["messages"]._loaded_messages[0]).lower())
        
    