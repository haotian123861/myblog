from flask import Flask, render_template, request, jsonify
import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from cli.intelligent_translator import get_intelligent_translator
from config import FLASK_CONFIG

# 创建Flask应用
app = Flask(__name__, template_folder='templates')

# 获取智能翻译器实例
translator = get_intelligent_translator()

@app.route('/')
def index():
    """首页"""
    return render_template('index.html')

@app.route('/translate', methods=['POST'])
def translate():
    """翻译API"""
    data = request.get_json()
    text = data.get('text', '')
    source_lang = data.get('source_lang', 'fr')
    target_lang = data.get('target_lang', 'en')
    use_kg = data.get('use_kg', True)
    use_llm = data.get('use_llm', True)
    
    if not text:
        return jsonify({'error': '请输入要翻译的文本'}), 400
    
    try:
        result = translator.translate(
            text,
            source_lang=source_lang,
            target_lang=target_lang,
            use_kg=use_kg,
            use_llm=use_llm
        )
        return jsonify({'result': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    """对话API"""
    data = request.get_json()
    message = data.get('message', '')
    source_lang = data.get('source_lang', 'zh')
    target_lang = data.get('target_lang', 'zh')
    
    if not message:
        return jsonify({'error': '请输入对话内容'}), 400
    
    try:
        result = translator.chat_with_translation(
            message,
            source_lang=source_lang,
            target_lang=target_lang
        )
        return jsonify({'result': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/explain', methods=['POST'])
def explain():
    """解释API"""
    data = request.get_json()
    text = data.get('text', '')
    source_lang = data.get('source_lang', 'fr')
    target_lang = data.get('target_lang', 'en')
    
    if not text:
        return jsonify({'error': '请输入要解释的文本'}), 400
    
    try:
        result = translator.explain_translation(
            text,
            source_lang=source_lang,
            target_lang=target_lang
        )
        return jsonify({'result': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/related_phrases', methods=['POST'])
def related_phrases():
    """相关短语API"""
    data = request.get_json()
    phrase = data.get('phrase', '')
    language = data.get('language', 'en')
    max_results = data.get('max_results', 5)
    
    if not phrase:
        return jsonify({'error': '请输入要查询的短语'}), 400
    
    try:
        result = translator.get_related_phrases(
            phrase,
            language=language,
            max_results=max_results
        )
        return jsonify({'result': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    """启动Flask应用"""
    app.run(
        host=FLASK_CONFIG['host'],
        port=FLASK_CONFIG['port'],
        debug=FLASK_CONFIG['debug']
    )