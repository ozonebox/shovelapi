export const Responses = {
  OTP_SENT: {
    responsecode: '66',
    responsemessage: 'An activation code has been sent to your registered email. Please check inbox, junk or spam!',
    userSessionStatus: 'pending',
  },
  OTP_SENT_FORGOT_PASSWORD: {
    responsecode: '00',
    responsemessage: 'An activation code has been sent to your registered email. Please check inbox, junk or spam!',
  },
  USER_ALREADY_VERIFIED: {
    responsecode: '68',
    responsemessage: 'User is already verified.',
  },
  PASSWORD_MISMATCH: {
    responsecode: '24',
    responsemessage: 'Passwords do not match.',
  },
  INVALID_REQUEST: {
    responsecode: '98',
    responsemessage: 'Invalid Request.',
  },
  INVALID_TRANSACTION: {
    responsecode: '42',
    responsemessage: 'Invalid or Expired Transaction.',
  },
   MNEMONIC_NOT_FOUND: {
    responsecode: '33',
    responsemessage: 'Invalid Request. Mne not set',
  },
  USER_NOT_VERIFIED: {
    responsecode: '67',
    responsemessage: 'An error has occured. User is not verified.',
  },
  USER_NOT_FOUND: {
    responsecode: '69',
    responsemessage: 'An error has occured. User not found.',
  },
  USER_ALREADY_EXISTS: {
    responsecode: '23',
    responsemessage: 'Email address already registered. Please login',
  },

  TOO_MANY_OTP_REQUESTS: {
    responsecode: '69',
    responsemessage: 'Too many OTP requests. Try again in 10 minutes.',
  },

  INVALID_LOGIN_CREDENTIALS: {
    responsecode: '11',
    responsemessage: 'Invalid email address or password. Please try again',
  },
  ACCOUNT_LOCKED: {
    responsecode: '71',
    responsemessage: 'Account locked due to too many failed login attempts.',
  },
  ACCOUNT_BLOCKED: {
    responsecode: '73',
    responsemessage: 'Your account has been blocked by an administrator.',
  },

  LOGIN_SUCCESS: {
    responsecode: '00',
    responsemessage: 'Login successful.',
    userSessionStatus: 'authenticated',
  },

  REGISTER_SUCCESS: {
    responsecode: '00',
    responsemessage: 'Your account has been registered. You may login now.',
    userSessionStatus: 'authenticated',
  },
  PASSWORD_RESET_SUCCESS: {
    responsecode: '00',
    responsemessage: 'Your account reset is successful. You may login now.',
  },
   DEPOSIT_ADDRESS_CREATED: {
    responsecode: '00',
    responsemessage: 'Your deposit address has been created. please deposit now.',
  },

  OTP_INVALID: {
    responsecode: '72',
    responsemessage: 'Invalid or expired OTP.',
  },

  INVALID_REQUEST_BODY: {
    responsecode: '33',
    responsemessage: 'Sorry an error occured. Try validating all fields correctly',
  },

  USER_VERIFIED: {
    responsecode: '00',
    responsemessage: 'User verified successfully.',
    userSessionStatus: 'active',
  },

  GENERIC_ERROR: {
    responsecode: '99',
    responsemessage: 'Something went wrong. Please try again.',
  },
  GET_TRANS_ERROR: {
    responsecode: '99',
    responsemessage: 'You must provide transactionReference, custTransactionReference, or depositAddress.',
  },
  TRANSACTION_NOT_FOUND: {
    responsecode: '12',
    responsemessage: 'Transaction not found',
  },
  TRANSACTION_FOUND: {
    responsecode: '00',
    responsemessage: 'Transaction(s) fetched successfully.',
  },
};
