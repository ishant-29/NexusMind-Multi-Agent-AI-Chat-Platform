"""
NexusMind Agent Service
Main entry point for the Agno-powered agent microservice
"""

from agno.os import AgentOS
from agents.agent_config import get_all_agents, get_agent_list, create_agent, AGENT_CONFIGS
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from datetime import datetime, timezone
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
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

# List all available agents
@app.get("/api/agents/list")
async def list_agents():
    """List all available agents with metadata"""
    return {
        "success": True,
        "data": get_agent_list()
    }

# Agent usage statistics (simple in-memory tracking)
# NOTE: must be registered before the /api/agents/{agent_id} route,
# otherwise "stats" is matched as an agent_id
agent_usage_stats = {}

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

# Get specific agent info
@app.get("/api/agents/{agent_id}")
async def get_agent_info(agent_id: str):
    """Get detailed info about a specific agent"""
    from fastapi.responses import JSONResponse

    agent_list = get_agent_list()
    agent = next((a for a in agent_list if a["id"] == agent_id), None)

    if not agent:
        return JSONResponse(status_code=404, content={"success": False, "error": "Agent not found"})

    return {"success": True, "data": agent}

# Custom agent run endpoint
@app.post("/api/agent/run")
async def run_agent_custom(request: dict):
    """Run an agent with a message"""
    from fastapi.responses import StreamingResponse
    import json
    
    from fastapi.responses import JSONResponse

    agent_name = request.get("name", "General Assistant")
    message = request.get("message", "")
    session_id = request.get("session_id")
    user_id = request.get("user_id")
    stream = request.get("stream", True)
    use_web_search = request.get("use_web_search", False)
    use_rag = request.get("use_rag", True)

    # Get agent type from name
    agent_type = None
    for key, config in AGENT_CONFIGS.items():
        if config["name"] == agent_name:
            agent_type = key
            break

    # Errors must be non-200 so the Next.js proxy's `!response.ok` branch
    # fires; a 200 JSON body gets parsed as an empty SSE stream and the
    # user sees a blank reply
    if not agent_type:
        return JSONResponse(status_code=404, content={"success": False, "error": f"Agent '{agent_name}' not found"})

    # Create agent with web search and RAG if enabled
    try:
        agent = create_agent(agent_type, use_web_search=use_web_search, use_rag=use_rag, user_id=user_id)
    except Exception as e:
        print(f"Error creating agent: {e}")
        return JSONResponse(status_code=500, content={"success": False, "error": f"Failed to create agent: {str(e)}"})
    
    # Failure handling:
    # - "tool_use_failed": Groq's Llama occasionally emits malformed tool-call
    #   syntax; a fresh run almost always succeeds, so retry on the same model.
    # - rate limit: Groq's free tier has a daily token cap; rebuild the agent
    #   on the free OpenRouter fallback model and retry there.
    MAX_ATTEMPTS = 3

    def is_tool_failure(text) -> bool:
        return "tool_use_failed" in str(text)

    def is_rate_limited(text) -> bool:
        t = str(text)
        return "rate_limit_exceeded" in t or "Rate limit reached" in t or "rate limit" in t.lower()

    def is_provider_error(text) -> bool:
        # agno embeds provider failures (rate limit, invalid key, outage)
        # as literal `{"error": ...}` JSON in the run content rather than
        # raising, so detect that shape too
        t = str(text).strip()
        return is_tool_failure(t) or is_rate_limited(t) or t.startswith('{"error"')

    def make_fallback_agent():
        from agents.agent_config import FALLBACK_MODEL_ID
        print(f"⚠️  Groq rate-limited — falling back to OpenRouter model {FALLBACK_MODEL_ID}")
        return create_agent(
            agent_type,
            use_web_search=use_web_search,
            use_rag=use_rag,
            user_id=user_id,
            use_fallback_model=True,
        )

    # Run the agent.
    # NOTE: generate() is a plain sync generator on purpose — Starlette runs
    # sync generators in a threadpool, so the blocking agent.run()/Groq HTTP
    # iteration doesn't freeze the event loop for other requests.
    if stream:
        def generate():
            current_agent = agent
            using_fallback = False
            try:
                for attempt in range(MAX_ATTEMPTS):
                    last_attempt = attempt == MAX_ATTEMPTS - 1
                    try:
                        run_response = current_agent.run(message, stream=True, session_id=session_id)
                        chunks = iter(run_response)

                        # Peek at the first content chunk to detect a failed run
                        # before streaming anything to the client
                        first = None
                        for chunk in chunks:
                            if hasattr(chunk, 'content') and chunk.content:
                                first = chunk.content
                                break
                    except Exception as run_err:
                        # Any hard failure of the primary model (rate limit,
                        # outage, auth) → try the fallback model once
                        if not using_fallback and not last_attempt:
                            print(f"Primary model failed ({run_err}); using fallback")
                            current_agent = make_fallback_agent()
                            using_fallback = True
                            continue
                        raise

                    if first is not None and is_provider_error(first) and not last_attempt:
                        for _ in chunks:
                            pass  # drain the failed run
                        # tool_use_failed is transient model flakiness → retry same
                        # model once; any other provider error → switch to fallback
                        if not is_tool_failure(first) and not using_fallback:
                            print(f"Primary model error ({str(first)[:120]}); using fallback")
                            current_agent = make_fallback_agent()
                            using_fallback = True
                        else:
                            print(f"Run failed, retrying (attempt {attempt + 2}/{MAX_ATTEMPTS})...")
                        continue

                    if first is not None:
                        yield f"data: {json.dumps({'content': first})}\n\n"
                    for chunk in chunks:
                        if hasattr(chunk, 'content') and chunk.content:
                            # Never surface raw provider error JSON to the user
                            if is_provider_error(chunk.content):
                                continue
                            yield f"data: {json.dumps({'content': chunk.content})}\n\n"
                    break

                yield f"data: {json.dumps({'done': True})}\n\n"
            except Exception as e:
                print(f"Error running agent: {e}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        return StreamingResponse(generate(), media_type="text/event-stream")
    else:
        from starlette.concurrency import run_in_threadpool
        current_agent = agent
        using_fallback = False
        try:
            content = None
            for attempt in range(MAX_ATTEMPTS):
                last_attempt = attempt == MAX_ATTEMPTS - 1
                try:
                    # Blocking call — run off the event loop
                    run_response = await run_in_threadpool(
                        current_agent.run, message, stream=False, session_id=session_id
                    )
                except Exception as run_err:
                    if not using_fallback and not last_attempt:
                        print(f"Primary model failed ({run_err}); using fallback")
                        current_agent = make_fallback_agent()
                        using_fallback = True
                        continue
                    raise
                content = run_response.content if hasattr(run_response, 'content') else str(run_response)
                if not is_provider_error(content):
                    break
                if not last_attempt and not is_tool_failure(content) and not using_fallback:
                    print(f"Primary model error ({str(content)[:120]}); using fallback")
                    current_agent = make_fallback_agent()
                    using_fallback = True
                elif not last_attempt:
                    print(f"Run failed, retrying (attempt {attempt + 2}/{MAX_ATTEMPTS})...")
            return {
                "success": True,
                "content": content,
            }
        except Exception as e:
            return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

@app.post("/api/agents/{agent_id}/track")
async def track_agent_usage(agent_id: str):
    """Track agent usage for analytics"""
    if agent_id not in agent_usage_stats:
        agent_usage_stats[agent_id] = 0
    agent_usage_stats[agent_id] += 1
    return {"success": True, "count": agent_usage_stats[agent_id]}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AGNO_PORT", 7777))
    print(f"🚀 Agent Service starting on port {port}")
    print(f"📍 Health check: http://localhost:{port}/health")
    print(f"📍 API docs: http://localhost:{port}/docs")
    uvicorn.run(app, host="0.0.0.0", port=port)
