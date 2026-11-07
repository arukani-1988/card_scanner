# Card Scanner

Photograph a business card (or pick a photo), check the details it found, and save them to your phone's contacts with all phone numbers, emails, website and address. Works on Android and iPhone from one codebase.

- Text is read **on the phone** (Google ML Kit). Card photos are never uploaded.
- Phone numbers are labelled Mobile / Work / Home / Fax from the words on the card (for example "Tel", "M:", "Fax") and by number shape.
- Every field can be edited before saving. Saved cards are also kept in an in-app list you can search.

## What is built

| Screen | What it does |
| --- | --- |
| Scan | Camera with a card frame, shutter, gallery import, flash |
| Review details | All fields editable; add or remove numbers and emails; tap the label chip to change Mobile/Work/Home/Fax |
| Saved | Confirmation and summary |
| Saved cards | Search your scanned cards |
| Settings | Skip-review option, default country code (91 = India) |

Not built yet: automatic detection after a photo from the phone's own camera, and the Share-menu entry. See "Next phase" below.

## Run it

You need Node.js 20+ and a free Expo account (expo.dev).

This app uses native modules (camera text reading, contacts), so it does **not** run in the Expo Go app. Make a build instead:

```bash
npm install
npx eas-cli login
```

**Android (installs directly, no Play Store needed):**

```bash
npx eas-cli build --profile preview --platform android
```

When the build finishes, open the link it prints on your Android phone and install the APK.

**Android without any Expo account or Android Studio (GitHub builds it for you):**

1. Create a free GitHub account and a new empty repository.
2. Upload this project's files to it (on GitHub: Add file > Upload files; the `.github` folder must be included).
3. Open the repository's **Actions** tab, choose **Build Android APK**, and press **Run workflow**.
4. After about 10 minutes, open the finished run and download **card-scanner-apk** at the bottom. Unzip it and send the `.apk` to your phone.
5. On the phone, open the file and allow "Install unknown apps" when asked.

**iPhone:**

```bash
npx eas-cli build --profile preview --platform ios
```

Installing on a real iPhone needs an Apple Developer account (paid, about US$99 a year). The command walks you through registering your phone. For wider testing use `--profile production` and TestFlight.

**With Android Studio / Xcode installed** you can instead run `npm run android` or `npm run ios` to build and launch on a connected device or emulator.

Before publishing to the stores, change `com.example.cardscanner` in `app.json` (iOS `bundleIdentifier` and Android `package`) to your own identifier, and add your own app icon in `assets/`.

## Develop

```bash
npm test          # parser unit tests
npm run typecheck
```

The card-reading logic is in `src/parseCard.ts` and is covered by tests in `src/__tests__/`. Add a real card's text there whenever a card is parsed wrongly.

## Next phase

- **Android:** a notification after you take a photo with the normal camera ("Business card detected - Save contact"). Needs a small native Kotlin module that watches for new photos.
- **Android and iPhone:** appear in the Share menu so any photo can be sent to Card Scanner.
- **iPhone:** a lock-screen or Control Center shortcut that opens the scanner in one tap. Apple does not let apps watch the camera roll in the background, so the automatic notification is Android only.
- Auto-capture when a card is steady in the frame, and cropping to the card edge.
- Duplicate check against existing contacts.
