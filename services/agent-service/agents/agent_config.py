"""
Agent Configuration for NexusMind Chat UI
Defines all available AI agents with their capabilities
"""

from agno.agent import Agent
from agno.db.sqlite import SqliteDb
from agno.tools.tavily import TavilyTools
from tools.rag_tool import RAGTools
import os

# Shared session store. Without a db, add_history_to_context is a silent
# no-op and agents forget everything between turns.
_session_db = None

def get_session_db() -> SqliteDb:
    global _session_db
    if _session_db is None:
        db_path = os.getenv("AGNO_DB_PATH", "./data/agno.db")
        db_dir = os.path.dirname(db_path)
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)
        _session_db = SqliteDb(db_file=db_path)
    return _session_db

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


# Free OpenRouter model used when Groq hits its rate limit. Chosen for
# reliable free-tier availability and working tool calls.
FALLBACK_MODEL_ID = os.getenv("FALLBACK_MODEL", "nvidia/nemotron-3-super-120b-a12b:free")


def create_agent(agent_type: str, use_web_search: bool = False, use_rag: bool = True, user_id: str = None, use_fallback_model: bool = False) -> Agent:
    """
    Create an agent based on type

    Args:
        agent_type: The type of agent to create
        use_web_search: Whether to enable web search tools
        use_rag: Whether to enable RAG tools for document search
        user_id: User ID for RAG tools
        use_fallback_model: Use the OpenRouter fallback model instead of Groq
            (for when Groq is rate-limited)
    """
    if agent_type not in AGENT_CONFIGS:
        raise ValueError(f"Unknown agent type: {agent_type}")

    config = AGENT_CONFIGS[agent_type].copy()

    if use_fallback_model:
        from agno.models.openrouter import OpenRouter
        config["model"] = OpenRouter(id=FALLBACK_MODEL_ID)

    tools = []
    
    # Add Tavily tools for any agent when web search is enabled
    if use_web_search:
        tavily_api_key = os.getenv("TAVILY_API_KEY")
        if tavily_api_key:
            tools.append(TavilyTools(api_key=tavily_api_key))
        else:
            print("⚠️  Warning: TAVILY_API_KEY not found, web search disabled")
    
    # Add RAG tools if enabled — only with a real user_id; the file service
    # rejects requests with an empty x-user-id header
    if use_rag and user_id:
        tools.append(RAGTools(user_id=user_id))

    config["tools"] = tools

    # Persist session history so multi-turn context works
    config["db"] = get_session_db()
    # Agentic memory needs extra LLM round-trips per run and adds latency
    # and tool-call flakiness on Groq; session history already provides
    # multi-turn context
    config["enable_agentic_memory"] = False

    return Agent(**config)


def get_all_agents() -> list[Agent]:
    """Get all configured agents (without web search or user-scoped RAG tools)"""
    return [create_agent(agent_type, use_web_search=False, use_rag=False) for agent_type in AGENT_CONFIGS.keys()]


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
            # Tools are attached at request time (RAG always, web search
            # optionally), so every agent effectively has tools
            "has_tools": True,
        }
        for agent_type, config in AGENT_CONFIGS.items()
        if agent_type != "general"  # Hide general agent from selector
    ]
