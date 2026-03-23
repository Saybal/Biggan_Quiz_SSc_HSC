/**
 * server/src/services/sslcommerz.js
 *
 * SSLCommerz payment gateway integration.
 *
 * How to get credentials (free sandbox):
 *   1. Go to https://developer.sslcommerz.com
 *   2. Register for a sandbox account
 *   3. Get STORE_ID and STORE_PASSWORD from the dashboard
 *   4. Use sandbox URL for testing, live URL for production
 *
 * Flow:
 *   1. Server calls initPayment() → gets a payment URL from SSLCommerz
 *   2. Client redirects user to that URL
 *   3. User pays on SSLCommerz's hosted page
 *   4. SSLCommerz POSTs IPN to our /api/payment/ipn endpoint
 *   5. Server validates the IPN, marks user as paid
 *   6. SSLCommerz redirects user to success/fail/cancel URL
 */
import crypto from 'crypto'

const IS_SANDBOX   = process.env.NODE_ENV !== 'production'
const SSLCOMMERZ_URL = IS_SANDBOX
  ? 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php'
  : 'https://securepay.sslcommerz.com/gwprocess/v4/api.php'

const VALIDATE_URL = IS_SANDBOX
  ? 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php'
  : 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php'

/**
 * Generate a unique transaction ID
 */
export function generateTranId() {
  const timestamp = Date.now()
  const random    = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `QUIZ_${timestamp}_${random}`
}

/**
 * Initiate a payment session with SSLCommerz.
 * Returns the GatewayPageURL to redirect the user to.
 *
 * @param {Object} params
 * @param {string} params.tranId       - unique transaction ID
 * @param {number} params.amount       - amount in BDT
 * @param {string} params.customerName
 * @param {string} params.customerEmail
 * @param {string} params.productName  - course title
 * @param {string} params.productId    - course MongoDB ID
 */
export async function initPayment({
  tranId,
  amount,
  customerName,
  customerEmail,
  productName,
  productId,
}) {
  const serverUrl = process.env.SERVER_URL || 'http://localhost:5000'
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'

  const payload = new URLSearchParams({
    store_id:      process.env.SSLCOMMERZ_STORE_ID,
    store_passwd:  process.env.SSLCOMMERZ_STORE_PASSWORD,
    total_amount:  String(amount),
    currency:      'BDT',
    tran_id:       tranId,

    // Redirect URLs (GET) — user is sent here after payment
    success_url:   `${serverUrl}/api/payment/success`,
    fail_url:      `${serverUrl}/api/payment/fail`,
    cancel_url:    `${serverUrl}/api/payment/cancel`,

    // IPN (POST) — SSLCommerz notifies us of payment status
    ipn_url:       `${serverUrl}/api/payment/ipn`,

    // Customer info
    cus_name:      customerName  || 'Student',
    cus_email:     customerEmail || 'student@quiz.com',
    cus_phone:     '01700000000',
    cus_add1:      'Bangladesh',
    cus_city:      'Dhaka',
    cus_country:   'Bangladesh',

    // Product info
    product_name:  productName || 'Quiz Course',
    product_category: 'Education',
    product_profile:  'non-physical-goods',

    // Shipping (required by SSLCommerz even for digital goods)
    shipping_method: 'NO',
    num_of_item:     '1',
    ship_name:       customerName || 'Student',
    ship_add1:       'Dhaka',
    ship_city:       'Dhaka',
    ship_country:    'Bangladesh',
  })

  const response = await fetch(SSLCOMMERZ_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    payload.toString(),
  })

  const data = await response.json()

  if (data.status !== 'SUCCESS') {
    throw new Error(`SSLCommerz init failed: ${data.failedreason || 'Unknown error'}`)
  }

  return {
    gatewayUrl: data.GatewayPageURL,
    sessionKey: data.sessionkey,
  }
}

/**
 * Validate an IPN or redirect response from SSLCommerz.
 * Always validate before marking a payment as successful.
 *
 * @param {string} valId  - val_id from SSLCommerz response
 * @returns {Object} validation response from SSLCommerz
 */
export async function validatePayment(valId) {
  const url = `${VALIDATE_URL}?val_id=${valId}&store_id=${process.env.SSLCOMMERZ_STORE_ID}&store_passwd=${process.env.SSLCOMMERZ_STORE_PASSWORD}&format=json`

  const response = await fetch(url)
  const data     = await response.json()
  return data
}
