# app.py
# This is the main Flask application for the drink company website backend.

import sqlite3
from flask import Flask, request, jsonify, g, render_template
from flask_cors import CORS # Import CORS to handle cross-origin requests from the frontend

# Initialize the Flask application
app = Flask(__name__)
# Enable CORS for all routes, allowing the frontend to make requests
CORS(app)

# --- Database Configuration ---
DATABASE = 'database.db' # Name of our SQLite database file

def get_db():
    """
    Establishes a database connection or returns an existing one.
    'g' is a special Flask object used to store data during a request.
    This ensures that each request uses the same database connection.
    """
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        # Set row_factory to sqlite3.Row to allow accessing columns by name
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    """
    Closes the database connection at the end of the request.
    """
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    """
    Initializes the database by running the schema.sql script.
    This function should be called once to set up the database.
    """
    with app.app_context():
        db = get_db()
        with app.open_resource('schema.sql', mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()
    print("Database initialized successfully.")

# --- Frontend Route ---
@app.route('/')
def index():
    """
    Renders the main index.html page.
    This is the entry point for the frontend application.
    """
    return render_template('index.html')

# --- API Endpoints (CRUD Operations) ---

@app.route('/drinks', methods=['GET'])
def get_drinks():
    """
    Retrieves all drinks from the database, including new fields.
    """
    db = get_db()
    # Select all columns, including the newly added ones
    cursor = db.execute('SELECT id, name, description, price, batch_no, expiry_date, quantity, drink_subtype FROM drinks')
    drinks = cursor.fetchall()
    # Convert list of Row objects to list of dictionaries for JSON serialization
    return jsonify([dict(drink) for drink in drinks])

@app.route('/drinks/<int:drink_id>', methods=['GET'])
def get_drink(drink_id):
    """
    Retrieves a single drink by its ID, including new fields.
    """
    db = get_db()
    # Select all columns for a specific drink
    cursor = db.execute('SELECT id, name, description, price, batch_no, expiry_date, quantity, drink_subtype FROM drinks WHERE id = ?', (drink_id,))
    drink = cursor.fetchone()
    if drink:
        return jsonify(dict(drink))
    return jsonify({'message': 'Drink not found'}), 404

@app.route('/drinks', methods=['POST'])
def create_drink():
    """
    Creates a new drink in the database, including new fields.
    Expects JSON data with 'name', 'description', 'price', 'batch_no', 'expiry_date', 'quantity', 'drink_subtype'.
    """
    data = request.get_json()
    # Validate required fields, including new ones
    required_fields = ['name', 'price', 'batch_no', 'expiry_date', 'quantity', 'drink_subtype']
    if not data or not all(k in data for k in required_fields):
        return jsonify({'message': 'Missing required fields. Ensure name, price, batch_no, expiry_date, quantity, and drink_subtype are provided.'}), 400

    name = data['name']
    description = data.get('description', '') # Description is still optional
    price = data['price']
    batch_no = data['batch_no']
    expiry_date = data['expiry_date']
    quantity = data['quantity']
    drink_subtype = data['drink_subtype']

    try:
        db = get_db()
        cursor = db.execute('INSERT INTO drinks (name, description, price, batch_no, expiry_date, quantity, drink_subtype) VALUES (?, ?, ?, ?, ?, ?, ?)',
                           (name, description, price, batch_no, expiry_date, quantity, drink_subtype))
        db.commit()
        # Return the newly created drink with its ID and all fields
        return jsonify({
            'id': cursor.lastrowid,
            'name': name,
            'description': description,
            'price': price,
            'batch_no': batch_no,
            'expiry_date': expiry_date,
            'quantity': quantity,
            'drink_subtype': drink_subtype
        }), 201
    except sqlite3.Error as e:
        return jsonify({'message': f'Database error: {e}'}), 500

@app.route('/drinks/<int:drink_id>', methods=['PUT'])
def update_drink(drink_id):
    """
    Updates an existing drink by its ID, including new fields.
    Expects JSON data with any of the fields to update.
    """
    data = request.get_json()
    if not data:
        return jsonify({'message': 'No data provided for update'}), 400

    db = get_db()
    cursor = db.execute('SELECT * FROM drinks WHERE id = ?', (drink_id,))
    drink = cursor.fetchone()

    if not drink:
        return jsonify({'message': 'Drink not found'}), 404

    # Use existing values if new ones are not provided for all fields
    name = data.get('name', drink['name'])
    description = data.get('description', drink['description'])
    price = data.get('price', drink['price'])
    batch_no = data.get('batch_no', drink['batch_no'])
    expiry_date = data.get('expiry_date', drink['expiry_date'])
    quantity = data.get('quantity', drink['quantity'])
    drink_subtype = data.get('drink_subtype', drink['drink_subtype'])


    try:
        db.execute('UPDATE drinks SET name = ?, description = ?, price = ?, batch_no = ?, expiry_date = ?, quantity = ?, drink_subtype = ? WHERE id = ?',
                   (name, description, price, batch_no, expiry_date, quantity, drink_subtype, drink_id))
        db.commit()
        return jsonify({
            'message': 'Drink updated successfully',
            'id': drink_id,
            'name': name,
            'description': description,
            'price': price,
            'batch_no': batch_no,
            'expiry_date': expiry_date,
            'quantity': quantity,
            'drink_subtype': drink_subtype
        })
    except sqlite3.Error as e:
        return jsonify({'message': f'Database error: {e}'}), 500

@app.route('/drinks/<int:drink_id>', methods=['DELETE'])
def delete_drink(drink_id):
    """
    Deletes a drink by its ID.
    """
    db = get_db()
    cursor = db.execute('DELETE FROM drinks WHERE id = ?', (drink_id,))
    db.commit()
    if cursor.rowcount == 0: # Check if any row was actually deleted
        return jsonify({'message': 'Drink not found'}), 404
    return jsonify({'message': 'Drink deleted successfully'}), 200

# --- Running the Application ---
if __name__ == '__main__':
    # Initialize the database when the application starts
    # This will create the database file and table if they don't exist
    init_db()
    # Run the Flask development server
    # debug=True allows for automatic reloading on code changes and provides a debugger
    app.run(debug=True)
