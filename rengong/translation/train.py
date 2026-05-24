import torch
import torch.nn as nn
import torch.optim as optim
from torchtext.datasets import Multi30k
from torch.utils.data import DataLoader
from tqdm import tqdm
import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from translation.model import Encoder, Decoder, Attention, Seq2Seq
from translation.data_processor import collate_fn, SRC_LANGUAGE, TGT_LANGUAGE, vocab_transform
from config import TRANSLATION_CONFIG

def main():
    # 设备配置
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"使用设备: {device}")
    
    # 加载数据集
    train_iter, valid_iter, test_iter = Multi30k(split=('train', 'valid', 'test'), 
                                                 language_pair=(SRC_LANGUAGE, TGT_LANGUAGE))
    
    # 创建数据加载器
    train_loader = DataLoader(list(train_iter), batch_size=TRANSLATION_CONFIG['batch_size'], 
                             shuffle=True, collate_fn=collate_fn)
    valid_loader = DataLoader(list(valid_iter), batch_size=TRANSLATION_CONFIG['batch_size'], 
                             collate_fn=collate_fn)
    
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
    
    # 初始化权重
    def init_weights(m):
        for name, param in m.named_parameters():
            nn.init.uniform_(param.data, -0.08, 0.08)
    
    model.apply(init_weights)
    
    # 损失函数和优化器
    criterion = nn.CrossEntropyLoss(ignore_index=vocab_transform[TGT_LANGUAGE]['<pad>'])
    optimizer = optim.Adam(model.parameters(), lr=TRANSLATION_CONFIG['learning_rate'])
    
    # 训练函数
    def train(model, loader, optimizer, criterion, device):
        model.train()
        epoch_loss = 0
        
        for src, trg in tqdm(loader, desc="训练中", leave=False):
            src, trg = src.to(device), trg.to(device)
            
            optimizer.zero_grad()
            
            output = model(src, trg)
            
            # 计算损失
            output_dim = output.shape[-1]
            output = output[1:].view(-1, output_dim)
            trg = trg[1:].view(-1)
            
            loss = criterion(output, trg)
            loss.backward()
            
            # 梯度裁剪
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1)
            
            optimizer.step()
            epoch_loss += loss.item()
        
        return epoch_loss / len(loader)
    
    # 验证函数
    def evaluate(model, loader, criterion, device):
        model.eval()
        epoch_loss = 0
        
        with torch.no_grad():
            for src, trg in tqdm(loader, desc="验证中", leave=False):
                src, trg = src.to(device), trg.to(device)
                
                output = model(src, trg, teacher_forcing_ratio=0)
                
                # 计算损失
                output_dim = output.shape[-1]
                output = output[1:].view(-1, output_dim)
                trg = trg[1:].view(-1)
                
                loss = criterion(output, trg)
                epoch_loss += loss.item()
        
        return epoch_loss / len(loader)
    
    # 训练循环
    best_valid_loss = float('inf')
    
    for epoch in range(1, TRANSLATION_CONFIG['num_epochs'] + 1):
        train_loss = train(model, train_loader, optimizer, criterion, device)
        valid_loss = evaluate(model, valid_loader, criterion, device)
        
        if valid_loss < best_valid_loss:
            best_valid_loss = valid_loss
            torch.save(model.state_dict(), TRANSLATION_CONFIG['model_path'])
            print(f"\n第 {epoch} 轮: 保存最佳模型")
        
        print(f"\n第 {epoch} 轮结果:")
        print(f"训练损失: {train_loss:.3f}")
        print(f"验证损失: {valid_loss:.3f}")
    
    print(f"\n训练完成! 最佳验证损失: {best_valid_loss:.3f}")
    print(f"模型已保存到: {TRANSLATION_CONFIG['model_path']}")

if __name__ == "__main__":
    main()