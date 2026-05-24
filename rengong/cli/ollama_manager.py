import requests
import json
from config import OLLAMA_CONFIG
from typing import Dict, Any

class OllamaManager:
    """Ollama模型管理器"""
    
    def __init__(self):
        """初始化Ollama连接"""
        self.base_url = OLLAMA_CONFIG['url']
        self.default_model = OLLAMA_CONFIG['model']
    
    def generate(self, prompt: str, model: str = None, stream: bool = False, options: Dict[str, Any] = None) -> Dict[str, Any]:
        """调用Ollama生成文本"""
        if model is None:
            model = self.default_model
        
        if options is None:
            options = {}
        
        url = f"{self.base_url}/api/generate"
        headers = {"Content-Type": "application/json"}
        
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": stream,
            "options": options
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload, stream=stream)
            response.raise_for_status()
            
            if stream:
                # 流式响应处理
                for line in response.iter_lines():
                    if line:
                        yield json.loads(line)
            else:
                # 非流式响应处理
                return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Ollama API请求错误: {e}")
            return {"error": str(e)}
    
    def chat(self, messages: list, model: str = None, stream: bool = False) -> Dict[str, Any]:
        """调用Ollama进行对话"""
        if model is None:
            model = self.default_model
        
        url = f"{self.base_url}/api/chat"
        headers = {"Content-Type": "application/json"}
        
        payload = {
            "model": model,
            "messages": messages,
            "stream": stream
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload, stream=stream)
            response.raise_for_status()
            
            if stream:
                # 流式响应处理
                for line in response.iter_lines():
                    if line:
                        yield json.loads(line)
            else:
                # 非流式响应处理
                return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Ollama API请求错误: {e}")
            return {"error": str(e)}
    
    def list_models(self) -> Dict[str, Any]:
        """列出可用模型"""
        url = f"{self.base_url}/api/tags"
        
        try:
            response = requests.get(url)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Ollama API请求错误: {e}")
            return {"error": str(e)}
    
    def pull_model(self, model: str, stream: bool = False) -> Dict[str, Any]:
        """拉取模型"""
        url = f"{self.base_url}/api/pull"
        headers = {"Content-Type": "application/json"}
        
        payload = {
            "name": model,
            "stream": stream
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload, stream=stream)
            response.raise_for_status()
            
            if stream:
                # 流式响应处理
                for line in response.iter_lines():
                    if line:
                        yield json.loads(line)
            else:
                # 非流式响应处理
                return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Ollama API请求错误: {e}")
            return {"error": str(e)}
    
    def translate_with_llm(self, text: str, source_lang: str, target_lang: str) -> str:
        """使用LLM进行翻译"""
        prompt = f"请将以下{source_lang}文本翻译成{target_lang}，仅返回翻译结果，不要添加任何解释或额外内容：\n{text}"
        
        response = self.generate(prompt, stream=False)
        
        if 'error' in response:
            return f"翻译失败: {response['error']}"
        
        return response.get('response', '').strip()
    
    def enhance_translation_with_kg(self, text: str, translation: str, kg_info: dict) -> str:
        """使用LLM结合知识图谱增强翻译"""
        # 构建包含知识图谱信息的提示
        kg_prompt = "知识图谱信息：\n"
        if 'sentence' in kg_info:
            kg_prompt += f"原句：{kg_info['sentence']['text']} ({kg_info['sentence']['language']})\n"
        if 'words' in kg_info:
            kg_prompt += "单词信息：\n"
            for word in kg_info['words']:
                kg_prompt += f"- {word['text']} (位置：{word['position']})\n"
        if 'translations' in kg_info and kg_info['translations']:
            kg_prompt += "已有的翻译：\n"
            for trans in kg_info['translations']:
                kg_prompt += f"- {trans['text']} (置信度：{trans.get('confidence', 1.0)})\n"
        
        prompt = f"请根据以下知识图谱信息和初始翻译，优化{text}的翻译：\n"
        prompt += f"{kg_prompt}\n"
        prompt += f"初始翻译：{translation}\n"
        prompt += "请返回优化后的翻译，仅返回翻译结果。"
        
        response = self.generate(prompt, stream=False)
        
        if 'error' in response:
            return translation  # 如果LLM调用失败，返回原始翻译
        
        return response.get('response', translation).strip()

# 创建全局实例
global_ollama_manager = OllamaManager()

def get_ollama_manager() -> OllamaManager:
    """获取Ollama管理器实例"""
    return global_ollama_manager