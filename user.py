from utils import assets
import time

print("Loading Users ...")

class User:
    def __init__(self, username, password, name, is_admin):
        self.username = username
        self.password = password
        self.name = name 
        self.balance = {asset.arr[0][9]: 100000 for asset in assets} # for demo-user, using 1,00,000 shares as their balance for each asset in the market
        self.collateral = 1000000.00 # for demo-user, 10 lakhs as their purchasing power
        self.is_admin = is_admin

    def check_password(self, password):
        return self.password == password


# Simulating a database of users
users = {
    "oic_finance": User(
        "oic_finance",
        "iamuser",
        "Orchid International",
        False
        ),

    "sugam_karki": User(
        "sugam_karki",
        "iamuser",
        "Sugam Karki",
        False
        ),

    "anish_tamang": User(
        "anish_tamang",
        "iamuser",
        "Anish Tamang",
        False
        ),

    "parag_niraula": User(
        "parag_niraula",
        "iamuser",
        "Parag Niraula",
        False
        ),
        
    "admin": User(
        "admin",
        "iamadmin",
        "Administrator",
        True
        )
}