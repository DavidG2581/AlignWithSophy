/**
 * AWS Lambda handler for processing the Serenity Yoga contact form.
 *
 * STEPS BEFORE DEPLOYMENT:
 * 1. Replace the placeholder emails below with your own verified SES sender and recipient emails.
 * 2. Confirm the `REGION` matches where your SES identity (domain or email) is verified.
 * 3. (Optional) Set ALLOWED_ORIGIN to narrow CORS access to your S3/CloudFront domain.
 * 4. Deploy this handler with the AWS SDK v3 dependency: @aws-sdk/client-sesv2.
 */

const { SESv2Client, SendEmailCommand } = require("@aws-sdk/client-sesv2");

const REGION = process.env.AWS_REGION || "us-east-1";
// TODO: Replace with the email address verified in Amazon SES that you want the message to appear from.
const SOURCE_EMAIL = "noreply@yourdomain.com";
// TODO: Replace with the email address (must also be verified in SES if in Sandbox) that will receive the inquiry.
const DESTINATION_EMAIL = "you@example.com";
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

const ses = new SESv2Client({ region: REGION });

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS,POST",
  };

  // Handle CORS preflight
  if ((event.requestContext?.http?.method || event.httpMethod) === "OPTIONS") {
    return { statusCode: 204, headers };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: "Invalid JSON payload." }),
    };
  }

  const { name, email, phone, message } = payload;
  if (!name || !email) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: "Name and email are required." }),
    };
  }

  const textBody = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || "Not provided"}`,
    "",
    "Message:",
    message || "No additional details submitted.",
  ].join("\n");

  const send = new SendEmailCommand({
    FromEmailAddress: SOURCE_EMAIL,
    Destination: { ToAddresses: [DESTINATION_EMAIL] },
    ReplyToAddresses: [email],
    Content: {
      Simple: {
        Subject: { Data: "New Serenity Yoga Inquiry" },
        Body: {
          Text: { Data: textBody },
        },
      },
    },
  });

  try {
    await ses.send(send);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error("SES send error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Unable to send email right now. Please try again later.",
      }),
    };
  }
};
