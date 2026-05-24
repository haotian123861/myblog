import torch
from torchtext.data.utils import get_tokenizer
from torchtext.vocab import build_vocab_from_iterator
from torchtext.datasets import Multi30k
from typing import Iterable, List

# 语言对
SRC_LANGUAGE = 'de'  # 由于Multi30k是德英数据集，我们用德语代替法语
TGT_LANGUAGE = 'en'

# 获取分词器
token_transform = {
    SRC_LANGUAGE: get_tokenizer('spacy', language='de_core_news_sm'),
    TGT_LANGUAGE: get_tokenizer('spacy', language='en_core_web_sm')
}

# 特殊标记
special_symbols = ['<unk>', '<pad>', '<bos>', '<eos>']

def yield_tokens(data_iter: Iterable, language: str) -> List[str]:
    """生成分词后的文本"""
    language_index = {SRC_LANGUAGE: 0, TGT_LANGUAGE: 1}
    for data_sample in data_iter:
        yield token_transform[language](data_sample[language_index[language]])

def build_vocabulary():
    """构建词汇表"""
    # 加载Multi30k数据集
    train_iter = Multi30k(split='train', language_pair=(SRC_LANGUAGE, TGT_LANGUAGE))
    
    # 为源语言和目标语言构建词汇表
    vocab_transform = {
        SRC_LANGUAGE: build_vocab_from_iterator(
            yield_tokens(train_iter, SRC_LANGUAGE),
            min_freq=1,
            specials=special_symbols,
            special_first=True
        ),
        TGT_LANGUAGE: build_vocab_from_iterator(
            yield_tokens(train_iter, TGT_LANGUAGE),
            min_freq=1,
            specials=special_symbols,
            special_first=True
        )
    }
    
    # 设置未知标记
    for ln in vocab_transform.keys():
        vocab_transform[ln].set_default_index(vocab_transform[ln]['<unk>'])
    
    return vocab_transform

def tensor_transform(token_ids: List[int]):
    """转换为张量并添加特殊标记"""
    return torch.cat((
        torch.tensor([vocab_transform[TGT_LANGUAGE]['<bos>']], dtype=torch.int64),
        torch.tensor(token_ids, dtype=torch.int64),
        torch.tensor([vocab_transform[TGT_LANGUAGE]['<eos>']], dtype=torch.int64)
    ))

def sequential_transforms(*transforms):
    """组合多个转换函数"""
    def func(txt_input):
        for transform in transforms:
            txt_input = transform(txt_input)
        return txt_input
    return func

def collate_fn(batch):
    """数据批处理函数"""
    src_batch, tgt_batch = [], []
    for src_sample, tgt_sample in batch:
        src_batch.append(text_transform[SRC_LANGUAGE](src_sample.rstrip("\n")))
        tgt_batch.append(text_transform[TGT_LANGUAGE](tgt_sample.rstrip("\n")))
    
    src_batch = torch.nn.utils.rnn.pad_sequence(src_batch, padding_value=vocab_transform[SRC_LANGUAGE]['<pad>'])
    tgt_batch = torch.nn.utils.rnn.pad_sequence(tgt_batch, padding_value=vocab_transform[TGT_LANGUAGE]['<pad>'])
    
    return src_batch, tgt_batch

# 全局变量
vocab_transform = build_vocabulary()

# 文本转换链
text_transform = {
    SRC_LANGUAGE: sequential_transforms(
        token_transform[SRC_LANGUAGE],
        vocab_transform[SRC_LANGUAGE],
        tensor_transform
    ),
    TGT_LANGUAGE: sequential_transforms(
        token_transform[TGT_LANGUAGE],
        vocab_transform[TGT_LANGUAGE],
        tensor_transform
    )
}