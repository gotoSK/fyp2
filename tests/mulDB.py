from tests.flask_test import Flask, render_template
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

# Multiple database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///default.db'  # Default database
app.config['SQLALCHEMY_BINDS'] = {
    'db1': 'sqlite:///database1.db',
    'db2': 'sqlite:///database2.db',
}

db = SQLAlchemy(app)

# Models
class Model1(db.Model):
    __bind_key__ = 'db1'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50))

    def __repr__(self) -> str: 
        return f'<{self.name}>'

class Model2(db.Model):
    __bind_key__ = 'db2'
    id = db.Column(db.Integer, primary_key=True)
    value = db.Column(db.String(50))

    def __repr__(self) -> str: 
        return f'<{self.name}>'

@app.route('/')
def index():
    # Insert records
    record1 = Model1(name='Database 1 Entry')
    record2 = Model2(value='Database 2 Entry')
    
    db.session.add(record1)
    db.session.add(record2)
    db.session.commit()

    # Fetch records
    db1_records = Model1.query.all()
    db2_records = Model2.query.all()

    return render_template('viewMulDB.html', database=db1_records, database2=db2_records)


if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Initialize all databases
    app.run(debug=True)




from tests.flask_test import Flask, render_template
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///example.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# The dynamic model creation
str1 = "DynamicModelName"  # The name you want for your model

# Dictionary to store models
dynamic_models = {}

# Dynamically create the model and store it in the dictionary
dynamic_models[str1] = type(
    str1,  # Name of the class
    (db.Model,),  # Base classes
    {
        '__tablename__': str1.lower(),  # Table name (lowercase for convention)
        'id': db.Column(db.Integer, primary_key=True),
        'name': db.Column(db.String(50), nullable=False),
        'email': db.Column(db.String(100), unique=True, nullable=False),
    }
)

@app.route('/')
def index():
    with app.app_context():
        # Retrieve the model dynamically using str1
        ModelClass = dynamic_models[str1]

        # Create the table for the model
        db.create_all()

        # Add a record
        new_record = ModelClass(name="John Doe", email="johndoe@example.com")
        db.session.add(new_record)
        db.session.commit()

        # Query the table
        records = ModelClass.query.all()
    return render_template('viewMulDB.html', database=records)


if __name__ == '__main__':
    app.run(debug=True)

