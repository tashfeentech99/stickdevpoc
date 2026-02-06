import { useState, useEffect, useRef } from 'react';

function App() {
    const [status, setStatus] = useState({ message: 'Initializing...', type: 'loading' });
    const [customerData, setCustomerData] = useState({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        phone: '1234567890'
    });
    const [cardReady, setCardReady] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const initializedRef = useRef(false);

    useEffect(() => {
        if (initializedRef.current) return;

        const initSticky = async () => {
            try {
                setStatus({ message: 'Loading Sticky SDK...', type: 'loading' });

                // Wait for SDK
                let retries = 0;
                let sdk = null;
                while (retries < 50) {
                    sdk = window.stickyio || (typeof stickyio !== 'undefined' ? stickyio : null);
                    if (sdk) break;
                    await new Promise(resolve => setTimeout(resolve, 100));
                    retries++;
                }

                if (!sdk) {
                    throw new Error('Sticky SDK not available. Check if script is blocked.');
                }

                setStatus({ message: 'SDK loaded! Getting config...', type: 'loading' });

                // Get app key from backend
                const configRes = await fetch('/api/sticky/config');
                const config = await configRes.json();

                setStatus({ message: 'Initializing payment form...', type: 'loading' });

                // Initialize SDK
                sdk.init(config.app_key, {
                    version: 2,
                    customCSS: `
            #stickyio_cc_number,
            #stickyio_cc_expiry,
            #stickyio_cc_cvv {
              font-size: 16px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 0;
              border: none;
              outline: none;
            }
          `,
                    cleanExistingCSS: false
                });

                // Set up event handlers
                sdk.onCardValidation = (valid) => {
                    setCardReady(valid);
                    if (valid) {
                        setStatus({ message: '✅ Card details valid!', type: 'success' });
                    }
                };

                sdk.onTokenError = (errors) => {
                    setStatus({ message: `❌ Card error: ${JSON.stringify(errors)}`, type: 'error' });
                    setProcessing(false);
                };

                setStatus({ message: '✅ Ready! Enter card details.', type: 'success' });
                initializedRef.current = true;

            } catch (error) {
                setStatus({ message: `❌ Init failed: ${error.message}`, type: 'error' });
                console.error('Init error:', error);
            }
        };

        initSticky();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const sdk = window.stickyio || stickyio;
        if (!sdk) {
            setStatus({ message: '❌ SDK not ready', type: 'error' });
            return;
        }

        setProcessing(true);
        setStatus({ message: 'Processing payment...', type: 'loading' });

        // Set up token success handler
        sdk.onTokenSuccess = async (token) => {
            try {
                setStatus({ message: '✅ Token received! Creating order...', type: 'success' });

                // Call backend to create order
                const response = await fetch('/api/sticky/new-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        payment_token: token,
                        product_id: 1,
                        first_name: customerData.firstName,
                        last_name: customerData.lastName,
                        email: customerData.email,
                        phone: customerData.phone,
                        country: 'US'
                    })
                });

                const data = await response.json();

                if (data.success) {
                    setStatus({ message: '✅ Order created successfully!', type: 'success' });
                    setResult(JSON.stringify(data, null, 2));
                } else {
                    throw new Error(data.error || 'Order creation failed');
                }

            } catch (error) {
                setStatus({ message: `❌ Order failed: ${error.message}`, type: 'error' });
                setResult(JSON.stringify({ error: error.message }, null, 2));
            } finally {
                setProcessing(false);
            }
        };

        // Trigger tokenization
        try {
            sdk.tokenizeCard();
        } catch (error) {
            setStatus({ message: `❌ Tokenization failed: ${error.message}`, type: 'error' });
            setProcessing(false);
        }
    };

    return (
        <div className="container">
            <h1>🧪 Sticky.io Full Test</h1>
            <p style={{ color: '#666', marginBottom: '20px' }}>
                Complete test with React frontend + Node backend
            </p>

            <div className={`status ${status.type}`}>
                {status.message}
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>First Name</label>
                    <input
                        type="text"
                        value={customerData.firstName}
                        onChange={(e) => setCustomerData({ ...customerData, firstName: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Last Name</label>
                    <input
                        type="text"
                        value={customerData.lastName}
                        onChange={(e) => setCustomerData({ ...customerData, lastName: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        value={customerData.email}
                        onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Phone</label>
                    <input
                        type="tel"
                        value={customerData.phone}
                        onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                        required
                    />
                </div>

                <div className="payment-fields">
                    <h3 style={{ marginBottom: '15px' }}>Payment Information</h3>

                    <div id="stickyio_card">
                        <div className="field-wrapper">
                            <label className="field-label">Card Number</label>
                            <div id="stickyio_cc_number"></div>
                        </div>

                        <div className="expiry-cvv">
                            <div className="field-wrapper">
                                <label className="field-label">Expiry Date</label>
                                <div id="stickyio_cc_expiry"></div>
                            </div>

                            <div className="field-wrapper">
                                <label className="field-label">CVV</label>
                                <div id="stickyio_cc_cvv"></div>
                            </div>
                        </div>
                    </div>

                    <input type="hidden" id="stickyio_payment_token" />
                </div>

                <button type="submit" disabled={!cardReady || processing}>
                    {processing ? 'Processing...' : 'Submit Payment'}
                </button>
            </form>

            {result && (
                <div className="result">
                    <strong>Result:</strong>
                    {result}
                </div>
            )}

            <div style={{ marginTop: '20px', padding: '12px', background: '#e7f3ff', borderRadius: '8px', fontSize: '13px' }}>
                <strong>Test Card:</strong> 4111 1111 1111 1111 | Exp: 12/25 | CVV: 123
            </div>
        </div>
    );
}

export default App;
