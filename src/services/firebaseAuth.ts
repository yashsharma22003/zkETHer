import { 
  signInWithPhoneNumber, 
  ConfirmationResult, 
  User,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signOut as firebaseSignOut,
  RecaptchaVerifier
} from 'firebase/auth';
import { auth } from '../config/firebase';

export interface OTPConfirmation {
  confirm: (code: string) => Promise<any>;
}

export class FirebaseAuthService {
  /**
   * Send OTP to phone number
   * @param phoneNumber Phone number with country code (e.g., '+919876543210')
   * @param recaptchaVerifier reCAPTCHA verifier for React Native
   * @returns Promise that resolves to confirmation object
   */
  static async sendOTP(phoneNumber: string, recaptchaVerifier: any): Promise<ConfirmationResult> {
    try {
      const formattedPhone = phoneNumber.startsWith('+91') 
        ? phoneNumber 
        : `+91${phoneNumber}`;
      
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      return confirmation;
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw new Error('Failed to send OTP. Please try again.');
    }
  }

  /**
   * Verify OTP code
   * @param confirmation Confirmation object from sendOTP
   * @param code 6-digit OTP code
   * @returns Promise that resolves to user credential
   */
  static async verifyOTP(
    confirmation: ConfirmationResult, 
    code: string
  ): Promise<any> {
    try {
      const userCredential = await confirmation.confirm(code);
      return userCredential;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw new Error('Invalid OTP code. Please try again.');
    }
  }

  /**
   * Get current user
   */
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw new Error('Failed to sign out.');
    }
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChanged(callback: (user: User | null) => void) {
    return firebaseOnAuthStateChanged(auth, callback);
  }
}

export default FirebaseAuthService;
