## Static Website Hosting on Amazon S3

1. Create an S3 bucket named after your public domain (e.g., `serenityyoga.com`) and enable **Static website hosting**.  
2. In **Properties → Static website hosting**, choose **Host a static website**, set the index document to `index.html`, and (optionally) the error document to `index.html` for SPA-style routing.  
3. In **Permissions**, update the bucket policy to allow public read access for `GetObject` requests (or front the bucket with CloudFront for HTTPS + caching).  
4. Upload the HTML, CSS, and JS files from this project, including the new `config.js`.  
5. Edit `config.js` and set `window.CONTACT_API_URL` to the HTTPS invoke URL that API Gateway exposes for your Lambda function.

> **Tip:** When using CloudFront, remember to add the same API URL to the distribution's CORS allowed origins in Lambda so browsers accept the response.

## Contact Form Email Flow with Lambda + SES

1. Verify your domain or target addresses in Amazon SES (same AWS Region you will deploy the Lambda function). Exit the SES sandbox or verify the destination email to receive messages.  
2. Use the contents of `aws-contact-lambda.js` as the Lambda handler. Replace:
   - `SOURCE_EMAIL` with a domain-verified sender (e.g., `noreply@yourdomain.com`).
   - `DESTINATION_EMAIL` with the mailbox that should receive inquiries.
   - (Optional) set the `ALLOWED_ORIGIN` env var to the exact domain hosting the form.
3. Create a Lambda function (Node.js 18.x runtime) and deploy the handler:
   - Install the dependency locally: `npm install @aws-sdk/client-sesv2`.
   - Zip `aws-contact-lambda.js` plus the generated `node_modules` folder and upload it as the Lambda code package (or attach a Lambda layer containing the dependency).
   - Configure environment variables as needed (`AWS_REGION`, `ALLOWED_ORIGIN`).
4. Attach an IAM role to Lambda with the `ses:SendEmail` and `ses:SendEmailRaw` permissions (scope it to the desired identities where possible).  
5. Create an Amazon API Gateway HTTP API:
   - Add a `POST /contact` route that integrates with the Lambda function (using the Lambda proxy integration).
   - Enable CORS for the route, mirroring the `ALLOWED_ORIGIN` value if set.
   - Deploy the API and grab the Invoke URL (e.g., `https://abc123.execute-api.us-east-1.amazonaws.com/contact`).  
6. Update `config.js` with the Invoke URL and redeploy the static assets to S3/CloudFront.  
7. Test the form end-to-end. Watch CloudWatch Logs for the Lambda function if errors appear.

## Optional Hardening

- Store `CONTACT_API_URL` in different `config.js` files per environment (dev/stage/prod).  
- Consider using AWS WAF or API Gateway throttling to protect the form endpoint.  
- Add reCAPTCHA or other challenge-response if spam becomes an issue.
