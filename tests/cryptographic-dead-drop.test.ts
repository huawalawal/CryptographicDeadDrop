import { describe, it, beforeEach, expect, vi } from 'vitest';

// Simulated contract state
let deadDrops: Map<number, { sender: string, recipient: string, encryptedMessage: Uint8Array, timestamp: number }>;
let userDrops: Map<string, number[]>;
let contractOwner: string;
let nextDropId: number;

// Simulated contract functions
function createDeadDrop(sender: string, recipient: string, encryptedMessage: Uint8Array): { success: boolean; result?: number; error?: string } {
  if (encryptedMessage.length === 0) {
    return { success: false, error: "Invalid message" };
  }
  const dropId = nextDropId++;
  const timestamp = Date.now();
  deadDrops.set(dropId, { sender, recipient, encryptedMessage, timestamp });
  
  const senderDrops = userDrops.get(sender) || [];
  const recipientDrops = userDrops.get(recipient) || [];
  senderDrops.push(dropId);
  recipientDrops.push(dropId);
  userDrops.set(sender, senderDrops);
  userDrops.set(recipient, recipientDrops);
  
  return { success: true, result: dropId };
}

function retrieveDeadDrop(caller: string, dropId: number): { success: boolean; result?: Uint8Array; error?: string } {
  const drop = deadDrops.get(dropId);
  if (!drop) {
    return { success: false, error: "Drop not found" };
  }
  if (caller !== drop.recipient) {
    return { success: false, error: "Not recipient" };
  }
  return { success: true, result: drop.encryptedMessage };
}

function getUserDrops(user: string): number[] {
  return userDrops.get(user) || [];
}

function deleteDeadDrop(caller: string, dropId: number): { success: boolean; error?: string } {
  if (caller !== contractOwner) {
    return { success: false, error: "Not authorized" };
  }
  if (!deadDrops.has(dropId)) {
    return { success: false, error: "Drop not found" };
  }
  deadDrops.delete(dropId);
  return { success: true };
}

describe('Cryptographic Dead Drop Contract', () => {
  beforeEach(() => {
    deadDrops = new Map();
    userDrops = new Map();
    contractOwner = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    nextDropId = 0;
  });
  
  it('should create a new dead drop', () => {
    const sender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const recipient = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const encryptedMessage = new Uint8Array([1, 2, 3, 4, 5]);
    const result = createDeadDrop(sender, recipient, encryptedMessage);
    expect(result.success).toBe(true);
    expect(result.result).toBe(0);
    expect(deadDrops.size).toBe(1);
    expect(userDrops.get(sender)).toContain(0);
    expect(userDrops.get(recipient)).toContain(0);
  });
  
  it('should not create a dead drop with an empty message', () => {
    const sender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const recipient = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const encryptedMessage = new Uint8Array([]);
    const result = createDeadDrop(sender, recipient, encryptedMessage);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid message");
  });
  
  it('should allow recipient to retrieve a dead drop', () => {
    const sender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const recipient = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const encryptedMessage = new Uint8Array([1, 2, 3, 4, 5]);
    const createResult = createDeadDrop(sender, recipient, encryptedMessage);
    const retrieveResult = retrieveDeadDrop(recipient, createResult.result!);
    expect(retrieveResult.success).toBe(true);
    expect(retrieveResult.result).toEqual(encryptedMessage);
  });
  
  it('should not allow non-recipient to retrieve a dead drop', () => {
    const sender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const recipient = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const nonRecipient = 'ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0';
    const encryptedMessage = new Uint8Array([1, 2, 3, 4, 5]);
    const createResult = createDeadDrop(sender, recipient, encryptedMessage);
    const retrieveResult = retrieveDeadDrop(nonRecipient, createResult.result!);
    expect(retrieveResult.success).toBe(false);
    expect(retrieveResult.error).toBe("Not recipient");
  });
  
  it('should return user\'s dead drops', () => {
    const sender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const recipient1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const recipient2 = 'ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0';
    const encryptedMessage = new Uint8Array([1, 2, 3, 4, 5]);
    createDeadDrop(sender, recipient1, encryptedMessage);
    createDeadDrop(sender, recipient2, encryptedMessage);
    const senderDrops = getUserDrops(sender);
    expect(senderDrops).toEqual([0, 1]);
  });
  
  it('should allow contract owner to delete a dead drop', () => {
    const sender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const recipient = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const encryptedMessage = new Uint8Array([1, 2, 3, 4, 5]);
    const createResult = createDeadDrop(sender, recipient, encryptedMessage);
    const deleteResult = deleteDeadDrop(contractOwner, createResult.result!);
    expect(deleteResult.success).toBe(true);
    expect(deadDrops.size).toBe(0);
  });
  
  it('should not allow non-owner to delete a dead drop', () => {
    const sender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const recipient = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const nonOwner = 'ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0';
    const encryptedMessage = new Uint8Array([1, 2, 3, 4, 5]);
    const createResult = createDeadDrop(sender, recipient, encryptedMessage);
    const deleteResult = deleteDeadDrop(nonOwner, createResult.result!);
    expect(deleteResult.success).toBe(false);
    expect(deleteResult.error).toBe("Not authorized");
    expect(deadDrops.size).toBe(1);
  });
});

