import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from translation.translate import load_model, translate_sentence
from kg.neo4j_manager import get_neo4j_manager
from config import TRANSLATION_CONFIG

class TranslationIntegrator:
    """翻译与知识图谱集成器"""
    
    def __init__(self):
        """初始化"""
        self.neo4j_manager = get_neo4j_manager()
        try:
            self.model, self.device = load_model()
            self.model_loaded = True
        except FileNotFoundError:
            self.model_loaded = False
            print(f"警告: 未找到翻译模型 {TRANSLATION_CONFIG['model_path']}")
            print("将使用简单的字典翻译")
    
    def translate_with_kg_update(self, source_text: str, source_lang: str, target_lang: str) -> str:
        """翻译文本并更新知识图谱"""
        # 先查询知识图谱是否已有翻译
        existing_translations = self.neo4j_manager.query_translation(
            source_text, source_lang, target_lang
        )
        
        if existing_translations:
            # 返回已有的翻译
            return existing_translations[0]['translation']
        
        # 如果模型已加载，使用模型翻译
        if self.model_loaded:
            translation = translate_sentence(source_text, self.model, self.device)
        else:
            # 简单的字典翻译（示例用）
            simple_dict = {
                "Hello world": "Bonjour le monde",
                "How are you": "Comment allez-vous",
                "Thank you": "Merci"
            }
            translation = simple_dict.get(source_text, "Translation not available")
        
        # 更新知识图谱
        self.neo4j_manager.build_translation_kg(
            source_text, translation, source_lang, target_lang
        )
        
        return translation
    
    def translate_word_with_kg_update(self, word: str, source_lang: str, target_lang: str) -> str:
        """翻译单词并更新知识图谱"""
        # 先查询知识图谱是否已有翻译
        existing_translations = self.neo4j_manager.query_word_translation(
            word, source_lang, target_lang
        )
        
        if existing_translations:
            # 返回已有的翻译
            return existing_translations[0]['translation']
        
        # 如果模型已加载，使用模型翻译（这里简化处理，实际应该用单词级别的模型）
        if self.model_loaded:
            # 使用整句翻译模型作为单词翻译（简化处理）
            translation = translate_sentence(word, self.model, self.device)
        else:
            # 简单的字典翻译
            simple_word_dict = {
                "Hello": "Bonjour",
                "world": "monde",
                "how": "comment",
                "are": "êtes",
                "you": "vous",
                "thank": "merci"
            }
            translation = simple_word_dict.get(word, "Translation not available")
        
        # 创建单词节点和关系
        source_word = self.neo4j_manager.create_word_node(word, source_lang)
        target_word = self.neo4j_manager.create_word_node(translation, target_lang)
        self.neo4j_manager.create_word_relationship(source_word['id'], target_word['id'])
        
        return translation
    
    def get_translation_history(self, language: str) -> list:
        """获取翻译历史"""
        with self.neo4j_manager.driver.session() as session:
            result = session.run(
                "MATCH (s:Translation)-[r:TRANSLATES_TO]->(t:Translation) "
                "WHERE s.language = $language "
                "RETURN s.text as source, t.text as target, t.language as target_lang, r.confidence as confidence",
                language=language
            )
            return [record.data() for record in result]

# 创建全局实例
global_translation_integrator = TranslationIntegrator()

def get_translation_integrator() -> TranslationIntegrator:
    """获取翻译集成器实例"""
    return global_translation_integrator