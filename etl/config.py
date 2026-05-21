import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    'host':     os.getenv('DB_HOST', 'localhost'),
    'port':     os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'complaint_system'),
    'user':     os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', ''),
}

# Neon and other cloud providers require SSL
if os.getenv('DB_SSL', '').lower() in ('require', 'true', '1'):
    DB_CONFIG['sslmode'] = 'require'

DATASET_PATH = os.path.join(os.path.dirname(__file__), '..', 'datasets', 'complaints_dataset.csv')
SCHEMA_PATH  = os.path.join(os.path.dirname(__file__), '..', 'database', 'analytics_schema.sql')
