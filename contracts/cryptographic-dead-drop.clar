;; Cryptographic Dead Drop

;; Define data vars
(define-data-var contract-owner principal tx-sender)

;; Define data maps
(define-map dead-drops
  { drop-id: uint }
  { sender: principal, recipient: principal, encrypted-message: (buff 1024), timestamp: uint })

(define-map user-drops
  { user: principal }
  { drop-ids: (list 100 uint) })

;; Define constants
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-DROP-NOT-FOUND (err u101))
(define-constant ERR-NOT-RECIPIENT (err u102))
(define-constant ERR-INVALID-MESSAGE (err u103))

;; Define variables
(define-data-var next-drop-id uint u0)

;; Create a new dead drop
(define-public (create-dead-drop (recipient principal) (encrypted-message (buff 1024)))
  (let
    (
      (sender tx-sender)
      (drop-id (var-get next-drop-id))
      (timestamp block-height)
    )
    (asserts! (> (len encrypted-message) u0) ERR-INVALID-MESSAGE)
    (map-set dead-drops
      { drop-id: drop-id }
      { sender: sender, recipient: recipient, encrypted-message: encrypted-message, timestamp: timestamp }
    )
    (var-set next-drop-id (+ drop-id u1))
    (let
      (
        (sender-drops (default-to { drop-ids: (list) } (map-get? user-drops { user: sender })))
        (recipient-drops (default-to { drop-ids: (list) } (map-get? user-drops { user: recipient })))
      )
      (map-set user-drops
        { user: sender }
        { drop-ids: (unwrap! (as-max-len? (append (get drop-ids sender-drops) drop-id) u100) ERR-NOT-AUTHORIZED) }
      )
      (map-set user-drops
        { user: recipient }
        { drop-ids: (unwrap! (as-max-len? (append (get drop-ids recipient-drops) drop-id) u100) ERR-NOT-AUTHORIZED) }
      )
    )
    (ok drop-id)
  )
)

;; Retrieve a dead drop
(define-public (retrieve-dead-drop (drop-id uint))
  (let
    (
      (drop (unwrap! (map-get? dead-drops { drop-id: drop-id }) ERR-DROP-NOT-FOUND))
      (recipient (get recipient drop))
    )
    (asserts! (is-eq tx-sender recipient) ERR-NOT-RECIPIENT)
    (ok (get encrypted-message drop))
  )
)

;; Get user's dead drops
(define-read-only (get-user-drops (user principal))
  (ok (default-to { drop-ids: (list) } (map-get? user-drops { user: user })))
)

;; Delete a dead drop (only allowed by the contract owner)
(define-public (delete-dead-drop (drop-id uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-AUTHORIZED)
    (map-delete dead-drops { drop-id: drop-id })
    (ok true)
  )
)

