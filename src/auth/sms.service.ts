import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async sendOtp(mobile: string, otp: string): Promise<boolean> {
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_FROM_NUMBER;

    const fast2smsKey = process.env.FAST2SMS_API_KEY;

    const message = `Your UniPillar verification OTP is ${otp}. Expires in 10 minutes.`;

    // 1. Try Twilio if credentials are set
    if (twilioSid && twilioAuthToken && twilioFrom) {
      try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
        const auth = Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString('base64');
        
        const params = new URLSearchParams();
        params.append('To', mobile.startsWith('+') ? mobile : `+91${mobile}`);
        params.append('From', twilioFrom);
        params.append('Body', message);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          this.logger.log(`OTP successfully sent to ${mobile} via Twilio.`);
          return true;
        } else {
          const errText = await response.text();
          this.logger.error(`Twilio send failed: ${errText}`);
        }
      } catch (err) {
        this.logger.error(`Error sending SMS via Twilio: ${err.message}`);
      }
    }

    // 2. Try Fast2SMS if credentials are set
    if (fast2smsKey) {
      try {
        const cleanMobile = mobile.replace(/[^0-9]/g, '');
        const numbers = cleanMobile.length > 10 ? cleanMobile.slice(-10) : cleanMobile;
        
        const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${fast2smsKey}&variables_values=${otp}&route=otp&numbers=${numbers}`;
        const response = await fetch(url, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          const result = await response.json();
          this.logger.log(`OTP successfully sent to ${numbers} via Fast2SMS. Response: ${JSON.stringify(result)}`);
          return true;
        } else {
          const errText = await response.text();
          this.logger.error(`Fast2SMS send failed: ${errText}`);
        }
      } catch (err) {
        this.logger.error(`Error sending SMS via Fast2SMS: ${err.message}`);
      }
    }

    // 3. Fallback to Console Logging (Mock)
    this.logger.log(`\n====================================`);
    this.logger.log(`[SMS OTP MOCK] Sent to ${mobile}: ${message}`);
    this.logger.log(`====================================\n`);
    return true;
  }
}
