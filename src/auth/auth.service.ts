import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserDocument } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  generateToken(user: UserDocument) {
    const payload = {
      sub: user._id,
      email: user.emailAddress,
      isVerified: user.isVerified,
    };

    return this.jwtService.sign(payload);
  }
verifyToken(token: string) {
    return this.jwtService.verify(token);
  }
}
