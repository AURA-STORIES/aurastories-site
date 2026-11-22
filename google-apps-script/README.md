# Aura Stories enquiry service

This Apps Script receives the website form and stores each enquiry in the private `Aura Stories Enquiries` Google Sheet for manual review.

1. Open the tracker Sheet and choose **Extensions → Apps Script**.
2. Replace the editor contents with `Code.gs` from this folder and save.
3. Choose **Deploy → New deployment → Web app**.
4. Execute as **Me** and allow access to **Anyone**.
5. Copy the `/exec` URL and replace `__AURA_ENQUIRY_ENDPOINT__` in `assets/app.js`.

The spreadsheet remains private. The public web app can only append validated form fields through the script.
