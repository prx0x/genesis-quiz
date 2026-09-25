const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const config = require('./index');
const userService = require('../services/userService');
const { isAllowedParticipantEmail } = require('../utils/helpers');
const { logInfo, logWarn } = require('../utils/logger');

function configurePassport() {
  if (!config.google.clientId || !config.google.clientSecret) {
    logWarn('Google OAuth credentials not configured. Participant Google login will be unavailable.');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackUrl,
        scope: ['profile', 'email'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = (profile.emails && profile.emails[0] && profile.emails[0].value) || '';
          const emailVerified =
            profile._json?.email_verified === true ||
            profile._json?.verified_email === true ||
            (profile.emails && profile.emails[0] && profile.emails[0].verified === true);

          if (!email) {
            logWarn('Google auth missing email', { googleId: profile.id });
            return done(null, false, { message: 'Email not provided by Google.' });
          }

          if (!emailVerified) {
            logWarn('Google auth unverified email', { emailDomain: email.split('@')[1] });
            return done(null, false, { message: 'Google email is not verified.' });
          }

          if (!isAllowedParticipantEmail(email, config.allowedEmailDomain)) {
            logWarn('Google auth domain rejected', {
              domain: email.split('@').pop(),
            });
            return done(null, false, {
              message: `Only @${config.allowedEmailDomain} Google accounts are allowed to participate.`,
            });
          }

          const user = await userService.upsertGoogleUser({
            googleId: profile.id,
            email: email.toLowerCase(),
            name: profile.displayName || email.split('@')[0],
            profilePicture: profile.photos?.[0]?.value || null,
            emailVerified: true,
          });

          // Never auto-promote to admin based on domain
          logInfo('Participant authenticated via Google', { userId: user.id });
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await userService.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}

module.exports = { configurePassport };
