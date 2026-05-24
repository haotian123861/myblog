import torch
import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from translation.model import Encoder, Decoder, Attention, Seq2Seq
from translation.data_processor import vocab_transform, token_transform, SRC_LANGUAGE, TGT_LANGUAGE
from config import TRANSLATION_CONFIG

def load_model():
    """加载训练好的模型"""
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    # 词汇表大小
    input_dim = len(vocab_transform[SRC_LANGUAGE])
    output_dim = len(vocab_transform[TGT_LANGUAGE])
    
    # 初始化模型组件
    attention = Attention(TRANSLATION_CONFIG['hidden_dim'])
    encoder = Encoder(input_dim, TRANSLATION_CONFIG['embedding_dim'], 
                     TRANSLATION_CONFIG['hidden_dim'], TRANSLATION_CONFIG['num_layers'], 
                     TRANSLATION_CONFIG['dropout'])
    decoder = Decoder(output_dim, TRANSLATION_CONFIG['embedding_dim'], 
                     TRANSLATION_CONFIG['hidden_dim'], TRANSLATION_CONFIG['num_layers'], 
                     TRANSLATION_CONFIG['dropout'], attention)
    
    # 初始化Seq2Seq模型
    model = Seq2Seq(encoder, decoder, device).to(device)
    
    # 加载模型权重
    model.load_state_dict(torch.load(TRANSLATION_CONFIG['model_path'], map_location=device))
    model.eval()
    
    return model, device

def translate_sentence(sentence, model, device, max_len=50):
    """翻译单个句子"""
    # 分词
    tokens = token_transform[SRC_LANGUAGE](sentence)
    
    # 添加特殊标记并转换为张量
    tokens = [vocab_transform[SRC_LANGUAGE]['<bos>']] + \
            [vocab_transform[SRC_LANGUAGE][token] for token in tokens] + \
            [vocab_transform[SRC_LANGUAGE]['<eos>']]
    
    src_tensor = torch.LongTensor(tokens).unsqueeze(1).to(device)
    
    with torch.no_grad():
        encoder_outputs, hidden, cell = model.encoder(src_tensor)
        
        # 初始化输出序列
        trg_tokens = [vocab_transform[TGT_LANGUAGE]['<bos>']]
        
        for _ in range(max_len):
            trg_tensor = torch.LongTensor([trg_tokens[-1]]).to(device)
            
            output, hidden, cell = model.decoder(trg_tensor, hidden, cell, encoder_outputs)
            
            # 获取预测的标记
            pred_token = output.argmax(1).item()
            trg_tokens.append(pred_token)
            
            # 如果预测到<eos>标记，停止翻译
            if pred_token == vocab_transform[TGT_LANGUAGE]['<eos>']:
                break
    
    # 转换为文本
    trg_tokens = trg_tokens[1:-1]  # 移除<bos>和<eos>标记
    trg_tokens = [vocab_transform[TGT_LANGUAGE].get_itos()[token] for token in trg_tokens]
    
    return ' '.join(trg_tokens)

def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("用法: python translate.py <要翻译的句子>")
        return
    
    # 加载模型
    try:
        model, device = load_model()
    except FileNotFoundError:
        print(f"错误: 未找到模型文件 {TRANSLATION_CONFIG['model_path']}")
        print("请先运行 train.py 训练模型")
        return
    
    # 获取要翻译的句子
    sentence = ' '.join(sys.argv[1:])
    
    # 翻译句子
    translation = translate_sentence(sentence, model, device)
    
    print(f"源句子: {sentence}")
    print(f"翻译结果: {translation}")

if __name__ == "__main__":
    main()