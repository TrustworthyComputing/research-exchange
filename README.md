# Research Exchange

## System requirements
* target OS: Ubuntu 22.04.1 LTS
* nodejs: v23.10.0
* npm: v10.9.2
* python3: v3.13.2
* python3-pip: v23.2.1

## Setup GitHub Oauth Application
* Create a [GitHub](https://github.com/) account if you do not already have one.
* Go to [GitHub Developer Settings](https://github.com/settings/developers).
* Under the "OAuth Apps" section, click on "New OAuth App."
* Fill in the required details:
     - **Application Name**: A name for your application.
     - **Homepage URL**: The main URL for your application.
       - Set this URL to "http://localhost:4200"
     - **Authorization Callback URL**: The URL where users will be redirected after authentication
       - Set this URL to "http://localhost:4200/login/github/callback"
   - Click "Register application."
* Retrieve Your Client ID and Client Secret**
   - After registration, you will be redirected to the app's details page.
   - Copy the **Client ID**.
   - Click on "Generate a new client secret" and copy the **Client Secret** (store it securely, as it will not be shown again).
* The **Client ID** and **Client Secret** will be used to configure the frontend and backend applications described in a later step.

## Setup Backend server
* Navigate to the backend directory `cd research-exchange/backend`
* Run the command `pip install -r requirements.txt` to download all required dependencies.
* Run the command `python manage.py migrate` to setup the database.
* Run the command `python manage.py createsuperuser` to create an admin account for managing the server.
* You will be prompted to enter the following details:
    - **Username**: Choose a name for your account.
    - **Password**: Enter a secure password and confirm it.
    - **Email**: (Optional)
* Run the command `python manage.py runserver` to start the server.
* Open a browser and navigate to `http://localhost:8000/admin/`. Login to your admin account using the details just entered.
* Under the "Social Accounts/Social applications" section, click on "Add".
* You will be prompted to enter the following details:
    - **Provider**: Select "GitHub".
    - **Provider ID**: Enter "github"
    - **Name**: Enter "GitHub"
    - **Client ID**: Enter the Client ID received from GitHub in the "Setup GitHub Oauth Application" section.
    - **Secret key**: Enter the Client Secret received from GitHub in the "Setup GitHub Oauth Application" section.
* Click save.

## Setup Frontend server
* Navigate to the frontend directory `cd research-exchange/frontend`
* Run the command `npm install` to download all required dependencies.
* Open the file "frontend/src/services/auth.service.ts" in a text editor and set the "GITHUB_CLIENT_ID" field to the Client ID received from GitHub in the "Setup Github Oauth Application" section.
* Run the command `ng serve` to start the server.
* Your application is now running and available to test locally at `http://localhost:4200/`.

## Acknowledgments
The design this app was partially supported by the National Science Foundation (Award #2234974).

<p align="center">
    <img src="./logos/twc.png" height="20%" width="20%">
</p>
<h4 align="center">Trustworthy Computing Group</h4>
