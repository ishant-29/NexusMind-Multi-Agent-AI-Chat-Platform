"""
Agent Configuration for MetaWurks Chat UI
Defines all available AI agents with their capabilities
"""

from agno.agent import Agent
from agno.tools.tavily import TavilyTools
from tools.rag_tool import RAGTools
import os

# Agent configurations dictionary
AGENT_CONFIGS = {
    # ============================================
    # HIDDEN DEFAULT AGENT
    # ============================================
    
    "general": {
        "name": "General Assistant",
        "model": "groq:llama-3.3-70b-versatile",
        "description": "General purpose AI assistant",
        "instructions": [
            "Be helpful, harmless, and honest",
            "Provide clear, concise answers",
            "Adapt your communication style to the user's needs",
            "Be conversational and friendly",
            "Ask clarifying questions when needed",
            "Provide examples to illustrate concepts",
            "If the user mentions documents or asks about uploaded content, use the RAG tools to search their documents"
        ],
        "tools": [],  # Tools added conditionally
        "enable_agentic_memory": True,
        "add_history_to_context": True,
        "num_history_runs": 5,
        "markdown": True,
    },
    
    # ============================================
    # VISIBLE AGENTS (3)
    # ============================================
    
    "research": {
        "name": "Research Agent",
        "model": "groq:llama-3.3-70b-versatile",
        "description": "Expert at web research and finding information",
        "instructions": [
            "Search the web for accurate, up-to-date information",
            "Cite your sources with URLs",
            "Provide comprehensive, well-structured answers",
            "Focus on credible sources (.edu, .gov, reputable publications)",
            "Cross-reference multiple sources when possible",
            "Summarize findings clearly with key takeaways",
            "Identify conflicting information and explain discrepancies",
            "Organize information in a logical hierarchy",
            "Include publication dates when relevant"
        ],
        "tools": [],  # Tools added conditionally based on web search button
        "enable_agentic_memory": True,
        "add_history_to_context": True,
        "num_history_runs": 10,
        "markdown": True,
    },
    
    "coding": {
        "name": "Coding Agent",
        "model": "groq:llama-3.3-70b-versatile",
        "description": "Expert at writing, explaining, and debugging code",
        "instructions": [
            "Write clean, well-documented code",
            "Explain your reasoning step by step",
            "Follow best practices and design patterns",
            "Provide examples and use cases",
            "Consider edge cases and error handling",
            "Use appropriate language-specific conventions",
            "Include comments for complex logic",
            "Suggest optimizations when relevant",
            "Explain time and space complexity",
            "Provide testing strategies",
            "Use modern syntax and features",
            "Consider security implications"
        ],
        "tools": [],
        "enable_agentic_memory": True,
        "add_history_to_context": True,
        "num_history_runs": 5,
        "markdown": True,
    },
    
    "creative": {
        "name": "Creative Writing Agent",
        "model": "groq:llama-3.3-70b-versatile",
        "description": "Expert at creative writing, storytelling, and content creation",
        "instructions": [
            "Be creative and imaginative",
            "Use vivid descriptions and engaging narratives",
            "Adapt tone and style to the request",
            "Provide multiple variations when helpful",
            "Consider the target audience",
            "Use literary devices effectively",
            "Make content engaging and memorable",
            "Maintain consistent voice and style",
            "Create compelling hooks and conclusions",
            "Use sensory details to enhance immersion",
            "Balance showing vs telling",
            "Develop authentic character voices"
        ],
        "tools": [],
        "enable_agentic_memory": True,
        "add_history_to_context": True,
        "num_history_runs": 5,
        "markdown": True,
    },
}


def create_agent(agent_type: str, use_web_search: bool = False, use_rag: bool = True, user_id: str = None) -> Agent:
    """
    Create an agent based on type
    
    Args:
        agent_type: The type of agent to create
        use_web_search: Whether to enable web search tools (only for research agent)
        use_rag: Whether to enable RAG tools for document search
        user_id: User ID for RAG tools
    """
    if agent_type not in AGENT_CONFIGS:
        raise ValueError(f"Unknown agent type: {agent_type}")
    
    config = AGENT_CONFIGS[agent_type].copy()
    tools = []
    
    # Add Tavily tools only for research agent when web search is enabled
    if agent_type == "research" and use_web_search:
        tavily_api_key = os.getenv("TAVILY_API_KEY")
        if tavily_api_key:
            tools.append(TavilyTools(api_key=tavily_api_key))
        else:
            print("⚠️  Warning: TAVILY_API_KEY not found, web search disabled")
    
    # Add RAG tools if enabled (for all agents)
    if use_rag:
        tools.append(RAGTools(user_id=user_id))
    
    config["tools"] = tools
    
    return Agent(**config)


def get_all_agents() -> list[Agent]:
    """Get all configured agents (without web search tools)"""
    return [create_agent(agent_type, use_web_search=False) for agent_type in AGENT_CONFIGS.keys()]


def get_agent_list() -> list[dict]:
    """
    Get list of available agents with metadata
    Excludes the 'general' agent as it's the hidden default
    """
    return [
        {
            "id": agent_type,
            "name": config["name"],
            "description": config["description"],
            "model": config["model"],
            "has_tools": len(config["tools"]) > 0,
        }
        for agent_type, config in AGENT_CONFIGS.items()
        if agent_type != "general"  # Hide general agent from selector
    ]
