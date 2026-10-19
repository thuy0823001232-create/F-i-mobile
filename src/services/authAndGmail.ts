/**
 * Firebase Authentication & Gmail API Integration
 * Conforms to Workspace integration skill:
 * - Client-side token authentication
 * - In-memory access token caching
 * - User confirmation dialog before sending emails
 * - Official Gmail API RFC 2822 base64url formatting
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/gmail.send');

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuthListener = (
  onUserChanged: (user: User | null, token: string | null) => void
) => {
  return onAuthStateChanged(auth, (user) => {
    if (!user) {
      cachedAccessToken = null;
    }
    onUserChanged(user, cachedAccessToken);
  });
};

export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No access token returned from Google Sign-In');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (err) {
    console.error('Google Sign In error:', err);
    throw err;
  } finally {
    isSigningIn = false;
  }
};

export const logOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const getCachedAccessToken = () => cachedAccessToken;

// Encode RFC 2822 email to base64url
function base64urlEncode(str: string): string {
  // UTF-8 safe base64
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export interface SendEmailPayload {
  recipientEmail: string;
  subject: string;
  htmlBody: string;
}

export const sendGmailNotification = async (payload: SendEmailPayload): Promise<{ success: boolean; id?: string; error?: string }> => {
  if (!cachedAccessToken) {
    return {
      success: false,
      error: 'Vui lòng đăng nhập Google để cấp quyền gửi thông báo qua Gmail.'
    };
  }

  const rawEmail = [
    `To: ${payload.recipientEmail}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(payload.subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    payload.htmlBody
  ].join('\r\n');

  const encodedMessage = base64urlEncode(rawEmail);

  try {
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedMessage,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `HTTP ${res.status}: Failed to send email`);
    }

    const data = await res.json();
    return { success: true, id: data.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Failed to dispatch Gmail message:', message);
    return { success: false, error: message };
  }
};
