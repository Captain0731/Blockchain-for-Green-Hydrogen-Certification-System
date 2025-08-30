from datetime import datetime
import json
from app import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    certificates = db.relationship('Certificate', backref='user', lazy=True)
    credits = db.relationship('Credit', backref='user', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def get_total_credits(self):
        total = 0
        for credit in self.credits:
            if credit.transaction_type == 'add':
                total += credit.amount
            elif credit.transaction_type == 'transfer_out':
                total -= credit.amount
            elif credit.transaction_type == 'transfer_in':
                total += credit.amount
        return max(0, total)

class Certificate(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    certificate_id = db.Column(db.String(100), unique=True, nullable=False)
    issue_date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='active')
    meta_json = db.Column(db.Text)
    
    def get_meta(self):
        if self.meta_json:
            return json.loads(self.meta_json)
        return {}
    
    def set_meta(self, data):
        self.meta_json = json.dumps(data)

class Credit(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    transaction_type = db.Column(db.String(20), nullable=False)  # 'add', 'transfer_in', 'transfer_out'
    date = db.Column(db.DateTime, default=datetime.utcnow)
    meta_json = db.Column(db.Text)
    
    def get_meta(self):
        if self.meta_json:
            return json.loads(self.meta_json)
        return {}
    
    def set_meta(self, data):
        self.meta_json = json.dumps(data)

class Block(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    index = db.Column(db.Integer, unique=True, nullable=False)
    previous_hash = db.Column(db.String(64), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    transactions_json = db.Column(db.Text)
    nonce = db.Column(db.Integer, default=0)
    hash = db.Column(db.String(64), nullable=False)
    
    def get_transactions(self):
        if self.transactions_json:
            return json.loads(self.transactions_json)
        return []
    
    def set_transactions(self, transactions):
        self.transactions_json = json.dumps(transactions)
