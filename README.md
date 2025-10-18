# strive

38 days left!
We got this!

## Quick start (Chrome + Gemini Nano)

- **Use Chrome 138+**: check at `chrome://version`.
- First run will download Gemini Nano in the background. You can watch status in `chrome://on-device-internals`.

### If it says unavailable
If `availability()` shows "unavailable", enable these flags, then relaunch Chrome:
- `#prompt-api-for-gemini-nano`
- `#optimization-guide-on-device-model`

### Load the extension
Once it works:
- Go to `chrome://extensions`
- Toggle on **Developer mode**
- Click **Load unpacked** and select the folder with this repo
- Click the extension icon (top right) to open the popup
- In the popup, click **Start / Check**

### What you should see
- `availability: downloadable` → then
- `download: 1% … 100%` → then
- `reply: ready` (or a short greeting)

Now peek at `chrome://on-device-internals` again. It should switch from "No On-device Feature Used" to **Downloading** or **Ready**.

### Chrome for Developers
Good to have installed/updated so you get the latest features.
