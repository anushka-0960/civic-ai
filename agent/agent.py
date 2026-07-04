# agent/agent.py
import os
import sys
from google.adk import Agent, Runner
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset, StdioServerParameters
from google.adk.sessions.in_memory_session_service import InMemorySessionService
from agent.instructions import SYSTEM_INSTRUCTION
from dotenv import load_dotenv

# Project directory paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)

# Load environment variables
env_local_path = os.path.join(PROJECT_ROOT, ".env.local")
env_path = os.path.join(PROJECT_ROOT, ".env")

if os.path.exists(env_local_path):
    print(f"Agent: Loading environment from {env_local_path}")
    load_dotenv(env_local_path)
else:
    print(f"Agent: Loading environment from {env_path}")
    load_dotenv(env_path)

# Verify key loading
gemini_key = os.getenv("GEMINI_API_KEY")
if gemini_key and gemini_key != "your_gemini_api_key_here":
    print("Agent: Environment loaded successfully.")
else:
    print("Agent WARNING: GEMINI_API_KEY not configured or is placeholder.")

# Setup path and environment for the local MCP subprocess
env = os.environ.copy()
env["PYTHONPATH"] = PROJECT_ROOT

# Stdio server configuration for local MCP server module execution
print("Agent: Setting up MCP Toolset connection parameters...")
connection_params = StdioServerParameters(
    command=sys.executable,
    args=["-m", "mcp_server.server"],
    cwd=PROJECT_ROOT,
    env=env
)

# Instantiate the MCP toolset
print("Agent: Instantiating MCP Toolset...")
mcp_toolset = MCPToolset(
    connection_params=connection_params
)

# Create the primary CivicAI Agent
print("Agent: Creating primary CivicAI Agent with model gemini-2.5-flash...")
civic_agent = Agent(
    name="CivicAI_Agent",
    model="gemini-2.5-flash",
    instruction=SYSTEM_INSTRUCTION,
    tools=[mcp_toolset]
)

# Instantiate Session Service and Runner
print("Agent: Instantiating Session Service and Runner...")
session_service = InMemorySessionService()
runner = Runner(
    app_name="CivicAI",
    agent=civic_agent,
    session_service=session_service
)

def get_runner() -> Runner:
    """Returns the configured runner instance."""
    return runner

