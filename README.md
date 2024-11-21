# Cryptographic Dead Drop Smart Contract

A Clarity smart contract implementing a secure, decentralized dead drop system for encrypted message exchange between parties.

## Overview

This smart contract enables secure, asynchronous communication through encrypted messages stored on-chain. It implements the concept of a "dead drop" - a secure location where one party can leave an encrypted message for another to retrieve later.

## Features

- **Secure Message Exchange**
    - End-to-end encryption support
    - Recipient-only message retrieval
    - Timestamped message delivery
    - Large message support (up to 1024 bytes)

- **User Management**
    - Track drops per user
    - Separate sender and recipient tracking
    - Maximum 100 drops per user
    - Automatic drop ID assignment

- **Privacy Features**
    - On-chain encrypted storage
    - Recipient verification
    - Controlled message access
    - Secure message deletion

## Contract Functions

### Public Functions

1. `create-dead-drop (recipient principal) (encrypted-message (buff 1024))`
    - Creates new encrypted dead drop
    - Parameters:
        - `recipient`: Target user's principal
        - `encrypted-message`: Encrypted message data (max 1024 bytes)
    - Returns: Drop ID or error
    - Errors:
        - ERR-INVALID-MESSAGE if message is empty
        - ERR-NOT-AUTHORIZED if drop list is full

2. `retrieve-dead-drop (drop-id uint)`
    - Retrieves encrypted message from dead drop
    - Parameters:
        - `drop-id`: Unique identifier of the drop
    - Returns: Encrypted message or error
    - Errors:
        - ERR-DROP-NOT-FOUND if drop doesn't exist
        - ERR-NOT-RECIPIENT if caller isn't recipient

3. `delete-dead-drop (drop-id uint)`
    - Deletes a dead drop (contract owner only)
    - Parameters:
        - `drop-id`: Drop to delete
    - Returns: Success or error
    - Errors:
        - ERR-NOT-AUTHORIZED if not contract owner

### Read-Only Functions

1. `get-user-drops (user principal)`
    - Returns list of drop IDs for a user
    - Parameters:
        - `user`: Principal to query
    - Returns: List of drop IDs

## Data Structures

### Dead Drops Map
```clarity
(define-map dead-drops
  { drop-id: uint }
  { 
    sender: principal, 
    recipient: principal, 
    encrypted-message: (buff 1024), 
    timestamp: uint 
  })
```

### User Drops Map
```clarity
(define-map user-drops
  { user: principal }
  { drop-ids: (list 100 uint) })
```

## Error Codes

- `ERR-NOT-AUTHORIZED (u100)`: Operation not permitted
- `ERR-DROP-NOT-FOUND (u101)`: Dead drop doesn't exist
- `ERR-NOT-RECIPIENT (u102)`: Caller is not the intended recipient
- `ERR-INVALID-MESSAGE (u103)`: Message is empty or invalid

## Usage Example

```clarity
;; Create a dead drop
(create-dead-drop 
  'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
  0x123456789ABCDEF...)  ;; encrypted message

;; Retrieve a dead drop
(retrieve-dead-drop u1)

;; Check user's drops
(get-user-drops 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
```

## Security Considerations

1. **Message Security**
    - Messages must be encrypted before submission
    - Only encrypted content is stored on-chain
    - Key exchange must happen off-chain
    - Message size limit prevents DoS attacks

2. **Access Control**
    - Only recipients can retrieve messages
    - Only contract owner can delete drops
    - Automatic tracking prevents unauthorized access

3. **Privacy**
    - Message contents are encrypted
    - Only recipient principals are visible on-chain
    - Timestamps provide audit capability
    - Deletion capability for sensitive data

## Implementation Notes

1. **Message Encryption**
    - Implementation assumes off-chain encryption
    - Supports any encryption algorithm
    - Message format is flexible within size limit
    - No on-chain encryption/decryption

2. **Storage Efficiency**
    - Fixed buffer size for messages
    - Limited number of drops per user
    - Automatic ID assignment
    - Efficient lookup structure

3. **Scalability**
    - Bounded message size
    - Limited user drop list
    - Efficient map structure
    - Owner cleanup capability

## Future Improvements

1. **Enhanced Features**
    - Message expiration mechanism
    - Multi-recipient support
    - Message acknowledgment
    - Selective drop deletion

2. **Privacy Enhancements**
    - Zero-knowledge proofs
    - Hidden recipient addresses
    - Automated cleanup
    - Timelocked messages

3. **User Experience**
    - Batch operations
    - Message categories
    - Priority levels
    - Read receipts

## Testing

Recommended test scenarios:

1. Message Creation
    - Valid message creation
    - Empty message handling
    - Maximum size messages
    - Invalid recipient

2. Message Retrieval
    - Authorized retrieval
    - Unauthorized retrieval
    - Non-existent drops
    - Multiple retrievals

3. User Management
    - Drop list management
    - Maximum drops limit
    - User lookup
    - Delete operation

