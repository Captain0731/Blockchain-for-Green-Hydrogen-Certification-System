import secrets
from datetime import datetime
from flask import render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from app import app, db
from models import User, Certificate, Credit, Block
from blockchain import BlockchainSimulator

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        
        # Check if user already exists
        if User.query.filter_by(username=username).first():
            flash('Username already exists', 'error')
            return render_template('signup.html')
        
        if User.query.filter_by(email=email).first():
            flash('Email already registered', 'error')
            return render_template('signup.html')
        
        # Create new user
        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        
        # Add initial credits and create blockchain transaction
        initial_credit = Credit(
            user_id=user.id,
            amount=100.0,
            transaction_type='add'
        )
        initial_credit.set_meta({'source': 'welcome_bonus', 'description': 'Welcome bonus'})
        db.session.add(initial_credit)
        db.session.commit()
        
        # Add blockchain transaction
        transactions = [{
            'type': 'user_registration',
            'user_id': user.id,
            'username': user.username,
            'credits_awarded': 100.0,
            'timestamp': datetime.utcnow().isoformat()
        }]
        BlockchainSimulator.add_block(transactions)
        
        flash('Account created successfully!', 'success')
        return redirect(url_for('login'))
    
    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password', 'error')
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    # Get user statistics
    total_credits = current_user.get_total_credits()
    total_certificates = Certificate.query.filter_by(user_id=current_user.id).count()
    
    # Get recent certificates
    recent_certificates = Certificate.query.filter_by(user_id=current_user.id)\
                                         .order_by(Certificate.issue_date.desc())\
                                         .limit(5).all()
    
    # Get recent credit transactions
    recent_credits = Credit.query.filter_by(user_id=current_user.id)\
                                .order_by(Credit.date.desc())\
                                .limit(5).all()
    
    # Get blockchain stats
    blockchain_stats = BlockchainSimulator.get_blockchain_stats()
    
    return render_template('dashboard.html', 
                         total_credits=total_credits,
                         total_certificates=total_certificates,
                         recent_certificates=recent_certificates,
                         recent_credits=recent_credits,
                         blockchain_stats=blockchain_stats)

@app.route('/certificates', methods=['GET', 'POST'])
@login_required
def certificates():
    if request.method == 'POST':
        certificate_id = f"HC-{secrets.token_hex(8)}"
        hydrogen_amount = float(request.form['hydrogen_amount'])
        production_method = request.form['production_method']
        location = request.form['location']
        
        # Create certificate
        certificate = Certificate(
            user_id=current_user.id,
            certificate_id=certificate_id
        )
        
        meta_data = {
            'hydrogen_amount_kg': hydrogen_amount,
            'production_method': production_method,
            'location': location,
            'carbon_intensity': 0.0 if production_method == 'electrolysis_renewable' else 2.5
        }
        certificate.set_meta(meta_data)
        
        db.session.add(certificate)
        db.session.commit()
        
        # Add blockchain transaction
        transactions = [{
            'type': 'certificate_issued',
            'certificate_id': certificate_id,
            'user_id': current_user.id,
            'hydrogen_amount_kg': hydrogen_amount,
            'production_method': production_method,
            'location': location,
            'timestamp': datetime.utcnow().isoformat()
        }]
        BlockchainSimulator.add_block(transactions)
        
        flash('Certificate issued successfully!', 'success')
        return redirect(url_for('certificates'))
    
    # Get all user certificates
    user_certificates = Certificate.query.filter_by(user_id=current_user.id)\
                                        .order_by(Certificate.issue_date.desc()).all()
    
    return render_template('certificates.html', certificates=user_certificates)

@app.route('/credits', methods=['GET', 'POST'])
@login_required
def credits():
    if request.method == 'POST':
        action = request.form['action']
        
        if action == 'add':
            amount = float(request.form['amount'])
            source = request.form['source']
            
            credit = Credit(
                user_id=current_user.id,
                amount=amount,
                transaction_type='add'
            )
            credit.set_meta({'source': source, 'description': f'Credits added from {source}'})
            db.session.add(credit)
            db.session.commit()
            
            # Add blockchain transaction
            transactions = [{
                'type': 'credits_added',
                'user_id': current_user.id,
                'amount': amount,
                'source': source,
                'timestamp': datetime.utcnow().isoformat()
            }]
            BlockchainSimulator.add_block(transactions)
            
            flash(f'Added {amount} credits successfully!', 'success')
        
        elif action == 'transfer':
            recipient_username = request.form['recipient']
            amount = float(request.form['amount'])
            
            recipient = User.query.filter_by(username=recipient_username).first()
            if not recipient:
                flash('Recipient not found!', 'error')
                return redirect(url_for('credits'))
            
            if recipient.id == current_user.id:
                flash('Cannot transfer to yourself!', 'error')
                return redirect(url_for('credits'))
            
            current_balance = current_user.get_total_credits()
            if current_balance < amount:
                flash('Insufficient credits!', 'error')
                return redirect(url_for('credits'))
            
            # Create transfer out record
            credit_out = Credit(
                user_id=current_user.id,
                amount=amount,
                transaction_type='transfer_out'
            )
            credit_out.set_meta({
                'recipient_id': recipient.id,
                'recipient_username': recipient.username,
                'description': f'Transfer to {recipient.username}'
            })
            
            # Create transfer in record
            credit_in = Credit(
                user_id=recipient.id,
                amount=amount,
                transaction_type='transfer_in'
            )
            credit_in.set_meta({
                'sender_id': current_user.id,
                'sender_username': current_user.username,
                'description': f'Transfer from {current_user.username}'
            })
            
            db.session.add(credit_out)
            db.session.add(credit_in)
            db.session.commit()
            
            # Add blockchain transaction
            transactions = [{
                'type': 'credits_transferred',
                'from_user_id': current_user.id,
                'from_username': current_user.username,
                'to_user_id': recipient.id,
                'to_username': recipient.username,
                'amount': amount,
                'timestamp': datetime.utcnow().isoformat()
            }]
            BlockchainSimulator.add_block(transactions)
            
            flash(f'Transferred {amount} credits to {recipient.username}!', 'success')
    
    # Get user credit history
    user_credits = Credit.query.filter_by(user_id=current_user.id)\
                              .order_by(Credit.date.desc()).all()
    
    total_credits = current_user.get_total_credits()
    
    return render_template('credits.html', 
                         credits=user_credits, 
                         total_credits=total_credits)

@app.route('/blockchain')
@login_required
def blockchain():
    return render_template('blockchain.html')

@app.route('/api/blocks')
@login_required
def api_blocks():
    blocks = Block.query.order_by(Block.index).all()
    blocks_data = []
    
    for block in blocks:
        blocks_data.append({
            'index': block.index,
            'hash': block.hash,
            'previous_hash': block.previous_hash,
            'timestamp': block.timestamp.isoformat(),
            'transactions': block.get_transactions(),
            'nonce': block.nonce
        })
    
    return jsonify(blocks_data)

@app.route('/api/transactions')
@login_required
def api_transactions():
    blocks = Block.query.order_by(Block.index.desc()).all()
    all_transactions = []
    
    for block in blocks:
        transactions = block.get_transactions()
        for transaction in transactions:
            transaction['block_index'] = block.index
            transaction['block_hash'] = block.hash
            all_transactions.append(transaction)
    
    return jsonify(all_transactions)
