import { Injectable } from '@nestjs/common'
import { JwtService as NestJwtService } from '@nestjs/jwt'

@Injectable()
export class JwtService {
  constructor(private jwt: NestJwtService) {}

  sign(payload: any) {
    return this.jwt.sign(payload)
  }

  verify(token: string) {
    return this.jwt.verify(token)
  }
}