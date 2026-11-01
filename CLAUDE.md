# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

MyMechanic: an Expo SDK 54 / React Native 0.81 / React 19 app for iOS, Android and web, backed directly by Firebase (Auth, Firestore, Storage). The only server code is a Cloud Function in `functions/`, not active yet. It serves two roles: vehicle owners and mechanics. UI strings, comments and log messages are in Italian, and there is no i18n layer.

`README.md` is unmodified create-expo-app boilerplate: this project does not use Expo Router or an `app/` directory, and `npm run reset-project` does not exist. `replit.md` is a useful overview but partly dated; trust the code over it.

## Commands

```bash
npm start                      # Expo dev server (start:clear resets the Metro cache)
npx expo start --web           # Web
npm run ios                    # Native build and run (ios:clear removes ios/build first)
npm run android
npm run clean                  # Clear Expo/Metro caches (clean:all also reinstalls node_modules)
npm run clean:ios              # Reinstall Pods

npx tsc --noEmit               # Type check
npx eslint <path>              # Lint (no npm script exists)

npm run firebase:deploy:rules  # Deploy Firestore rules (firebase CLI is not a project dependency)
cd functions && npm run build  # Build the Cloud Function
```

There is no test runner or test suite, so a change can only be verified through type checking, linting and running the app.

`tsc` and ESLint are clean on `src`, so any new error comes from your change. `scripts/` type-checks through the `firebase-admin` dev dependency.

## Architecture

### Entry points

`index.js` loads `App.mobile.tsx`; `index.web.js` loads `App.web.tsx`. The two App files are near-duplicates, so a change to app bootstrap usually has to be made in both. `.web` platform extensions are also resolved by `metro.config.js`.

`metro.config.js` is deliberately customized: it keeps `.mjs`/`.cjs` for Firebase, forces `react-native-web` on web, and blocks zustand's `esm` folder. `zustand` is pinned to 4.5.5 and imported as `import create from 'zustand'`. Treat these as load-bearing when changing bundler config or upgrading dependencies.

### Auth and role routing

Firebase Auth → `useAuth` (`src/hooks/useAuth.ts`) → `useAuthSync` (`src/hooks/useAuthSync.ts`) → the Zustand `user` in `src/store/index.ts`. `useAuthSync` derives `user.isMechanic` from `userType === 'mechanic'`.

`src/navigation/AppNavigator.tsx` is a single stack that conditionally registers one of three screen sets: auth, mechanic, or owner. A new screen must be registered in the correct role branch and added to `RootStackParamList`. Routes without a real screen use `PlaceholderScreen`.

### Data and state layers

- `src/services/`: Firebase access, mostly singleton classes reached via `getInstance()`. Many default-export the instance, while others (such as `TransferService`, `VehicleService`) export the class. Check the file before importing.
- `src/hooks/useUserData.ts`: owner data fetched up front and filtered client-side, which avoids needing Firestore composite indexes.
- `src/store/`: Zustand stores. `index.ts` holds user and app state, with `useCarsStore`, `workshopStore`, `invoicingStore` and `useMechanicData` alongside it. On logout, `useLogout` in `useAuthSync.ts` must clear both the main store and the workshop store.
- `src/screens/user/` and `src/screens/mechanic/`: role-specific screens. Mechanic screens have separate desktop and mobile sidebars under `MechanicLayout.tsx`.
- Mechanic design system: use `useMechanicTheme`, `useMechanicBreakpoints` and `mechanicStaticColors` from `src/screens/mechanic/mechanicTheme.ts`, `MechanicHeader` for screen headers, and Lucide icons (`MechanicIcon` for name-based icons). Don't add local palettes, hex colors or `Dimensions.get` to mechanic screens.
- Owner navigation: `src/screens/user/UserLayout.tsx` provides the side rail on desktop and the bottom tabs on phones. Home, Prenotazioni and the booking screens use the same tokens as the mechanic area; `bookingStatus.ts` holds the customer's view of a booking's state.
- `src/components/Universal*Picker.tsx`: cross-platform date, image and document pickers. Use these rather than platform pickers directly. `UniversalDatePicker` is the only date control: a JS calendar that looks the same on iOS, Android and web, with its date logic in `src/utils/calendarGrid.ts`.

### Firestore

The security rules live in `scripts/firebase.rules` (the path `firebase.json` points to). `regole_firebase` is a much shorter file that is not deployed; don't edit it.

"Missing or insufficient permissions" errors are a recurring failure here. Any change to a query, a written field, or a cross-user flow needs a matching change in `scripts/firebase.rules`, followed by a deploy, because rules are enforced server-side and are not picked up by reloading the app.

Schema details that are easy to get wrong:

- Vehicle ownership may be stored in `userId` or `ownerId`; the rules accept either.
- Vehicle images are stored as both `mainImageUrl` and `imageUrl`; read with `mainImageUrl || imageUrl`.
- Collection names mix conventions, and both `workshopCars` and `workshop_cars` have rules. Copy the exact name from the existing service rather than inferring it.

`firestore.indexes.json` defines composite indexes and `firebase.json` points to it, so deploy them with `firebase deploy --only firestore:indexes`, or create them from the link in the Firestore error.

### Bookings and interventions

The work lifecycle is `pending` → `confirmed` → `in_progress` → `ready` → `completed`, on both the booking and its repair.

- Confirming a booking writes its intervention to `workshopCars` in the same transaction (`BookingService.writeIntervention`), so `selectedDate` is the only source of the work date. The car is written without being read because the rules deny reads of a missing document. `syncInterventions` backfills bookings confirmed without one.
- `CompleteInterventionScreen` is the only way to finish a job. It requires costs and parts, uploads photos, then `InterventionService.completeIntervention` updates the repair, the booking and `maintenance_records/booking_{id}` in one transaction, and optionally creates the invoice.
- `ready` means finished and waiting for pickup. Either side can mark the pickup; only the mechanic records payment, which sets the invoice's `paidDate`.
- Prices entered by the mechanic exclude VAT; `utils/interventionTotals.ts` computes totals in cents.
- Use `useInterventions` in `src/screens/mechanic/interventions.ts` to read interventions and `setWorkStatus` to change a linked one.

Records with `verifiedByWorkshop` are the vehicle's proof of work for resale: the rules let the owner change only `isVisible`, and delete only through a transfer. A prospective buyer reads the history only through `vehicle_history_access/{vehicleId}_{email}`: only the vehicle's owner can write it, on approval, and the rules check its `expiresAt`. Never gate this on `vehicle_view_requests`, because anyone can create those with any status. Rules cannot hide single fields, so the `maintenanceDetails` flag hides costs only in the app. Owners always see their own costs; `privacySettings.showCosts` applies to other viewers.

The mechanic dashboard derives its numbers from `workshopCars` and `invoices` (`utils/invoiceStats.ts`), not from the `appointments` collection. Drafts count as pending invoices; revenue counts paid customer invoices by `paidDate`.

### Workshop inventory

`inventory_items` holds the stock and `inventory_movements` is an append-only log, both private to the mechanic. `InventoryService` is the only writer. Items are archived, never deleted, and a unique part such as an engine is one item with a `serialNumber` and quantity 1.

- Committed stock is derived on the device from the parts of `pending` and `in_progress` repairs (`utils/inventoryStock.ts`), not stored: customers can cancel but cannot write inventory, so a saved counter would drift.
- Stock leaves only in `completeIntervention`: every read comes before any write, `applyConsumptionInTransaction` uses the fixed movement id `{repairId}_{partId}`, and a repair that is `ready`, `completed` or `cancelled` cannot be closed.
- Parts with `source` `bought_for_job` or `customer_supplied` never touch stock.
- `workshopCars` and `maintenance_records` are readable by the customer, so `purchaseCost` and the supplier stay in `inventory_items`. `RepairPart.unitCost` is an alias of the sale price, not a purchase cost.
- A mounted part needs a code and an origin, plus a photo unless `requiresMountedPhoto` says otherwise. This is the workshop's declaration, not a verification of authenticity, and the customer UI says so.

`functions/` holds `analyzePartPhoto`, currently switched off: `AI_PART_ANALYSIS_ENABLED` in `src/config/features.ts` is false, so the button only opens an explanatory popup, and `firebase.json` has no `functions` block, so nothing is deployed. It is a callable in `europe-west1` that reads a part photo with the Claude API. The key lives in Secret Manager and must never reach the app. Its result only prefills a form: the mechanic confirms, and the manual flow must keep working when the function is unavailable. `PartAnalysis` is duplicated in `functions/src/index.ts` because that folder compiles separately. See `functions/README.md`.

Planned AI features are listed in `src/config/aiFeatures.ts` and shown by `AiComingSoonButton`, which only opens an explanatory popup.

### Vehicle transfers

`TransferService` runs PIN-protected ownership transfers in `vehicle_transfers`: the PIN is hashed, with 5 attempts and 30 days of validity. The rules for `vehicles` allow the buyer's update through the `transferPending` flag; `hasAcceptedTransfer` is defined there but unused. `carTransferRequests` is the legacy flow. EmailJS is used only by this service.

`VehicleViewRequestService` is a separate flow that lets a prospective buyer request access to a vehicle's data (`vehicle_view_requests`, `vehicle_view_logs`).

## Product and design requirements

The app targets car owners (maintenance, deadlines, reminders, technical information) and mechanics and workshops (vehicles, repairs, invoicing, accounting).

Every proposal must keep iOS, Android and web/desktop working, and say how it behaves on each platform and on small, medium and large screens.

- **Responsive layout:** adapt spacing and layout per breakpoint and handle portrait and landscape. Prefer fluid layouts over fixed values. The redesigned `HomeScreen` uses breakpoints at 640px and 1024px.
- **Navigation:** bottom nav or hamburger on mobile, top or side nav on desktop, with the same functionality.
- **Input:** touch targets of at least 44–48pt, hover and focus states on desktop, full keyboard use.
- **Accessibility:** contrast of at least 4.5:1 for normal text, screen reader labels and roles, logical focus and tab order, text alternatives for images.
- **Visual style:** minimal and clean, with 2xl corner radius, light shadows, clear typographic hierarchy and consistent components across screens.
- **Theming:** light and dark support through centralized color, spacing and typography tokens.
- **Interaction:** always show loading, error and success states. Use discreet micro-interactions, never invasive animation.
- **Performance:** avoid heavy re-renders, virtualize long lists, lazy-load and optimize images, and code-split on web.

No animation library such as Reanimated, Moti or Framer Motion is installed, so confirm before adding one, and check that any new library works with React Native Web.

For new features, provide code ready to go into the repo, a textual mockup with per-breakpoint behavior, and a mobile and web test checklist. For architectural changes, also provide a plan with steps, risks and estimated times.

## Repository pitfalls

- **Admin scripts:** `scripts/*.ts` use `firebase-admin` and `scripts/serviceAccountKey.json`. The key is local only: it is git-ignored and not tracked, so it must be obtained separately and never committed. Also, `firebase-admin` and a TypeScript runner aren't in `package.json`, so they won't run from a plain install. They operate on the live `mymecanich` project and include destructive ones such as `clearDatabase.ts`.
- **Native folders:** `ios/` and `android/` are committed, so edits to `app.config.js` don't reach native builds until they are also applied there or regenerated with prebuild.
