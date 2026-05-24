import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from cli.ollama_manager import get_ollama_manager
from kg.neo4j_manager import get_neo4j_manager
from translation.translate import load_model, translate_sentence
from config import TRANSLATION_CONFIG

class IntelligentTranslator:
    """智能翻译器，整合Ollama和知识图谱"""
    
    def __init__(self):
        """初始化组件"""
        self.ollama_manager = get_ollama_manager()
        self.neo4j_manager = get_neo4j_manager()
        
        # 尝试加载本地翻译模型
        try:
            self.model, self.device = load_model()
            self.local_model_available = True
        except FileNotFoundError:
            self.local_model_available = False
            print(f"警告: 未找到本地翻译模型 {TRANSLATION_CONFIG['model_path']}")
            print("将优先使用Ollama模型进行翻译")
    
    def translate(self, text: str, source_lang: str = 'fr', target_lang: str = 'en', use_kg: bool = True, use_llm: bool = True) -> str:
        """智能翻译方法"""
        print(f"翻译: {text}")
        print(f"从 {source_lang} 到 {target_lang}")
        
        # 1. 首先查询知识图谱是否已有翻译
        if use_kg:
            existing_translations = self.neo4j_manager.query_translation(text, source_lang, target_lang)
            if existing_translations:
                print(f"从知识图谱获取到翻译: {existing_translations[0]['translation']}")
                return existing_translations[0]['translation']
        
        # 2. 使用本地模型或Ollama进行初始翻译
        if self.local_model_available and not use_llm:
            print("使用本地Seq2Seq+Attention模型翻译...")
            initial_translation = translate_sentence(text, self.model, self.device)
        else:
            print("使用Ollama DeepSeek模型翻译...")
            initial_translation = self.ollama_manager.translate_with_llm(text, source_lang, target_lang)
        
        print(f"初始翻译结果: {initial_translation}")
        
        # 3. 如果使用知识图谱，更新知识图谱并获取增强信息
        enhanced_translation = initial_translation
        if use_kg:
            print("更新知识图谱...")
            self.neo4j_manager.build_translation_kg(text, initial_translation, source_lang, target_lang)
            
            # 获取知识图谱信息
            kg_info = self.neo4j_manager.get_translation_graph(text, source_lang)
            
            # 4. 如果使用LLM，结合知识图谱增强翻译
            if use_llm and kg_info:
                print("使用Ollama结合知识图谱增强翻译...")
                enhanced_translation = self.ollama_manager.enhance_translation_with_kg(
                    text, initial_translation, kg_info
                )
                print(f"增强后翻译结果: {enhanced_translation}")
        
        return enhanced_translation
    
    def chat_with_translation(self, message: str, source_lang: str = 'zh', target_lang: str = 'en') -> str:
        """结合翻译的对话功能"""
        # 先将用户输入翻译成英文（假设DeepSeek模型主要理解英文）
        if source_lang != 'en':
            translated_message = self.ollama_manager.translate_with_llm(message, source_lang, 'en')
        else:
            translated_message = message
        
        # 使用Ollama进行对话
        response = self.ollama_manager.generate(f"用户: {translated_message}\nAI:")
        
        if 'error' in response:
            return f"对话错误: {response['error']}"
        
        ai_response = response.get('response', '').strip()
        
        # 将AI响应翻译回目标语言
        if target_lang != 'en':
            translated_response = self.ollama_manager.translate_with_llm(ai_response, 'en', target_lang)
        else:
            translated_response = ai_response
        
        return translated_response
    
    def explain_translation(self, text: str, source_lang: str, target_lang: str) -> str:
        """解释翻译结果"""
        # 获取翻译
        translation = self.translate(text, source_lang, target_lang, use_kg=True, use_llm=True)
        
        # 构建解释提示
        prompt = f"请解释为什么将'{text}'({source_lang})翻译成'{translation}'({target_lang})。\n"
        prompt += "请从语法结构、词汇选择、文化背景等方面进行简要解释。"
        
        response = self.ollama_manager.generate(prompt)
        
        if 'error' in response:
            return f"解释生成错误: {response['error']}"
        
        explanation = response.get('response', '').strip()
        
        return f"翻译: {translation}\n解释: {explanation}"
    
    def get_related_phrases(self, phrase: str, language: str, max_results: int = 5) -> list:
        """获取相关短语"""
        prompt = f"请列出与'{phrase}'({language})相关的{max_results}个短语或表达，仅返回列表，不要添加其他内容。"
        
        response = self.ollama_manager.generate(prompt)
        
        if 'error' in response:
            return []
        
        phrases = response.get('response', '').strip().split('\n')
        
        # 清理结果
        cleaned_phrases = []
        for p in phrases:
            p = p.strip()
            if p and (p.startswith('-') or p[0].isdigit()):
                # 移除列表标记
                p = p.split(' ', 1)[1] if len(p.split(' ', 1)) > 1 else p
                cleaned_phrases.append(p)
        
        return cleaned_phrases[:max_results]

# 创建全局实例
global_intelligent_translator = IntelligentTranslator()

def get_intelligent_translator() -> IntelligentTranslator:
    """获取智能翻译器实例"""
    return global_intelligent_translator