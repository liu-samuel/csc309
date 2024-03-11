#!/bin/bash

venv_name="csc309_p2"

if ! command -v python3 &> /dev/null; then
    echo "Installing Python 3..."
    sudo apt-get update
    sudo apt-get install -y python3
else
    echo "Python 3 is already installed."
fi

# Check if virtualenv is installed, if not, install it
if ! command -v virtualenv &> /dev/null
then
    echo "Installing virtualenv"
    pip install virtualenv
fi

# Create a virtual environment
if [ ! -d "$venv_name" ]
then
    echo "Creating virtual environment"
    virtualenv "$venv_name"
fi

# Activate virtual environment
echo "Activating virtual environment"
source "$venv_name"/bin/activate

# Install required Python packages
echo "Installing required Python packages"
pip install django pillow djangorestframework djangorestframework-simplejwt drf-yasg

cd p2

# Make Django migrations
echo "Making Django migrations..."
python manage.py makemigrations

# Migrate migrations
echo "Running Django migrations..."
python manage.py migrate

echo "Setup completed"