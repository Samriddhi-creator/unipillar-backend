export class SignupDto {
  name: string
  email: string
  mobile: string
  password: string
}

export class LoginDto {
  email: string
  password: string
}

export class ForgotPasswordDto {
  email: string
}

export class VerifyOtpDto {
  email: string
  otp: string
}

export class ResetPasswordDto {
  email: string
  newPassword: string
}