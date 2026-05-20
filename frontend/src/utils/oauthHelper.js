/**
 * MediGrid OAuth Helper
 * 
 * Handles the complete OAuth popup flow for Google, GitHub, and Microsoft.
 * 
 * Flow per provider:
 *  - Google:    Implicit (response_type=token) → access_token in URL hash
 *  - GitHub:    Authorization Code → ?code= in URL → backend exchanges for token
 *  - Microsoft: Implicit (response_type=token) → access_token in URL hash
 * 
 * Usage:
 *   const result = await launchOAuthPopup(provider, clientIds);
 *   // result: { type: 'token'|'code', value: string } on success
 *   // throws Error with message on failure/cancellation
 */

const POPUP_WIDTH = 600;
const POPUP_HEIGHT = 700;
const POLL_INTERVAL_MS = 500;
const POPUP_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Opens an OAuth popup and polls until the provider redirects back to our origin.
 * Resolves with { type, value } or rejects with an Error.
 */
export function launchOAuthPopup(provider, clientIds) {
  return new Promise((resolve, reject) => {
    const { googleClientId, githubClientId, microsoftClientId } = clientIds;
    const redirectUri = window.location.origin;
    let oauthUrl = '';

    if (provider === 'Google') {
      const params = new URLSearchParams({
        client_id: googleClientId,
        redirect_uri: redirectUri,
        response_type: 'token',
        scope: 'email profile',
        include_granted_scopes: 'true'
      });
      oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

    } else if (provider === 'GitHub') {
      const params = new URLSearchParams({
        client_id: githubClientId,
        redirect_uri: redirectUri,
        scope: 'user:email'
      });
      oauthUrl = `https://github.com/login/oauth/authorize?${params}`;

    } else if (provider === 'Microsoft') {
      const params = new URLSearchParams({
        client_id: microsoftClientId,
        redirect_uri: redirectUri,
        response_type: 'token',
        scope: 'openid profile email',
        response_mode: 'fragment'
      });
      oauthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;

    } else {
      return reject(new Error(`Unknown provider: ${provider}`));
    }

    // Open the popup window
    const left = Math.max(0, window.screenX + (window.outerWidth - POPUP_WIDTH) / 2);
    const top = Math.max(0, window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2);

    const authWindow = window.open(
      oauthUrl,
      `${provider} Sign In`,
      `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,status=yes`
    );

    if (!authWindow || authWindow.closed) {
      return reject(new Error('Popup was blocked by the browser. Please allow popups for this site and try again.'));
    }

    let settled = false;
    let pollTimer = null;

    // Safety timeout — prevent infinite polling
    const timeoutTimer = setTimeout(() => {
      if (!settled) {
        settled = true;
        clearInterval(pollTimer);
        if (!authWindow.closed) authWindow.close();
        reject(new Error(`${provider} sign-in timed out. Please try again.`));
      }
    }, POPUP_TIMEOUT_MS);

    pollTimer = setInterval(() => {
      try {
        // If user closed the popup manually
        if (authWindow.closed) {
          if (!settled) {
            settled = true;
            clearTimeout(timeoutTimer);
            clearInterval(pollTimer);
            reject(new Error(`${provider} sign-in was cancelled.`));
          }
          return;
        }

        // This throws a cross-origin error while popup is on the provider's domain.
        // Once redirected back to our origin, it succeeds.
        const popupUrl = authWindow.location.href;

        // Still on the provider's login page (different origin) → keep waiting
        if (!popupUrl || !popupUrl.startsWith(window.location.origin)) return;

        // We're back on our origin — read the URL and close the popup
        settled = true;
        clearTimeout(timeoutTimer);
        clearInterval(pollTimer);
        if (!authWindow.closed) authWindow.close();

        const url = new URL(popupUrl);

        if (provider === 'GitHub') {
          // GitHub sends ?code=xxx&state=yyy
          const code = url.searchParams.get('code');
          const error = url.searchParams.get('error');
          const errorDescription = url.searchParams.get('error_description');

          if (error) {
            return reject(new Error(`GitHub declined access: ${errorDescription || error}`));
          }
          if (!code) {
            return reject(new Error('GitHub did not return an authorization code. Please try again.'));
          }
          return resolve({ type: 'code', value: code });

        } else {
          // Google/Microsoft send #access_token=xxx&...
          const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
          const accessToken = hashParams.get('access_token');
          const error = hashParams.get('error');
          const errorDescription = hashParams.get('error_description');

          if (error) {
            return reject(new Error(`${provider} declined access: ${errorDescription || error}`));
          }
          if (!accessToken) {
            return reject(new Error(`${provider} did not return an access token. Please try again.`));
          }
          return resolve({ type: 'token', value: accessToken });
        }

      } catch (crossOriginError) {
        // Cross-origin SecurityError — popup is still on the provider's domain.
        // This is normal; keep polling silently.
      }
    }, POLL_INTERVAL_MS);
  });
}
