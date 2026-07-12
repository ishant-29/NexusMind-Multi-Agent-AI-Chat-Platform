"""
RAG (Retrieval-Augmented Generation) Tool for Agno
Searches user's uploaded documents for relevant context
"""

from agno.tools import Toolkit
from agno.tools.function import Function
import requests
import os
from typing import List, Dict, Any, Optional

FILE_SERVICE_URL = os.getenv("FILE_SERVICE_URL", "http://localhost:4003")


class RAGTools(Toolkit):
    """
    RAG Tools for searching user documents
    """

    def __init__(self, user_id: str = None):
        super().__init__(name="rag_tools")
        self.user_id = user_id

        self.register(self.search_documents)
        self.register(self.list_documents)
        self.register(self.get_document_info)

    def _service_headers(self) -> Dict[str, str]:
        """Internal service-to-service auth headers expected by the file service."""
        return {
            "Content-Type": "application/json",
            "x-service-key": os.getenv("SERVICE_API_KEY", "dev-service-key"),
            "x-user-id": self.user_id or "",
        }
    
    def search_documents(
        self,
        query: str,
        limit: int = 5,
        min_score: float = 0.3
    ) -> str:
        """
        Search through user's uploaded documents for relevant information.

        Use this tool when the user asks about content from their uploaded documents,
        or when you need to retrieve specific information from their knowledge base.
        Searches across all of the user's documents.

        Args:
            query: The search query or question
            limit: Maximum number of results to return (default: 5)
            min_score: Minimum similarity score threshold (0-1, default: 0.3)

        Returns:
            Relevant document excerpts with context
        """
        try:
            response = requests.post(
                f"{FILE_SERVICE_URL}/api/documents/search",
                json={
                    "query": query,
                    "limit": limit,
                    "minScore": min_score,
                },
                headers=self._service_headers(),
                timeout=30,
            )
            
            if response.status_code != 200:
                return f"Error searching documents: {response.text}"
            
            data = response.json()
            
            if not data.get("success"):
                return f"Search failed: {data.get('error', 'Unknown error')}"
            
            results = data.get("data", {}).get("results", [])
            
            if not results:
                return "No relevant information found in your documents."
            
            # Format results
            output = f"Found {len(results)} relevant excerpts:\n\n"
            
            for i, result in enumerate(results, 1):
                output += f"[{i}] From '{result['filename']}' (relevance: {result['score']:.2%}):\n"
                output += f"{result['content']}\n\n"
            
            return output.strip()
            
        except Exception as e:
            return f"Error searching documents: {str(e)}"
    
    def list_documents(self) -> str:
        """
        List all documents uploaded by the user.
        
        Use this to see what documents are available in the user's knowledge base.
        
        Returns:
            List of document names and their status
        """
        try:
            response = requests.get(
                f"{FILE_SERVICE_URL}/api/documents",
                headers=self._service_headers(),
                timeout=10,
            )
            
            if response.status_code != 200:
                return f"Error listing documents: {response.text}"
            
            data = response.json()
            
            if not data.get("success"):
                return f"Failed to list documents: {data.get('error', 'Unknown error')}"
            
            documents = data.get("data", [])
            
            if not documents:
                return "No documents uploaded yet."
            
            output = f"You have {len(documents)} document(s):\n\n"
            
            for doc in documents:
                status_emoji = {
                    'completed': '✅',
                    'processing': '⏳',
                    'failed': '❌'
                }.get(doc['status'], '❓')
                
                output += f"{status_emoji} {doc['originalName']}\n"
                output += f"   ID: {doc['_id']}\n"
                output += f"   Status: {doc['status']}\n"
                output += f"   Chunks: {doc.get('totalChunks', 0)}\n"
                output += f"   Uploaded: {doc['createdAt']}\n\n"
            
            return output.strip()
            
        except Exception as e:
            return f"Error listing documents: {str(e)}"
    
    def get_document_info(self, document_id: str) -> str:
        """
        Get detailed information about a specific document.
        
        Args:
            document_id: The ID of the document
        
        Returns:
            Detailed document information
        """
        try:
            response = requests.get(
                f"{FILE_SERVICE_URL}/api/documents/{document_id}",
                headers=self._service_headers(),
                timeout=10,
            )
            
            if response.status_code == 404:
                return "Document not found."
            
            if response.status_code != 200:
                return f"Error getting document info: {response.text}"
            
            data = response.json()
            
            if not data.get("success"):
                return f"Failed to get document info: {data.get('error', 'Unknown error')}"
            
            doc = data.get("data", {})
            
            output = f"Document: {doc['originalName']}\n"
            output += f"Status: {doc['status']}\n"
            output += f"File Type: {doc['fileType']}\n"
            output += f"File Size: {doc['fileSize']} bytes\n"
            output += f"Total Chunks: {doc.get('totalChunks', 0)}\n"
            
            if doc.get('metadata'):
                metadata = doc['metadata']
                if metadata.get('wordCount'):
                    output += f"Word Count: {metadata['wordCount']}\n"
                if metadata.get('totalPages'):
                    output += f"Total Pages: {metadata['totalPages']}\n"
            
            output += f"Uploaded: {doc['createdAt']}\n"
            output += f"Last Updated: {doc['updatedAt']}\n"
            
            return output.strip()
            
        except Exception as e:
            return f"Error getting document info: {str(e)}"


# Convenience function to create RAG tools
def create_rag_tools(user_id: str = None) -> RAGTools:
    """Create RAG tools instance"""
    return RAGTools(user_id=user_id)
