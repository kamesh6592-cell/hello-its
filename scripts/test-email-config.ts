import { sendVerificationEmail } from '@/lib/mailer';

// Test email sending
async function testEmailSetup() {
  console.log('=== Email Configuration Test ===\n');
  
  console.log('Environment Variables:');
  console.log('EMAIL_PROVIDER:', process.env.EMAIL_PROVIDER || 'NOT SET (defaulting to smtp)');
  console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'SET ✓' : 'NOT SET ✗');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'NOT SET (defaulting to noreply@tomoacademy.site)');
  console.log('BETTER_AUTH_URL:', process.env.BETTER_AUTH_URL || 'NOT SET');
  console.log('NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL || 'NOT SET');
  console.log('\n');

  // Test sending email
  try {
    console.log('Attempting to send test verification email...');
    const result = await sendVerificationEmail(
      'test@example.com',
      'https://chat.tomoacademy.site/verify?token=test123',
      'Test User'
    );
    
    if (result) {
      console.log('✓ Email sent successfully!');
    } else {
      console.log('✗ Email sending failed - check logs above');
    }
  } catch (error) {
    console.error('✗ Error sending email:', error);
  }
}

testEmailSetup();
