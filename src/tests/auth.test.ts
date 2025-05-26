import request from 'supertest';
import { app } from '../index';

describe('Auth API', () => {
  describe('GET /api/auth/nonce', () => {
    it('should return a nonce', async () => {
      const response = await request(app)
        .get('/api/auth/nonce');

      expect(response.status).toBe(200);
      expect(response.body.nonce).toBeDefined();
      expect(typeof response.body.nonce).toBe('string');
    });
  });

  describe('POST /api/auth/complete-siwe', () => {
    it('should validate SIWE message', async () => {
      const nonceResponse = await request(app)
        .get('/api/auth/nonce');
      
      const nonce = nonceResponse.body.nonce;

      const siweData = {
        payload: {
          proof: {
            merkle_root: '0x123...',
            nullifier_hash: '0x456...',
            proof: '0x789...'
          }
        },
        nonce
      };

      const response = await request(app)
        .post('/api/auth/complete-siwe')
        .set('Cookie', [`siwe=${nonce}`])
        .send(siweData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.isValid).toBeDefined();
    });

    it('should reject invalid nonce', async () => {
      const siweData = {
        payload: {
          proof: {
            merkle_root: '0x123...',
            nullifier_hash: '0x456...',
            proof: '0x789...'
          }
        },
        nonce: 'invalid-nonce'
      };

      const response = await request(app)
        .post('/api/auth/complete-siwe')
        .set('Cookie', ['siwe=valid-nonce'])
        .send(siweData);

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'testpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });
  });
});

// Test básico para verificar que Jest funciona
it('Auth test placeholder', () => {
  expect(true).toBe(true);
}); 