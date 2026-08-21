# DateGap

Drop a Google Takeout dump of photos and JSON sidecars. Get the files missing a creation date. Files never leave the browser.

Ask this answers: [Takeout — batch-finding photos/videos missing creation date metadata](https://www.reddit.com/r/googlephotos/comments/1vjmvm2/takeout_batchfinding_photosvideos_missing/)

- No account
- No upload
- Cap: 15 MB per file, 40 media files
- A date counts if EXIF DateTimeOriginal or sidecar `photoTakenTime` exists

## Local

Open `index.html` in a browser, or:

```bash
python3 -m http.server 4173
```

Needs a local server for the ES module. This isolates a sample batch. It does not rewrite a 75 GB library.

## GTM

Reply to people hunting undated Takeout files by hand. Copy is in the page footer.
