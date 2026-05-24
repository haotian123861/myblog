import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 翻译模型配置
TRANSLATION_CONFIG = {
    'source_language': 'french',
    'target_language': 'english',
    'embedding_dim': 256,
    'hidden_dim': 512,
    'num_layers': 2,
    'dropout': 0.3,
    'batch_size': 64,
    'learning_rate': 0.001,
    'num_epochs': 20,
    'model_path': os.path.join(os.getcwd(), 'models', 'seq2seq_attention.pt')
}

# Neo4j知识图谱配置
NEO4J_CONFIG = {
    'uri': os.getenv('NEO4J_URI', 'bolt://localhost:7687'),
    'user': os.getenv('NEO4J_USER', 'neo4j'),
    'password': os.getenv('NEO4J_PASSWORD', 'password')
}

# Ollama配置
OLLAMA_CONFIG = {
    'url': os.getenv('OLLAMA_URL', 'http://localhost:11434'),
    'model': os.getenv('OLLAMA_MODEL', 'deepseek-r1:1.5b')
}

# Flask配置
FLASK_CONFIG = {
    'host': os.getenv('FLASK_HOST', '0.0.0.0'),
    'port': int(os.getenv('FLASK_PORT', 5000)),
    'debug': os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
}