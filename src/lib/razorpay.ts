import Razorpay from 'razorpay';

const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  throw new Error(
    'Please define RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local'
  );
}

export const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

export const RAZORPAY_KEY_SECRET_VALUE = RAZORPAY_KEY_SECRET;

export default razorpay;
