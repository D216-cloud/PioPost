
import { NextRequest, NextResponse } from 'next/server';

const VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN;

/**
 * Handles webhook verification for Instagram.
 * @param req - The incoming Next.js request.
 * @returns A Next.js response.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified');
    return new NextResponse(challenge, { status: 200 });
  } else {
    console.error('Webhook verification failed');
    return new NextResponse('Forbidden', { status: 403 });
  }
}

/**
 * Handles incoming webhook notifications from Instagram.
 * @param req - The incoming Next.js request.
 * @returns A Next.js response.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Received webhook:', JSON.stringify(body, null, 2));

    // Handle comment notifications
    if (body.object === 'instagram') {
      for (const entry of body.entry) {
        if (entry.messaging) {
          // Handle direct messages (if needed in future)
        } else if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'comments' && change.value.from.id !== process.env.INSTAGRAM_ACCOUNT_ID) {
              const comment = change.value;
              const commenterId = comment.from.id;
              
              // Don't reply to your own comments
              if (commenterId === process.env.INSTAGRAM_ACCOUNT_ID) {
                console.log('Skipping own comment.');
                continue;
              }

              await sendDm(commenterId, 'Thanks for your comment! We will get back to you shortly.');
            }
          }
        }
      }
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

async function sendDm(recipientId: string, messageText: string) {
  const PAGE_ACCESS_TOKEN = process.env.MESSENGER_ACCESS_TOKEN;
  const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;

  const payload = {
    recipient: { id: recipientId },
    message: { text: messageText },
    messaging_type: 'RESPONSE',
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Failed to send DM:', data);
    } else {
      console.log('Successfully sent DM:', data);
    }
  } catch (error) {
    console.error('Error sending DM:', error);
  }
}
