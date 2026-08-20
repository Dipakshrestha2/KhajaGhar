// ============================================================================
// PAYMENT PROVIDER ABSTRACTION
// ============================================================================

export interface PaymentData {
  amount: number;
  currency: string;
  orderId: string;
  description?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  message?: string;
  redirectUrl?: string;
}

export interface PaymentVerification {
  verified: boolean;
  transactionId: string;
  amount: number;
  status: "COMPLETED" | "FAILED" | "PENDING";
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  message?: string;
}

export interface PaymentProvider {
  name: string;
  createPayment(data: PaymentData): Promise<PaymentResult>;
  verifyPayment(transactionId: string): Promise<PaymentVerification>;
  refundPayment(transactionId: string, amount?: number): Promise<RefundResult>;
}

// ============================================================================
// CASH ON DELIVERY PROVIDER
// ============================================================================

export class CashOnDeliveryProvider implements PaymentProvider {
  name = "cod";

  async createPayment(data: PaymentData): Promise<PaymentResult> {
    return {
      success: true,
      transactionId: `COD-${data.orderId}`,
      status: "PENDING",
      message: "Cash on delivery - payment will be collected upon delivery",
    };
  }

  async verifyPayment(transactionId: string): Promise<PaymentVerification> {
    return {
      verified: true,
      transactionId,
      amount: 0,
      status: "PENDING",
    };
  }

  async refundPayment(transactionId: string): Promise<RefundResult> {
    return {
      success: true,
      refundId: `REFUND-${transactionId}`,
      amount: 0,
      message: "Cash on delivery - no refund needed",
    };
  }
}

// ============================================================================
// DEMO PAYMENT PROVIDER (for testing without real credentials)
// ============================================================================

export class DemoPaymentProvider implements PaymentProvider {
  name = "demo";

  async createPayment(data: PaymentData): Promise<PaymentResult> {
    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simulate 95% success rate
    const isSuccess = Math.random() > 0.05;

    if (!isSuccess) {
      return {
        success: false,
        transactionId: "",
        status: "FAILED",
        message: "Demo payment failed (simulated failure)",
      };
    }

    const transactionId = `DEMO-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    return {
      success: true,
      transactionId,
      status: "COMPLETED",
      message: "Demo payment successful (NOT a real transaction)",
    };
  }

  async verifyPayment(transactionId: string): Promise<PaymentVerification> {
    return {
      verified: transactionId.startsWith("DEMO-"),
      transactionId,
      amount: 0,
      status: "COMPLETED",
    };
  }

  async refundPayment(transactionId: string, amount?: number): Promise<RefundResult> {
    return {
      success: true,
      refundId: `DEMO-REFUND-${Date.now()}`,
      amount: amount ?? 0,
      message: "Demo refund processed (NOT a real refund)",
    };
  }
}

// ============================================================================
// PAYMENT SERVICE FACTORY
// ============================================================================

const providers: Record<string, PaymentProvider> = {
  cod: new CashOnDeliveryProvider(),
  demo: new DemoPaymentProvider(),
};

export function getPaymentProvider(method: string): PaymentProvider {
  switch (method) {
    case "CASH_ON_DELIVERY":
      return providers.cod;
    case "ONLINE":
      // If Stripe credentials exist, use Stripe; else fall back to demo
      if (process.env.STRIPE_SECRET_KEY) {
        // TODO: Return StripePaymentProvider when credentials are configured
        return providers.demo;
      }
      return providers.demo;
    case "DEMO":
      return providers.demo;
    default:
      return providers.demo;
  }
}

export function isRealPayment(method: string): boolean {
  return method === "ONLINE" && !!process.env.STRIPE_SECRET_KEY;
}
