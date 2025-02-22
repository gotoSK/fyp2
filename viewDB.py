from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy

# App setups
app = Flask(__name__)

# Configure the SQLite database
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False  # Suppress warnings
db = SQLAlchemy(app)

# Defining the database model
class PriceRow(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    conID = db.Column(db.String(50), nullable=False, unique=True)
    buyerID = db.Column(db.String(5))
    sellerID = db.Column(db.String(5))
    qty = db.Column(db.Integer)
    rate = db.Column(db.Float)
    buyerName = db.Column(db.String(100))
    sellerName = db.Column(db.String(100))
    symbol = db.Column(db.String(10))
    
    def __repr__(self):
        return f'<Task {self.id}>'
    
    def to_dict(self):
        """Convert SQLAlchemy object to a dictionary."""
        return {
            'id': self.id,
            'conID': self.conID,
            'buyerID': self.buyerID,
            'sellerID': self.sellerID,
            'qty': self.qty,
            'rate': self.rate,
            'buyerName': self.buyerName,
            'sellerName': self.sellerName,
            'symbol': self.symbol
        }

# Route to display the data
@app.route('/')
def index():
    tranData = PriceRow.query.order_by(PriceRow.id).all() # query to get all data from the database
    return render_template('viewDB.html', database=tranData)

if __name__ == "__main__":
    # Ensure tables are created
    with app.app_context():
        db.create_all()

    # Start the Flask app
    app.run(debug=True)