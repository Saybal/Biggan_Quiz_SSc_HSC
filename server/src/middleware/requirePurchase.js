// /**
//  * server/src/middleware/requirePurchase.js
//  *
//  * Middleware that runs AFTER requireAuth (or requireFirebaseAuth).
//  * Blocks access to quiz questions/results unless the user has purchased.
//  *
//  * Usage in routes:
//  *   router.get('/questions', requireAuth, requirePurchase, getAll)
//  */
// import User from '../models/User.js'
// // const PURCHASE_CHECK_ENABLED_FROM = new Date('2026-04-01T00:00:00Z')
// const PURCHASE_CHECK_ENABLED_FROM = new Date(Date.UTC(2026, 4, 1));

// export async function requirePurchase(req, res, next) {

//   // console.log(PURCHASE_CHECK_ENABLED_FROM);
//   // console.log(new Date());

//   try {
//     if (Date.now() < PURCHASE_CHECK_ENABLED_FROM) return next();

//     const user = await User.findOne({ firebaseUid: req.user.uid })

//     if (!user) {
//       return res.status(403).json({
//         error:    'purchase_required',
//         message:  'Please purchase a course to access quiz content.',
//       })
//     }

//     if (!user.hasPurchased) {
//       return res.status(403).json({
//         error:    'purchase_required',
//         message:  'Please purchase a course to access quiz content.',
//       })
//     }

//     // Attach user doc to request for downstream use
//     req.dbUser = user
//     next()
//   } catch (err) {
//     next(err)
//   }
// }

/**
 * server/src/middleware/requirePurchase.js
 */

// import User from '../models/User.js'

// // April 1, 2026 at 00:00:00 UTC (Correct month = 3)
// const PURCHASE_CHECK_ENABLED_FROM = Date.UTC(2026, 3, 1);   // ← Fixed: 3 = April

// export async function requirePurchase(req, res, next) {

//   try {
//     const now = Date.now();

//     console.log('Current time (ms):', now);
//     console.log('Purchase check enabled from (ms):', PURCHASE_CHECK_ENABLED_FROM);
//     console.log('Is purchase enforcement active?', now >= PURCHASE_CHECK_ENABLED_FROM);

//     // If current time is BEFORE April 1, 2026 → skip purchase check
//     if (now < PURCHASE_CHECK_ENABLED_FROM) {
//       return next();
//     }

//     // === From April 1, 2026 onwards: enforce purchase ===
//     const user = await User.findOne({ firebaseUid: req.user.uid });

//     if (!user || !user.hasPurchased) {
//       return res.status(403).json({
//         error:    'purchase_required',
//         message:  'Please purchase a course to access quiz content.',
//       });
//     }

//     req.dbUser = user;
//     next();
//   } catch (err) {
//     next(err);
//   }
// }

/**
 * server/src/middleware/requirePurchase.js
 */

import User from '../models/User.js';

// April 1, 2026 at 00:00:00 UTC
const PURCHASE_CHECK_ENABLED_FROM = Date.UTC(2026, 3, 1);

export async function requirePurchase(req, res, next) {

  try {
    const now = Date.now();
    const isEnforcementActive = now >= PURCHASE_CHECK_ENABLED_FROM;

    // Detailed logging - check your server console/logs
    console.log('=== requirePurchase Middleware ===');
    console.log('Current time (UTC):', new Date(now).toISOString());
    console.log('Enforcement starts (UTC):', new Date(PURCHASE_CHECK_ENABLED_FROM).toISOString());
    console.log('Is purchase enforcement ACTIVE?', isEnforcementActive);
    console.log('User UID from token:', req.user?.uid);

    // If enforcement is NOT yet active → allow everyone
    if (!isEnforcementActive) {
      console.log('Purchase check is still disabled. Skipping...');
      return next();
    }

    // === Enforcement is active ===
    if (!req.user?.uid) {
      return res.status(401).json({ error: 'unauthorized', message: 'Authentication required' });
    }

    const user = await User.findOne({ firebaseUid: req.user.uid });

    console.log('Found user:', !!user);
    if (user) console.log('hasPurchased value:', user.hasPurchased);

    if (!user || !user.hasPurchased) {
      console.log('Purchase required - blocking access');
      return res.status(403).json({
        error:    'purchase_required',
        message:  'Please purchase a course to access quiz content.',
      });
    }

    console.log('Purchase verified - access granted');
    req.dbUser = user;
    next();
  } catch (err) {
    console.error('Error in requirePurchase middleware:', err);
    next(err);
  }
}