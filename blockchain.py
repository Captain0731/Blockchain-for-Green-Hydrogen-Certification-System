import hashlib
import json
from datetime import datetime
from app import db
from models import Block

class BlockchainSimulator:
    @staticmethod
    def calculate_hash(index, previous_hash, timestamp, transactions, nonce):
        """Calculate the hash of a block"""
        block_string = f"{index}{previous_hash}{timestamp}{json.dumps(transactions)}{nonce}"
        return hashlib.sha256(block_string.encode()).hexdigest()
    
    @staticmethod
    def mine_block(index, previous_hash, transactions, difficulty=2):
        """Mine a new block with proof-of-work"""
        timestamp = datetime.utcnow().isoformat()
        nonce = 0
        target = "0" * difficulty
        
        while True:
            hash_result = BlockchainSimulator.calculate_hash(index, previous_hash, timestamp, transactions, nonce)
            if hash_result.startswith(target):
                return {
                    'index': index,
                    'previous_hash': previous_hash,
                    'timestamp': timestamp,
                    'transactions': transactions,
                    'nonce': nonce,
                    'hash': hash_result
                }
            nonce += 1
    
    @staticmethod
    def get_last_block():
        """Get the last block in the chain"""
        return Block.query.order_by(Block.index.desc()).first()
    
    @staticmethod
    def create_genesis_block():
        """Create the first block in the chain"""
        existing_genesis = Block.query.filter_by(index=0).first()
        if existing_genesis:
            return existing_genesis
        
        transactions = [{"type": "genesis", "message": "Genesis block for Green Hydrogen Platform"}]
        block_data = BlockchainSimulator.mine_block(0, "0", transactions, difficulty=2)
        
        genesis_block = Block(
            index=0,
            previous_hash="0",
            timestamp=datetime.fromisoformat(block_data['timestamp']),
            nonce=block_data['nonce'],
            hash=block_data['hash']
        )
        genesis_block.set_transactions(transactions)
        
        db.session.add(genesis_block)
        db.session.commit()
        return genesis_block
    
    @staticmethod
    def add_block(transactions):
        """Add a new block to the chain"""
        last_block = BlockchainSimulator.get_last_block()
        if not last_block:
            last_block = BlockchainSimulator.create_genesis_block()
        
        new_index = last_block.index + 1
        block_data = BlockchainSimulator.mine_block(new_index, last_block.hash, transactions, difficulty=2)
        
        new_block = Block(
            index=new_index,
            previous_hash=last_block.hash,
            timestamp=datetime.fromisoformat(block_data['timestamp']),
            nonce=block_data['nonce'],
            hash=block_data['hash']
        )
        new_block.set_transactions(transactions)
        
        db.session.add(new_block)
        db.session.commit()
        return new_block
    
    @staticmethod
    def get_blockchain_stats():
        """Get blockchain statistics"""
        total_blocks = Block.query.count()
        if total_blocks == 0:
            BlockchainSimulator.create_genesis_block()
            total_blocks = 1
        
        return {
            'total_blocks': total_blocks,
            'latest_block': BlockchainSimulator.get_last_block()
        }
