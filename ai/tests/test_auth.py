"""
Test JWT authentication for AI service
"""
import pytest
import jwt
import time
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import sys
import os

# Add parent directory to path to import app
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from app import app, get_ai_service_secret

client = TestClient(app)

class TestJWTAuthentication:
    
    def setup_method(self):
        """Setup test environment"""
        self.secret = "test-secret-for-jwt-auth"
        
    def create_test_token(self, 
                         exp_offset: int = 30,
                         iss: str = "paguyuban-next", 
                         aud: str = "paguyuban-ai",
                         nonce: str = "test-nonce") -> str:
        """Create a test JWT token"""
        now = int(time.time())
        payload = {
            "iss": iss,
            "aud": aud,
            "iat": now,
            "exp": now + exp_offset,
            "nbf": now - 10,
            "nonce": nonce,
            "service": "next-to-ai"
        }
        return jwt.encode(payload, self.secret, algorithm="HS256")
    
    @patch.dict(os.environ, {'AI_SERVICE_JWT_SECRET': 'test-secret-for-jwt-auth'})
    def test_health_endpoint_no_auth_required(self):
        """Test that health endpoint doesn't require authentication"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["healthy", "degraded"]
        assert "dependencies" in data
        
    @patch.dict(os.environ, {'AI_SERVICE_JWT_SECRET': 'test-secret-for-jwt-auth'})
    def test_chat_endpoint_requires_auth(self):
        """Test that chat endpoints require authentication"""
        response = client.post("/api/chat/generate", json={"query": "test"})
        assert response.status_code == 403  # No auth header
        
    @patch.dict(os.environ, {'AI_SERVICE_JWT_SECRET': 'test-secret-for-jwt-auth'})
    def test_valid_token_authentication(self):
        """Test successful authentication with valid token"""
        token = self.create_test_token()
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.post(
            "/api/chat/generate", 
            json={"query": "test query"},
            headers=headers
        )
        assert response.status_code == 200
        
    @patch.dict(os.environ, {'AI_SERVICE_JWT_SECRET': 'test-secret-for-jwt-auth'})
    def test_expired_token_rejection(self):
        """Test rejection of expired tokens"""
        token = self.create_test_token(exp_offset=-10)  # Expired 10 seconds ago
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.post(
            "/api/chat/generate", 
            json={"query": "test query"},
            headers=headers
        )
        assert response.status_code == 401
        assert "expired" in response.json()["detail"].lower()
        
    @patch.dict(os.environ, {'AI_SERVICE_JWT_SECRET': 'test-secret-for-jwt-auth'})
    def test_invalid_issuer_rejection(self):
        """Test rejection of tokens with wrong issuer"""
        token = self.create_test_token(iss="wrong-issuer")
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.post(
            "/api/chat/generate", 
            json={"query": "test query"},
            headers=headers
        )
        assert response.status_code == 401
        
    @patch.dict(os.environ, {'AI_SERVICE_JWT_SECRET': 'test-secret-for-jwt-auth'})
    def test_invalid_audience_rejection(self):
        """Test rejection of tokens with wrong audience"""
        token = self.create_test_token(aud="wrong-audience")
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.post(
            "/api/chat/generate", 
            json={"query": "test query"},
            headers=headers
        )
        assert response.status_code == 401
        
    @patch.dict(os.environ, {'AI_SERVICE_JWT_SECRET': 'test-secret-for-jwt-auth'})
    def test_wrong_secret_rejection(self):
        """Test rejection of tokens signed with wrong secret"""
        token = jwt.encode({
            "iss": "paguyuban-next",
            "aud": "paguyuban-ai",
            "iat": int(time.time()),
            "exp": int(time.time()) + 30,
            "nonce": "test"
        }, "wrong-secret", algorithm="HS256")
        
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.post(
            "/api/chat/generate", 
            json={"query": "test query"},
            headers=headers
        )
        assert response.status_code == 401
        
    @patch.dict(os.environ, {'AI_SERVICE_JWT_SECRET': 'test-secret-for-jwt-auth'})
    def test_malformed_token_rejection(self):
        """Test rejection of malformed tokens"""
        headers = {"Authorization": "Bearer not-a-real-jwt-token"}
        
        response = client.post(
            "/api/chat/generate", 
            json={"query": "test query"},
            headers=headers
        )
        assert response.status_code == 401
        
    def test_secret_fallback_development(self):
        """Test development secret fallback"""
        with patch.dict(os.environ, {}, clear=True):
            secret = get_ai_service_secret()
            assert secret == 'dev-secret-ai-service-auth-never-use-in-production'
            
    def test_secret_required_production(self):
        """Test that secret is required in production"""
        with patch.dict(os.environ, {'NODE_ENV': 'production'}, clear=True):
            with pytest.raises(RuntimeError, match="AI_SERVICE_JWT_SECRET must be configured"):
                get_ai_service_secret()
                
class TestAllEndpointAuth:
    """Test that all protected endpoints require authentication"""
    
    def setup_method(self):
        self.secret = "test-secret-for-jwt-auth"
    
    def create_valid_token(self) -> str:
        """Create a valid test token"""
        now = int(time.time())
        payload = {
            "iss": "paguyuban-next",
            "aud": "paguyuban-ai", 
            "iat": now,
            "exp": now + 30,
            "nbf": now - 10,
            "nonce": "test-nonce",
            "service": "next-to-ai"
        }
        return jwt.encode(payload, self.secret, algorithm="HS256")
    
    @patch.dict(os.environ, {'AI_SERVICE_JWT_SECRET': 'test-secret-for-jwt-auth'})
    def test_all_endpoints_require_auth(self):
        """Test that all protected endpoints require authentication"""
        protected_endpoints = [
            ("/api/chat/generate", {"query": "test"}),
            ("/api/event/chat", {"query": "test"}),
            ("/api/analytics/chat/summary", {"transcript": "test"})
        ]
        
        for endpoint, payload in protected_endpoints:
            # Test without auth
            response = client.post(endpoint, json=payload)
            assert response.status_code == 403, f"Endpoint {endpoint} should require auth"
            
            # Test with valid auth
            token = self.create_valid_token()
            headers = {"Authorization": f"Bearer {token}"}
            response = client.post(endpoint, json=payload, headers=headers)
            assert response.status_code == 200, f"Endpoint {endpoint} should work with valid auth"

if __name__ == "__main__":
    pytest.main([__file__, "-v"])