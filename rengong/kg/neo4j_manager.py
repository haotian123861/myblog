from neo4j import GraphDatabase
from config import NEO4J_CONFIG
from typing import List, Dict, Any

class Neo4jManager:
    """Neo4j知识图谱管理器"""
    
    def __init__(self):
        """初始化Neo4j连接"""
        self.driver = GraphDatabase.driver(
            NEO4J_CONFIG['uri'],
            auth=(NEO4J_CONFIG['user'], NEO4J_CONFIG['password'])
        )
    
    def close(self):
        """关闭数据库连接"""
        if self.driver:
            self.driver.close()
    
    def create_translation_node(self, text: str, language: str) -> Dict[str, Any]:
        """创建翻译节点"""
        with self.driver.session() as session:
            result = session.run(
                "MERGE (n:Translation {text: $text, language: $language}) "
                "RETURN id(n) as id, n.text as text, n.language as language",
                text=text, language=language
            )
            return result.single()
    
    def create_translation_relationship(self, src_node_id: int, tgt_node_id: int, confidence: float = 1.0):
        """创建翻译关系"""
        with self.driver.session() as session:
            session.run(
                "MATCH (a:Translation), (b:Translation) "
                "WHERE id(a) = $src_id AND id(b) = $tgt_id "
                "MERGE (a)-[r:TRANSLATES_TO {confidence: $confidence}]->(b)",
                src_id=src_node_id, tgt_id=tgt_node_id, confidence=confidence
            )
    
    def create_word_node(self, word: str, language: str, part_of_speech: str = None) -> Dict[str, Any]:
        """创建单词节点"""
        with self.driver.session() as session:
            result = session.run(
                "MERGE (n:Word {text: $word, language: $language}) "
                "SET n.part_of_speech = $pos "
                "RETURN id(n) as id, n.text as text, n.language as language",
                word=word, language=language, pos=part_of_speech
            )
            return result.single()
    
    def create_word_relationship(self, src_word_id: int, tgt_word_id: int, relationship_type: str = "TRANSLATES_TO"):
        """创建单词关系"""
        with self.driver.session() as session:
            session.run(
                "MATCH (a:Word), (b:Word) "
                "WHERE id(a) = $src_id AND id(b) = $tgt_id "
                f"MERGE (a)-[r:{relationship_type}]->(b)",
                src_id=src_word_id, tgt_id=tgt_word_id
            )
    
    def create_sentence_word_relationships(self, sentence_node_id: int, word_nodes: List[Dict[str, Any]]):
        """创建句子和单词之间的关系"""
        with self.driver.session() as session:
            for i, word_node in enumerate(word_nodes):
                session.run(
                    "MATCH (s:Translation), (w:Word) "
                    "WHERE id(s) = $sentence_id AND id(w) = $word_id "
                    "MERGE (s)-[r:CONTAINS {position: $position}]->(w)",
                    sentence_id=sentence_node_id, word_id=word_node['id'], position=i
                )
    
    def build_translation_kg(self, source_text: str, target_text: str, source_lang: str, target_lang: str):
        """构建翻译知识图谱"""
        # 创建源句子和目标句子节点
        source_node = self.create_translation_node(source_text, source_lang)
        target_node = self.create_translation_node(target_text, target_lang)
        
        # 创建翻译关系
        self.create_translation_relationship(source_node['id'], target_node['id'])
        
        # 分词并创建单词节点
        source_words = source_text.split()
        target_words = target_text.split()
        
        source_word_nodes = []
        for word in source_words:
            if word.strip():
                word_node = self.create_word_node(word.strip(), source_lang)
                source_word_nodes.append(word_node)
        
        target_word_nodes = []
        for word in target_words:
            if word.strip():
                word_node = self.create_word_node(word.strip(), target_lang)
                target_word_nodes.append(word_node)
        
        # 创建句子和单词的关系
        self.create_sentence_word_relationships(source_node['id'], source_word_nodes)
        self.create_sentence_word_relationships(target_node['id'], target_word_nodes)
        
        # 创建单词之间的翻译关系（简单的一一对应）
        min_len = min(len(source_word_nodes), len(target_word_nodes))
        for i in range(min_len):
            self.create_word_relationship(source_word_nodes[i]['id'], target_word_nodes[i]['id'])
        
        return {
            'source_sentence': source_node,
            'target_sentence': target_node,
            'source_words': source_word_nodes,
            'target_words': target_word_nodes
        }
    
    def query_translation(self, text: str, source_lang: str, target_lang: str) -> List[Dict[str, Any]]:
        """查询翻译"""
        with self.driver.session() as session:
            result = session.run(
                "MATCH (s:Translation {text: $text, language: $source_lang})-[r:TRANSLATES_TO]->(t:Translation) "
                "WHERE t.language = $target_lang "
                "RETURN t.text as translation, r.confidence as confidence",
                text=text, source_lang=source_lang, target_lang=target_lang
            )
            return [record.data() for record in result]
    
    def query_word_translation(self, word: str, source_lang: str, target_lang: str) -> List[Dict[str, Any]]:
        """查询单词翻译"""
        with self.driver.session() as session:
            result = session.run(
                "MATCH (s:Word {text: $word, language: $source_lang})-[r:TRANSLATES_TO]->(t:Word) "
                "WHERE t.language = $target_lang "
                "RETURN t.text as translation",
                word=word, source_lang=source_lang, target_lang=target_lang
            )
            return [record.data() for record in result]
    
    def get_translation_graph(self, text: str, language: str) -> Dict[str, Any]:
        """获取翻译的完整图谱"""
        with self.driver.session() as session:
            # 获取句子节点
            sentence_result = session.run(
                "MATCH (s:Translation {text: $text, language: $language}) "
                "RETURN id(s) as id, s.text as text, s.language as language",
                text=text, language=language
            )
            sentence_node = sentence_result.single()
            
            if not sentence_node:
                return None
            
            # 获取包含的单词
            words_result = session.run(
                "MATCH (s:Translation)-[r:CONTAINS]->(w:Word) "
                "WHERE id(s) = $sentence_id "
                "RETURN w.text as text, w.language as language, r.position as position "
                "ORDER BY r.position",
                sentence_id=sentence_node['id']
            )
            words = [record.data() for record in words_result]
            
            # 获取翻译
            translations_result = session.run(
                "MATCH (s:Translation)-[r:TRANSLATES_TO]->(t:Translation) "
                "WHERE id(s) = $sentence_id "
                "RETURN t.text as text, t.language as language, r.confidence as confidence",
                sentence_id=sentence_node['id']
            )
            translations = [record.data() for record in translations_result]
            
            return {
                'sentence': sentence_node,
                'words': words,
                'translations': translations
            }

# 创建全局实例
global_neo4j_manager = Neo4jManager()

def get_neo4j_manager() -> Neo4jManager:
    """获取Neo4j管理器实例"""
    return global_neo4j_manager