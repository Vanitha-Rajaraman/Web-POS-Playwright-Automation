import { BasePage } from './BasePage.js';
import { env } from '../config/env.js';
export class LoginPage extends BasePage {
    constructor(page) {
        super(page);
        this.mobileInput = page.getByPlaceholder('Enter mobile number');
        this.pinInput = page.getByPlaceholder('Enter secure PIN');
        this.loginButton = page.getByRole('button', { name: /Login to Lynx/i });
        this.forgotPinLink = page.getByRole('link', { name: /forgot pin/i });
        this.toastLoginSuccess = page.getByText(/login successful/i);
        this.toastInvalidMobile = page.getByText(/invalid mobile number/i);
        this.otpInput = page.getByPlaceholder('Enter OTP');
        this.newPinInput = page.getByPlaceholder('Enter new PIN');
        this.confirmPinInput = page.getByPlaceholder('Confirm new PIN');
        this.resetPinButton = page.getByRole('button', { name: /reset pin/i });
        this.toastResetSuccess = page.getByText(/pin reset successful/i);
        this.toastPinMismatch = page.getByText(/pins do not match/i);
    }
    /** Login button only reaches its enabled/active state once mobile=10 digits & pin>=4. */
    get loginButtonActive() {
        return this.loginButton.and(this.page.locator(':not([disabled])'));
    }
    async goto() {
        await this.page.goto(env.baseUrl);
        await this.mobileInput.waitFor({ state: 'visible' });
    }
    async login(mobileNumber, pin) {
        await this.mobileInput.fill(mobileNumber);
        await this.pinInput.fill(pin);
        await this.loginButton.click();
    }
    async openForgotPin() {
        await this.forgotPinLink.click();
    }
    async enterOtp(otp) {
        await this.otpInput.fill(otp);
    }
    async resetPin(newPin, confirmPin) {
        await this.newPinInput.fill(newPin);
        await this.confirmPinInput.fill(confirmPin);
        await this.resetPinButton.click();
    }
}
