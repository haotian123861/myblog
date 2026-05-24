import argparse
import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from cli.intelligent_translator import get_intelligent_translator
from kg.neo4j_manager import get_neo4j_manager
from cli.ollama_manager import get_ollama_manager

def translate_command(args):
    """翻译命令处理函数"""
    translator = get_intelligent_translator()
    result = translator.translate(
        args.text,
        source_lang=args.source_lang,
        target_lang=args.target_lang,
        use_kg=not args.no_kg,
        use_llm=not args.no_llm
    )
    print(f"\n最终翻译结果: {result}")

def chat_command(args):
    """对话命令处理函数"""
    translator = get_intelligent_translator()
    result = translator.chat_with_translation(
        args.message,
        source_lang=args.source_lang,
        target_lang=args.target_lang
    )
    print(f"\nAI回复: {result}")

def explain_command(args):
    """解释命令处理函数"""
    translator = get_intelligent_translator()
    result = translator.explain_translation(
        args.text,
        source_lang=args.source_lang,
        target_lang=args.target_lang
    )
    print(f"\n{result}")

def related_phrases_command(args):
    """相关短语命令处理函数"""
    translator = get_intelligent_translator()
    phrases = translator.get_related_phrases(
        args.phrase,
        language=args.language,
        max_results=args.max_results
    )
    print(f"\n与 '{args.phrase}' 相关的短语:")
    for i, phrase in enumerate(phrases, 1):
        print(f"{i}. {phrase}")

def kg_query_command(args):
    """知识图谱查询命令处理函数"""
    neo4j_manager = get_neo4j_manager()
    result = neo4j_manager.query_translation(
        args.text,
        args.source_lang,
        args.target_lang
    )
    if result:
        print(f"\n查询结果:")
        for i, item in enumerate(result, 1):
            print(f"{i}. {item['translation']} (置信度: {item.get('confidence', 1.0)})")
    else:
        print(f"\n未找到 '{args.text}' 的翻译")

def ollama_list_command(args):
    """列出Ollama模型命令处理函数"""
    ollama_manager = get_ollama_manager()
    result = ollama_manager.list_models()
    if 'error' in result:
        print(f"\n错误: {result['error']}")
    else:
        print(f"\n可用的Ollama模型:")
        for model in result.get('models', []):
            print(f"- {model['name']} (大小: {model.get('size', '未知')}, 修改时间: {model.get('modified_at', '未知')})")

def interactive_mode():
    """交互式模式"""
    print("欢迎使用智能翻译与知识图谱交互系统")
    print("输入 'help' 查看可用命令")
    print("输入 'exit' 退出系统")
    
    translator = get_intelligent_translator()
    
    while True:
        command = input("\n> ").strip()
        
        if not command:
            continue
        
        if command.lower() == 'exit':
            print("再见！")
            break
        
        if command.lower() == 'help':
            print("可用命令:")
            print("  translate <文本> [--source_lang <源语言>] [--target_lang <目标语言>] [-no_kg] [-no_llm] - 翻译文本")
            print("  chat <消息> [--source_lang <源语言>] [--target_lang <目标语言>] - 与AI对话")
            print("  explain <文本> [--source_lang <源语言>] [--target_lang <目标语言>] - 解释翻译")
            print("  related <短语> [--language <语言>] [--max_results <数量>] - 获取相关短语")
            print("  kg_query <文本> --source_lang <源语言> --target_lang <目标语言> - 查询知识图谱")
            print("  ollama_list - 列出可用的Ollama模型")
            print("  exit - 退出系统")
            continue
        
        # 简单的命令解析
        parts = command.split()
        cmd = parts[0].lower()
        
        if cmd == 'translate' and len(parts) > 1:
            text = ' '.join(parts[1:])
            result = translator.translate(text)
            print(f"翻译结果: {result}")
        elif cmd == 'chat' and len(parts) > 1:
            message = ' '.join(parts[1:])
            result = translator.chat_with_translation(message)
            print(f"AI回复: {result}")
        elif cmd == 'explain' and len(parts) > 1:
            text = ' '.join(parts[1:])
            result = translator.explain_translation(text)
            print(result)
        elif cmd == 'related' and len(parts) > 1:
            phrase = ' '.join(parts[1:])
            phrases = translator.get_related_phrases(phrase)
            print(f"与 '{phrase}' 相关的短语:")
            for i, p in enumerate(phrases, 1):
                print(f"{i}. {p}")
        elif cmd == 'ollama_list':
            ollama_list_command(None)
        else:
            print(f"未知命令: {cmd}")
            print("输入 'help' 查看可用命令")

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='智能翻译与知识图谱交互系统')
    
    # 创建子命令解析器
    subparsers = parser.add_subparsers(dest='command', help='可用命令')
    
    # 翻译命令
    translate_parser = subparsers.add_parser('translate', help='翻译文本')
    translate_parser.add_argument('text', help='要翻译的文本')
    translate_parser.add_argument('--source_lang', default='fr', help='源语言')
    translate_parser.add_argument('--target_lang', default='en', help='目标语言')
    translate_parser.add_argument('--no_kg', action='store_true', help='不使用知识图谱')
    translate_parser.add_argument('--no_llm', action='store_true', help='不使用大语言模型')
    translate_parser.set_defaults(func=translate_command)
    
    # 对话命令
    chat_parser = subparsers.add_parser('chat', help='与AI对话')
    chat_parser.add_argument('message', help='要发送的消息')
    chat_parser.add_argument('--source_lang', default='zh', help='源语言')
    chat_parser.add_argument('--target_lang', default='zh', help='目标语言')
    chat_parser.set_defaults(func=chat_command)
    
    # 解释命令
    explain_parser = subparsers.add_parser('explain', help='解释翻译')
    explain_parser.add_argument('text', help='要解释的文本')
    explain_parser.add_argument('--source_lang', default='fr', help='源语言')
    explain_parser.add_argument('--target_lang', default='en', help='目标语言')
    explain_parser.set_defaults(func=explain_command)
    
    # 相关短语命令
    related_parser = subparsers.add_parser('related', help='获取相关短语')
    related_parser.add_argument('phrase', help='要查询的短语')
    related_parser.add_argument('--language', default='en', help='语言')
    related_parser.add_argument('--max_results', type=int, default=5, help='最大结果数量')
    related_parser.set_defaults(func=related_phrases_command)
    
    # 知识图谱查询命令
    kg_query_parser = subparsers.add_parser('kg_query', help='查询知识图谱')
    kg_query_parser.add_argument('text', help='要查询的文本')
    kg_query_parser.add_argument('--source_lang', required=True, help='源语言')
    kg_query_parser.add_argument('--target_lang', required=True, help='目标语言')
    kg_query_parser.set_defaults(func=kg_query_command)
    
    # Ollama列表命令
    ollama_list_parser = subparsers.add_parser('ollama_list', help='列出可用的Ollama模型')
    ollama_list_parser.set_defaults(func=ollama_list_command)
    
    # 交互式模式命令
    subparsers.add_parser('interactive', help='进入交互式模式')
    
    # 解析参数
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    if args.command == 'interactive':
        interactive_mode()
    else:
        args.func(args)

if __name__ == "__main__":
    main()