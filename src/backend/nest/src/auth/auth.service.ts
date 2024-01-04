import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { authenticator } from 'otplib';
import { User } from '@prisma/client';
import { toDataURL } from 'qrcode';
import { AuthDto } from './dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private readonly logger = new Logger('AuthService');

  async signup(dto: AuthDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.id },
      });

      if (user) {
        const accessToken = await this.signAccessToken(
          Number(user.id),
          user.login,
        );
        const refreshToken = await this.signRefreshToken(Number(user.id));
        return {
          accessToken: accessToken,
          refreshToken: refreshToken,
          user: user,
        };
      }

      const newUser = await this.prisma.user.create({
        data: {
          id: dto.id,
          email: dto.email,
          login: dto.login,
          image: dto.image,
          username: dto.username,
          first_name: dto.first_name,
          last_name: dto.last_name,
          twoFactorAuthSecret: '',
          twoFactorAuthEnabled: false,
        },
      });
      this.logger.debug('New user: ', newUser);

      if (newUser) {
        const accessToken = await this.signAccessToken(
          Number(newUser.id),
          newUser.login,
        );
        const refreshToken = await this.signRefreshToken(Number(user.id));
        return {
          accessToken: accessToken,
          refreshToken: refreshToken,
          user: user,
        };
      }
    } catch (error) {
      this.logger.error(error);
    }
    return null;
  }

  async signAccessToken(userId: number, login: string): Promise<string> {
    const payload = { sub: userId, login: login };

    return this.jwtService.signAsync(payload, {
      expiresIn: '15m',
      secret: this.config.get('JWT_SECRET'),
    });
  }

  async signRefreshToken(userId: number): Promise<string> {
    const payload = { sub: userId, tokenId: uuidv4() };

    return this.jwtService.signAsync(payload, {
      expiresIn: '7d',
      secret: this.config.get('JWT_SECRET'),
    });
  }

  async generate2FASecret() {
    return authenticator.generateSecret();
  }

  async generate2FAKeyURI(user: User, secret: string) {
    if (!user) {
      throw new ForbiddenException('User is undefined');
    }
    return authenticator.keyuri(user.id, 'transcendence', secret);
  }

  async generateQrCodeURL(otpAuthURL: string) {
    return toDataURL(otpAuthURL);
  }

  is2FACodeValid(twoFactorAuthenticationCode: string, user: User) {
    this.logger.debug(twoFactorAuthenticationCode, user);

    if (!user.twoFactorAuthSecret) {
      throw new ForbiddenException('2FA secret is not set');
    }
    this.logger.debug(twoFactorAuthenticationCode, user.twoFactorAuthSecret);
    return authenticator.verify({
      token: twoFactorAuthenticationCode,
      secret: user.twoFactorAuthSecret,
    });
  }

  async is2FAActive(id: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: id } });
      if (!user) {
        throw new ForbiddenException('User is not in database. id: ', id);
      }
      return user.twoFactorAuthEnabled;
    } catch (error) {
      console.error(error);
    }
  }

  async sign2FAToken(id: string): Promise<string> {
    const payload = { sub: id };

    return this.jwtService.signAsync(payload, {
      expiresIn: '5m',
      secret: this.config.get('JWT_2FA_SECRET'),
    });
  }

  // async verifyToken(token: Object): Promise<boolean> {}
  //   try {
  //     return await
  //   } catch(error) {
  //     console.error(error);
  //     return false
  //   }
}
