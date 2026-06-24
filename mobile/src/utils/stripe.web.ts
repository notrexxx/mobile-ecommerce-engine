// This file is ONLY loaded on the Web. 
// It fakes the Stripe functions so the web compiler doesn't crash trying to read iOS code.
export const StripeProvider = ({ children }: any) => children;

export const useStripe = () => ({
  initPaymentSheet: async () => ({ error: null }),
  presentPaymentSheet: async () => ({ error: null }),
});