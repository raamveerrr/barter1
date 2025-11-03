import { processTrade } from '../src';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions-test';

const testEnv = functions();

describe('processTrade', () => {
  let adminInitStub: jest.SpyInstance;
  let firestoreStub: any;

  beforeAll(() => {
    adminInitStub = jest.spyOn(admin, 'initializeApp').mockImplementation();
  });

  beforeEach(() => {
    // Reset stubs between tests
    firestoreStub = {
      collection: jest.fn(),
      runTransaction: jest.fn(),
    };

    // Mock admin.firestore()
    jest.spyOn(admin, 'firestore').mockImplementation(() => firestoreStub);
  });

  afterAll(() => {
    testEnv.cleanup();
    adminInitStub.mockRestore();
  });

  it('should reject unauthenticated requests', async () => {
    const wrapped = testEnv.wrap(processTrade);
    
    await expect(wrapped(
      { sellerId: 'seller123', itemId: 'item123' },
      { auth: null }
    )).rejects.toThrow('Must be authenticated to trade');
  });

  it('should prevent self-trading', async () => {
    const wrapped = testEnv.wrap(processTrade);
    
    await expect(wrapped(
      { sellerId: 'user123', itemId: 'item123' },
      { auth: { uid: 'user123' } }
    )).rejects.toThrow('Cannot buy your own item');
  });

  it('should complete a valid trade', async () => {
    const mockItem = {
      exists: true,
      data: () => ({
        status: 'available',
        ownerId: 'seller123',
        price: 100,
        title: 'Test Item'
      })
    };

    const mockBuyer = {
      exists: true,
      data: () => ({
        coinBalance: 500
      })
    };

    const mockSeller = {
      exists: true,
      data: () => ({
        coinBalance: 1000
      })
    };

    // Mock transaction gets
    const transactionGetStub = jest.fn()
      .mockResolvedValueOnce(mockItem)
      .mockResolvedValueOnce(mockBuyer)
      .mockResolvedValueOnce(mockSeller);

    // Mock transaction updates/sets
    const transactionUpdateStub = jest.fn();
    const transactionSetStub = jest.fn();

    // Mock the transaction
    firestoreStub.runTransaction.mockImplementation(async (callback) => {
      return callback({
        get: transactionGetStub,
        update: transactionUpdateStub,
        set: transactionSetStub
      });
    });

    const wrapped = testEnv.wrap(processTrade);

    const result = await wrapped(
      { sellerId: 'seller123', itemId: 'item123' },
      { auth: { uid: 'buyer123' } }
    );

    expect(result.success).toBe(true);
    expect(result.message).toBe('Trade completed successfully');
    
    // Verify transaction operations
    expect(transactionUpdateStub).toHaveBeenCalledTimes(3);
    expect(transactionSetStub).toHaveBeenCalledTimes(1);
  });

  it('should handle insufficient balance', async () => {
    const mockItem = {
      exists: true,
      data: () => ({
        status: 'available',
        ownerId: 'seller123',
        price: 1000,
        title: 'Expensive Item'
      })
    };

    const mockBuyer = {
      exists: true,
      data: () => ({
        coinBalance: 100 // Not enough coins
      })
    };

    // Mock transaction get
    const transactionGetStub = jest.fn()
      .mockResolvedValueOnce(mockItem)
      .mockResolvedValueOnce(mockBuyer);

    firestoreStub.runTransaction.mockImplementation(async (callback) => {
      return callback({
        get: transactionGetStub
      });
    });

    const wrapped = testEnv.wrap(processTrade);

    await expect(wrapped(
      { sellerId: 'seller123', itemId: 'item123' },
      { auth: { uid: 'buyer123' } }
    )).rejects.toThrow('Insufficient coins for purchase');
  });
});