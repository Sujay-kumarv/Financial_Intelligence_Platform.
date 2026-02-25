"""
Memory Service for Sujay AI Analyst
Handles persistent vector storage and retrieval of financial interactions
Uses ChromaDB for embedding storage and semantic search
"""
try:
    import chromadb
    from chromadb.utils import embedding_functions
    CHROMA_AVAILABLE = True
except ImportError:
    CHROMA_AVAILABLE = False

import uuid
import os
from pathlib import Path
from typing import List, Dict, Any, Optional

class MemoryService:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MemoryService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
            
        if not CHROMA_AVAILABLE:
            self._initialized = True
            print("Memory Service: ChromaDB not available. Using dummy storage.")
            return

        # Initialize storage path
        db_path = os.path.join(os.getcwd(), "chroma_db")
        os.makedirs(db_path, exist_ok=True)
        
        # Initialize client
        self.client = chromadb.PersistentClient(path=db_path)
        
        # Default embedding function
        self.ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
        
        # Collections
        self.interactions = self.client.get_or_create_collection(
            name="financial_interactions",
            embedding_function=self.ef,
            metadata={"hnsw:space": "cosine"}
        )
        
        self.preferences = self.client.get_or_create_collection(
            name="user_preferences",
            embedding_function=self.ef
        )
        
        self._initialized = True

    def store_interaction(self, message_id: str, content: str, role: str, metadata: Dict[str, Any]):
        """Store a chat message in the vector database"""
        if not CHROMA_AVAILABLE:
            return
            
        self.interactions.add(
            ids=[message_id],
            documents=[content],
            metadatas=[{
                **metadata,
                "role": role,
                "timestamp": str(metadata.get("timestamp", ""))
            }]
        )

    def retrieve_context(self, query: str, filters: Optional[Dict] = None, n_results: int = 3) -> List[str]:
        """Retrieve relevant past interactions for context"""
        if not CHROMA_AVAILABLE:
            return []
            
        try:
            results = self.interactions.query(
                query_texts=[query],
                n_results=n_results,
                where=filters
            )
            return results['documents'][0] if results['documents'] else []
        except Exception as e:
            print(f"Memory Retrieval Error: {e}")
            return []

    def learn_preference(self, user_id: str, preference_text: str, category: str):
        """Update user preferences based on feedback or pattern analysis"""
        if not CHROMA_AVAILABLE:
            return
            
        pref_id = f"{user_id}_{category}_{uuid.uuid4().hex[:8]}"
        self.preferences.add(
            ids=[pref_id],
            documents=[preference_text],
            metadatas=[{"user_id": user_id, "category": category}]
        )

    def get_user_profile_context(self, user_id: str) -> str:
        """Retrieve summarized preferences and style for a specific user"""
        if not CHROMA_AVAILABLE:
            return "Standard professional tone, comprehensive analysis."
            
        try:
            results = self.preferences.query(
                query_texts=["user preferences style format"],
                n_results=5,
                where={"user_id": user_id}
            )
            if not results['documents'] or not results['documents'][0]:
                return "Standard professional tone, comprehensive analysis."
            
            return " | ".join(results['documents'][0])
        except:
            return "Standard professional tone."

# Singleton
memory_service = MemoryService()
