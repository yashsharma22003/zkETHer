import { auth } from '../config/firebase';
import { 
  signInWithPhoneNumber, 
  PhoneAuthProvider, 
  signInWithCredential,
  RecaptchaVerifier,
  ApplicationVerifier
} from 'firebase/auth';

export class FirebaseAuthService {
  private verificationId: string | null = null;
  private recaptchaVerifier: ApplicationVerifier | null = null;

  // Set reCAPTCHA verifier (required for web compatibility)
  setRecaptchaVerifier(verifier: ApplicationVerifier) {
    this.recaptchaVerifier = verifier;
  }

  // Send OTP to phone number
  async sendOTP(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.recaptchaVerifier) {
        throw new Error('reCAPTCHA verifier not set');
      }

      const confirmationResult = await signInWithPhoneNumber(
        auth, 
        phoneNumber, 
        this.recaptchaVerifier
      );
      
      this.verificationId = confirmationResult.verificationId;
      
      return { success: true };
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to send OTP' 
      };
    }
  }

  // Verify OTP code
  async verifyOTP(otpCode: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.verificationId) {
        throw new Error('No verification ID found. Please send OTP first.');
      }

      const credential = PhoneAuthProvider.credential(this.verificationId, otpCode);
      const userCredential = await signInWithCredential(auth, credential);
      
      console.log('Phone authentication successful:', userCredential.user.uid);
      
      return { success: true };
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      return { 
        success: false, 
        error: error.message || 'Invalid OTP code' 
      };
    }
  }

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  }

  // Sign out
  async signOut(): Promise<void> {
    await auth.signOut();
    this.verificationId = null;
  }
}

export const firebaseAuthService = new FirebaseAuthService();
