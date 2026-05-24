import sys
import os
import unittest
from unittest.mock import MagicMock, patch

# 添加项目根目录到路径
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from seq2seq.attention_model import AttentionModel
from data.data_processor import DataProcessor
from kg.neo4j_manager import Neo4jManager
from kg.translation_integrator import TranslationIntegrator
from cli.ollama_manager import OllamaManager
from cli.intelligent_translator import IntelligentTranslator

class TestSeq2SeqAttention(unittest.TestCase):
    """测试Seq2Seq+Attention模型"""
    
    def setUp(self):
        """设置测试环境"""
        self.model = MagicMock(spec=AttentionModel)
        self.data_processor = MagicMock(spec=DataProcessor)
    
    def test_model_forward(self):
        """测试模型前向传播"""
        # 模拟输入
        input_seq = [1, 2, 3, 4, 5]
        target_seq = [6, 7, 8, 9, 10]
        
        # 设置模拟返回值
        self.model.forward.return_value = (MagicMock(), MagicMock())
        
        # 调用模型
        output, attention = self.model.forward(input_seq, target_seq)
        
        # 验证调用
        self.model.forward.assert_called_once_with(input_seq, target_seq)
        self.assertIsNotNone(output)
        self.assertIsNotNone(attention)

class TestKnowledgeGraph(unittest.TestCase):
    """测试知识图谱功能"""
    
    @patch('kg.neo4j_manager.GraphDatabase')
    def setUp(self, mock_graph):
        """设置测试环境"""
        self.neo4j_manager = Neo4jManager()
        self.translation_integrator = TranslationIntegrator()
    
    def test_neo4j_connection(self):
        """测试Neo4j连接"""
        # 验证连接方法存在
        self.assertTrue(hasattr(self.neo4j_manager, 'connect'))
        self.assertTrue(hasattr(self.neo4j_manager, 'close'))
    
    def test_add_translation(self):
        """测试添加翻译到知识图谱"""
        # 模拟添加翻译
        self.translation_integrator.add_translation_to_kg = MagicMock(return_value=True)
        
        result = self.translation_integrator.add_translation_to_kg("bonjour", "hello", "fr", "en")
        
        # 验证调用
        self.translation_integrator.add_translation_to_kg.assert_called_once_with("bonjour", "hello", "fr", "en")
        self.assertTrue(result)

class TestOllamaManager(unittest.TestCase):
    """测试Ollama管理器"""
    
    @patch('cli.ollama_manager.requests')
    def setUp(self, mock_requests):
        """设置测试环境"""
        self.ollama_manager = OllamaManager()
        mock_response = MagicMock()
        mock_response.json.return_value = {"response": "Hello, how can I help you?"}
        mock_requests.post.return_value = mock_response
    
    def test_ollama_generate(self):
        """测试Ollama生成功能"""
        # 模拟生成响应
        self.ollama_manager.generate = MagicMock(return_value="Hello, how can I help you?")
        
        result = self.ollama_manager.generate("Hello", model="deepseek-llm:1.5b")
        
        # 验证调用
        self.ollama_manager.generate.assert_called_once_with("Hello", model="deepseek-llm:1.5b")
        self.assertEqual(result, "Hello, how can I help you?")

class TestIntelligentTranslator(unittest.TestCase):
    """测试智能翻译器"""
    
    @patch('cli.intelligent_translator.Neo4jManager')
    @patch('cli.intelligent_translator.OllamaManager')
    def setUp(self, mock_ollama, mock_neo4j):
        """设置测试环境"""
        self.translator = IntelligentTranslator()
        
        # 设置模拟返回值
        mock_kg = MagicMock()
        mock_kg.query_translation.return_value = "hello"
        mock_neo4j.return_value = mock_kg
        
        mock_llm = MagicMock()
        mock_llm.generate.return_value = "hello"
        mock_ollama.return_value = mock_llm
    
    def test_translate_from_kg(self):
        """测试从知识图谱翻译"""
        # 模拟从知识图谱翻译
        self.translator.translate_from_kg = MagicMock(return_value="hello")
        
        result = self.translator.translate_from_kg("bonjour", "fr", "en")
        
        # 验证调用
        self.translator.translate_from_kg.assert_called_once_with("bonjour", "fr", "en")
        self.assertEqual(result, "hello")

if __name__ == '__main__':
    # 运行所有测试
    unittest.main()