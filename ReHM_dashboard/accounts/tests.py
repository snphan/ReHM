import json
from django.test import TestCase, Client
from rest_framework.test import APIRequestFactory
from . import models
from django.contrib.auth import (
    SESSION_KEY,
)
from django.urls import reverse_lazy

# Create your tests here.
class BasicMathTest(TestCase):
    def test_addition(self):
        self.assertEqual(1 + 1, 2)

class AuthorizationTest(TestCase):

    def login(self, email='testinguser@gmail.com', password='password'):
        self.user = models.ReHMUser.objects.get_or_create(email=email)
        if self.user[1]:
            self.user[0].set_password(password)
            self.user[0].save()

        self.user = self.user[0]
        response = self.client.post(reverse_lazy("accounts:login"), {
            'username': email,
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
        
    
class APITest(TestCase):
    gridlayout_data = {
            'provider': 1,
            'patient': 1,
            'i': 'HR',
            'x': 0,
            'y': 0,
            'w': 3,
            'h': 3
        }

    def setUp(self):
        self.login()
        self.client.post('/accounts/api/axes/', {
            'name': 'test'
        })
        self.client.post('/accounts/api/datatype/', {
            'name': 'HR',
            'units': 'BPM',
            'axes': 'test'
        })
        self.client.post('/accounts/api/devicetype/', {
            'name': 'Apple Watch 7',
            'dataType': 'HR',
        })
        self.client.post('/accounts/api/device/', {
            'serial': 'APPLE7ABC',
            'deviceType': 'Apple Watch 7',
            'user_id': 1
        })

        self.client.post('/accounts/api/gridlayout/', self.gridlayout_data)

    def login(self, email='testinguser@gmail.com', password='password'):
        self.user = models.ReHMUser.objects.get_or_create(email=email)
        if self.user[1]:
            self.user[0].set_password(password)
            self.user[0].save()

        self.user = self.user[0]
        response = self.client.post(reverse_lazy("accounts:login"), {
            'username': email,
            'password': password,
        }, follow=True)

        self.assertIn(SESSION_KEY, self.client.session)
        return response

    def test_new_axis_created(self):
        """Check if Axis is successfully created
        """
        self.setUp()

        response = self.client.get('/accounts/api/axes/')
        response_content = json.loads(response.content)

        self.assertIn('name', response_content[0])
        self.assertEquals('test', response_content[0]['name'])

    def test_datatype_created(self):
        """Check if the DataType object was created Successfully
        """
        self.setUp()

        response = self.client.get('/accounts/api/datatype/')
        response_content = json.loads(response.content)

        self.assertEquals(['test'], response_content[0]['axes'])
        self.assertEquals('BPM', response_content[0]['units'])
        self.assertEquals('HR', response_content[0]['name'])

    def test_devicetype_created(self):
        """Check if the devicetype object was created Successfully
        """
        self.setUp()

        response = self.client.get('/accounts/api/devicetype/')
        response_content = json.loads(response.content)

        self.assertEquals('Apple Watch 7', response_content[0]['name'])
        self.assertEquals(['HR'], response_content[0]['dataType'])

    def test_device_created(self):
        """Check if the device object was created Successfully
        """
        self.setUp()

        response = self.client.get('/accounts/api/device/')
        response_content = json.loads(response.content)

        self.assertEquals('Apple Watch 7', response_content[0]['deviceType'])
        self.assertEquals(1, response_content[0]['user_id'])

    def test_gridlayout_created(self):
        """Check if the gridlayout object was created Successfully
        """
        self.setUp()
        response = self.client.get('/accounts/api/gridlayout/')
        response_data = json.loads(response.content)[0]
        self.assertEqual(response_data['provider'], self.gridlayout_data['provider'])
        self.assertEqual(response_data['patient'], self.gridlayout_data['patient'])
        self.assertEqual(response_data['i'], self.gridlayout_data['i'])
        self.assertEqual(response_data['x'], self.gridlayout_data['x'])
        self.assertEqual(response_data['y'], self.gridlayout_data['y'])
        self.assertEqual(response_data['w'], self.gridlayout_data['w'])
        self.assertEqual(response_data['h'], self.gridlayout_data['h'])
    
    def test_duplicate_gridlayout_create(self):
        """Check if the gridlayout unique constraint works
        """
        self.setUp()
        response = self.client.post('/accounts/api/gridlayout/', self.gridlayout_data)
        self.assertEqual(response.status_code, 400)

