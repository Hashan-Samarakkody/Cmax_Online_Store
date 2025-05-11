import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import userModel from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

// Helper function to generate JWT token
const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

// Configure Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/api/user/auth/google/callback`,
    profileFields: ['id', 'displayName', 'photos', 'email']
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Make sure we have email
            if (!profile.emails || profile.emails.length === 0) {
                return done(new Error('No email found in Google profile'), null);
            }

            // Check if user exists
            let user = await userModel.findOne({ email: profile.emails[0].value });

            if (!user) {
                // Create new user if doesn't exist
                const names = profile.displayName.split(' ');
                const firstName = names[0] || '';
                const lastName = names.length > 1 ? names[names.length - 1] : '';

                user = await userModel.create({
                    email: profile.emails[0].value,
                    username: `google_${profile.id}`,
                    firstName,
                    lastName,
                    password: 'google-oauth', // This password won't be used for login
                    profileImage: profile.photos[0]?.value || '',
                    authProvider: 'google'
                });
            } else if (user.authProvider !== 'google') {
                // If user exists but hasn't used Google OAuth before, update provider
                user.authProvider = 'google';
                await user.save();
            }

            // Generate token
            const token = createToken(user._id);
            return done(null, { user, token });
        } catch (error) {
            console.error("Google auth error:", error);
            return done(error);
        }
    }
));

// Configure Facebook Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/api/user/auth/facebook/callback`,
    profileFields: ['id', 'displayName', 'photos', 'email']
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user exists
            let user = await userModel.findOne({ email: profile.emails[0].value });

            if (!user) {
                // Create new user if doesn't exist
                const names = profile.displayName.split(' ');
                const firstName = names[0] || '';
                const lastName = names.length > 1 ? names[names.length - 1] : '';

                user = await userModel.create({
                    email: profile.emails[0].value,
                    username: `facebook_${profile.id}`,
                    firstName,
                    lastName,
                    password: 'facebook-oauth', // This password won't be used for login
                    profileImage: profile.photos[0]?.value || '',
                    authProvider: 'facebook'
                });
            } else if (!user.authProvider) {
                // If user exists but hasn't used OAuth before, update provider
                user.authProvider = 'facebook';
                await user.save();
            }

            // Generate token
            const token = createToken(user._id);
            return done(null, { user, token });
        } catch (error) {
            return done(error);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

export default passport;