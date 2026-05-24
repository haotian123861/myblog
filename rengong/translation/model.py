import torch
import torch.nn as nn
import torch.nn.functional as F

class Encoder(nn.Module):
    """编码器模块"""
    def __init__(self, input_dim, embedding_dim, hidden_dim, n_layers, dropout):
        super().__init__()
        self.embedding = nn.Embedding(input_dim, embedding_dim)
        self.rnn = nn.LSTM(embedding_dim, hidden_dim, n_layers, dropout=dropout, bidirectional=True)
        self.fc_hidden = nn.Linear(hidden_dim * 2, hidden_dim)
        self.fc_cell = nn.Linear(hidden_dim * 2, hidden_dim)
        self.dropout = nn.Dropout(dropout)
    
    def forward(self, src):
        # src shape: (src_len, batch_size)
        embedded = self.dropout(self.embedding(src))
        # embedded shape: (src_len, batch_size, embedding_dim)
        
        outputs, (hidden, cell) = self.rnn(embedded)
        # outputs shape: (src_len, batch_size, hidden_dim * 2)
        # hidden shape: (n_layers * 2, batch_size, hidden_dim)
        # cell shape: (n_layers * 2, batch_size, hidden_dim)
        
        # 将双向LSTM的最后一层输出合并
        hidden = self.fc_hidden(torch.cat((hidden[-2,:,:], hidden[-1,:,:]), dim=1))
        cell = self.fc_cell(torch.cat((cell[-2,:,:], cell[-1,:,:]), dim=1))
        # hidden shape: (batch_size, hidden_dim)
        # cell shape: (batch_size, hidden_dim)
        
        return outputs, hidden, cell

class Attention(nn.Module):
    """注意力机制模块"""
    def __init__(self, hidden_dim):
        super().__init__()
        self.attn = nn.Linear(hidden_dim * 3, hidden_dim)
        self.v = nn.Linear(hidden_dim, 1, bias=False)
    
    def forward(self, hidden, encoder_outputs):
        # hidden shape: (batch_size, hidden_dim)
        # encoder_outputs shape: (src_len, batch_size, hidden_dim * 2)
        
        src_len = encoder_outputs.shape[0]
        batch_size = encoder_outputs.shape[1]
        
        # 重复隐藏状态以匹配编码器输出的长度
        hidden = hidden.unsqueeze(1).repeat(1, src_len, 1)
        # hidden shape: (batch_size, src_len, hidden_dim)
        
        encoder_outputs = encoder_outputs.permute(1, 0, 2)
        # encoder_outputs shape: (batch_size, src_len, hidden_dim * 2)
        
        # 计算注意力能量
        energy = torch.tanh(self.attn(torch.cat((hidden, encoder_outputs), dim=2)))
        # energy shape: (batch_size, src_len, hidden_dim)
        
        attention = self.v(energy).squeeze(2)
        # attention shape: (batch_size, src_len)
        
        return F.softmax(attention, dim=1)

class Decoder(nn.Module):
    """解码器模块"""
    def __init__(self, output_dim, embedding_dim, hidden_dim, n_layers, dropout, attention):
        super().__init__()
        self.output_dim = output_dim
        self.attention = attention
        self.embedding = nn.Embedding(output_dim, embedding_dim)
        self.rnn = nn.LSTM(hidden_dim * 2 + embedding_dim, hidden_dim, n_layers, dropout=dropout)
        self.fc_out = nn.Linear(hidden_dim * 3 + embedding_dim, output_dim)
        self.dropout = nn.Dropout(dropout)
    
    def forward(self, input, hidden, cell, encoder_outputs):
        # input shape: (batch_size)
        # hidden shape: (batch_size, hidden_dim)
        # cell shape: (batch_size, hidden_dim)
        # encoder_outputs shape: (src_len, batch_size, hidden_dim * 2)
        
        input = input.unsqueeze(0)
        # input shape: (1, batch_size)
        
        embedded = self.dropout(self.embedding(input))
        # embedded shape: (1, batch_size, embedding_dim)
        
        # 计算注意力权重
        a = self.attention(hidden, encoder_outputs).unsqueeze(1)
        # a shape: (batch_size, 1, src_len)
        
        encoder_outputs = encoder_outputs.permute(1, 0, 2)
        # encoder_outputs shape: (batch_size, src_len, hidden_dim * 2)
        
        # 计算上下文向量
        context = torch.bmm(a, encoder_outputs).permute(1, 0, 2)
        # context shape: (1, batch_size, hidden_dim * 2)
        
        # 连接嵌入向量和上下文向量
        rnn_input = torch.cat((embedded, context), dim=2)
        # rnn_input shape: (1, batch_size, hidden_dim * 2 + embedding_dim)
        
        output, (hidden, cell) = self.rnn(rnn_input, (hidden.unsqueeze(0), cell.unsqueeze(0)))
        # output shape: (1, batch_size, hidden_dim)
        # hidden shape: (n_layers, batch_size, hidden_dim)
        # cell shape: (n_layers, batch_size, hidden_dim)
        
        hidden = hidden.squeeze(0)
        cell = cell.squeeze(0)
        embedded = embedded.squeeze(0)
        context = context.squeeze(0)
        output = output.squeeze(0)
        
        # 计算最终输出
        prediction = self.fc_out(torch.cat((output, context, embedded), dim=1))
        # prediction shape: (batch_size, output_dim)
        
        return prediction, hidden, cell

class Seq2Seq(nn.Module):
    """Seq2Seq模型"""
    def __init__(self, encoder, decoder, device):
        super().__init__()
        self.encoder = encoder
        self.decoder = decoder
        self.device = device
    
    def forward(self, src, trg, teacher_forcing_ratio=0.5):
        # src shape: (src_len, batch_size)
        # trg shape: (trg_len, batch_size)
        
        batch_size = src.shape[1]
        trg_len = trg.shape[0]
        trg_vocab_size = self.decoder.output_dim
        
        # 存储解码器输出
        outputs = torch.zeros(trg_len, batch_size, trg_vocab_size).to(self.device)
        
        # 获取编码器输出
        encoder_outputs, hidden, cell = self.encoder(src)
        
        # 第一个输入是<bos>标记
        input = trg[0, :]
        
        for t in range(1, trg_len):
            # 解码一步
            output, hidden, cell = self.decoder(input, hidden, cell, encoder_outputs)
            
            # 存储输出
            outputs[t] = output
            
            # 决定是否使用教师强制
            teacher_force = torch.rand(1).item() < teacher_forcing_ratio
            
            # 获取预测的标记
            top1 = output.argmax(1)
            
            # 下一个输入是真实标记或预测标记
            input = trg[t] if teacher_force else top1
        
        return outputs

    def translate(self, src, max_len=50):
        """用于推理的翻译函数"""
        # src shape: (src_len, 1)
        
        with torch.no_grad():
            encoder_outputs, hidden, cell = self.encoder(src)
            
            # 初始化输出序列
            outputs = [torch.tensor([vocab_transform[TGT_LANGUAGE]['<bos>']]).to(self.device)]
            
            for _ in range(max_len):
                input = torch.tensor([outputs[-1]]).to(self.device)
                output, hidden, cell = self.decoder(input, hidden, cell, encoder_outputs)
                
                # 获取预测的标记
                top1 = output.argmax(1).item()
                outputs.append(top1)
                
                # 如果预测到<eos>标记，停止翻译
                if top1 == vocab_transform[TGT_LANGUAGE]['<eos>']:
                    break
        
        return outputs

# 导入词汇表（需要先运行data_processor.py）
from .data_processor import vocab_transform, SRC_LANGUAGE, TGT_LANGUAGE