"""
MetaWurks Agent Service
Main entry point for the Agno-powered agent microservice
"""

from agno.os import AgentOS
from agents.agent_config import get_all_agents, get_agent_list, create_agent
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Create all agents
print("🤖 Initializing agents...")
print("📦 Loading agents...")
agents = get_all_agents()
print(f"✅ Loaded {len(agents)} agents")
print(f"🎉 Available agents: {[agent.name for agent in agents]}")

# Create AgentOS
print("🚀 Starting AgentOS...")
agent_os = AgentOS(
    agents=agents,
    tracing=True,
)

# Get FastAPI app
app = agent_os.get_app()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CORS_ORIGIN", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "agent-service",
        "agents_count": len(agents),
        "agents": [agent.name for agent in agents],
        "timestamp": None,
    }

# List all available agents
@app.get("/api/agents/list")
async def list_agents():
    """List all available agents with metadata"""
    return {
        "success": True,
        "data": get_agent_list()
    }

# Get specific agent info
@app.get("/api/agents/{agent_id}")
async def get_agent_info(agent_id: str):
    """Get detailed info about a specific agent"""
    agent_list = get_agent_list()
    agent = next((a for a in agent_list if a["id"] == agent_id), None)
    
    if not agent:
        return {"success": False, "error": "Agent not found"}, 404
    
    return {"success": True, "data": agent}

# Custom agent run endpoint
@app.post("/api/agent/run")
async def run_agent_custom(request: dict):
    """Run an agent with a message"""
    from fastapi.responses import StreamingResponse
    import json
    
    agent_name = request.get("name", "General Assistant")
    message = request.get("message", "")
    session_id = request.get("session_id")
    user_id = request.get("user_id")
    stream = request.get("stream", True)
    use_web_search = request.get("use_web_search", False)
    use_rag = request.get("use_rag", True)
    
    # Get agent type from name
    agent_type = None
    for key, config in __import__('agents.agent_config', fromlist=['AGENT_CONFIGS']).AGENT_CONFIGS.items():
        if config["name"] == agent_name:
            agent_type = key
            break
    
    if not agent_type:
        return {"success": False, "error": f"Agent '{agent_name}' not found"}
    
    # Create agent with web search and RAG if enabled
    try:
        agent = create_agent(agent_type, use_web_search=use_web_search, use_rag=use_rag, user_id=user_id)
    except Exception as e:
        print(f"Error creating agent: {e}")
        return {"success": False, "error": f"Failed to create agent: {str(e)}"}
    
    # Run the agent
    if stream:
        async def generate():
            try:
                run_response = agent.run(message, stream=True, session_id=session_id)
                for chunk in run_response:
                    if hasattr(chunk, 'content') and chunk.content:
                        yield f"data: {json.dumps({'content': chunk.content})}\n\n"
                yield f"data: {json.dumps({'done': True})}\n\n"
            except Exception as e:
                print(f"Error running agent: {e}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        return StreamingResponse(generate(), media_type="text/event-stream")
    else:
        try:
            run_response = agent.run(message, stream=False, session_id=session_id)
            return {
                "success": True,
                "content": run_response.content if hasattr(run_response, 'content') else str(run_response),
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

# Agent usage statistics (simple in-memory tracking)
agent_usage_stats = {}

@app.post("/api/agents/{agent_id}/track")
async def track_agent_usage(agent_id: str):
    """Track agent usage for analytics"""
    if agent_id not in agent_usage_stats:
        agent_usage_stats[agent_id] = 0
    agent_usage_stats[agent_id] += 1
    return {"success": True, "count": agent_usage_stats[agent_id]}

@app.get("/api/agents/stats")
async def get_agent_stats():
    """Get agent usage statistics"""
    return {
        "success": True,
        "data": {
            "usage": agent_usage_stats,
            "total_requests": sum(agent_usage_stats.values())
        }
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AGNO_PORT", 7777))
    print(f"🚀 Agent Service starting on port {port}")
    print(f"📍 Health check: http://localhost:{port}/health")
    print(f"📍 API docs: http://localhost:{port}/docs")
    uvicorn.run(app, host="0.0.0.0", port=port)
