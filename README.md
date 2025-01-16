# tune-trail-client

A mobile application built using React Native, TypeScript, and Expo.

## Prerequisites

Before running or building the application, ensure you have the following installed on your system:

- **Node.js** (latest LTS version recommended)
- **Expo CLI** (optional but recommended for ease of use)
- **Android Studio** (to emulate an Android device)

## Getting Started

### Cloning the Repository

To get started, clone the repository to your local machine:

```bash
git clone https://github.com/your-username/tune-trail-client.git
cd tune-trail-client
```

### Installing Dependencies

Install the required dependencies by running:

```bash
npm install
```

### Running the Application

To start the app in development mode, use the following command:

```bash
npx expo start -d
```

This will open the Expo developer tools in your browser. Since this application uses native libraries, the **Expo Go app cannot be used**. Instead, you must run the app using a development build on an Android emulator or a physical device:

- Use the option to run on an Android emulator through the developer tools (requires Android Studio).
- Alternatively, use a physical device with the development build installed.

### Building the Application

Building the app is only required after installing a new native library. Use the following command to build the app for Android:

```bash
npx expo run:android
```

This will create a development build of the app and run it on the Android emulator. Ensure Android Studio is set up and running correctly.

### Using Android Studio

- Open Android Studio and set up an Android Virtual Device (AVD) if not already configured.
- Ensure the emulator is running before executing the `npx expo run:android` command.
