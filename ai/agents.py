"""
Legacy shim: re-export agents from ai.legacy for backward compatibility.
This module is deprecated; new integrations should prefer API-mediated agents.
"""
from legacy.agents import *  # noqa: F401,F403

