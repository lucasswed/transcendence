import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpStatus,
  Logger,
  Post,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { error } from 'console';
import { Response } from 'express';
import { GetMe } from 'src/decorators';
import { FTAuthExceptionFilter } from 'src/filters';
import { InputStringValidationPipe } from 'src/pipes';
import { PrismaService } from 'src/prisma/prisma.service';
import { domain } from 'src/utils';
import { FTGuard, JwtAuthGuard } from '../auth/guard';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';
import { TwoFAGuard } from './guard/2FA.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private prisma: PrismaService,
  ) {}

  private readonly logger = new Logger('AuthController');

  @UseGuards(FTGuard)
  @Get('login')
  login() {}

  @UseGuards(FTGuard)
  @UseFilters(new FTAuthExceptionFilter())
  @Get('intra-clbk')
  async callbackIntra(@Req() req: any, @Res() res: Response): Promise<any> {
    const dto: AuthDto = req.user;
    try {
      if (await this.authService.is2FAActive(String(dto.id))) {
        // Execute 2FA logic
        const user = await this.userService.getUserById(dto.id);
        if (!user) {
          throw new ForbiddenException('User not found');
        }

        const token = await this.authService.sign2FAToken(user.id);
        // this.logger.debug('CENA DE TEXTO ' + token);

        res
          .cookie('token2fa', token, {
            expires: new Date(Date.now() + 2 * 60 * 1000),
            domain: domain,
            path: '/',
            // sameSite: false,
            // secure: true,
          })
          .redirect(`${process.env.FRONTEND_URL}`);
        return;
      }
    } catch (error) {
      this.logger.error(error);
      return res.status(HttpStatus.BAD_REQUEST).send(error);
    }

    // Execute login without 2FA
    const data = await this.authService.signup(dto);
    res
      .cookie('token', data.accessToken, {
        expires: new Date(Date.now() + 14 * 60 * 1000),
        domain: domain,
        path: '/',
        // sameSite: 'none',
        // secure: true,
      })
      .redirect(`${process.env.FRONTEND_URL}`);
    return;
  }

  @UseGuards(JwtAuthGuard)
  @Get('2fa/generate')
  async register(@Res() res: Response, @GetMe() user: User) {
    try {
      if (!user) {
        this.logger.error(error);
        return res
          .status(HttpStatus.FORBIDDEN)
          .json({ message: 'User does not exist' })
          .send();
      }

      if (!user.twoFactorAuthSecret) {
        // generate 2FA secret
        const secret = this.authService.generate2FASecret();
        // update user data
        await this.userService.set2FASecret(user.id, secret);
      }

      // const user2 = await this.userService.getUserById(user.id);

      const User2 = await this.userService.getUserById(user.id);

      const otpAuthURL = await this.authService.generate2FAKeyURI(User2);

      // generate QR code
      return res.json(await this.authService.generateQrCodeURL(otpAuthURL));
    } catch (error) {
      this.logger.error(error);
      return res.send(error);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/turn-on')
  async turn2FAOn(
    @GetMe() user: User,
    @Body('code', InputStringValidationPipe) code: string,
    @Res() res: Response,
  ) {
    if ((await this.userService.is2FAEnabled(user.id)).valueOf() === false) {
      if (!user.twoFactorAuthSecret) {
        throw new ForbiddenException('2FA secret not set');
      }

      const isCodeValid = await this.authService.is2FACodeValid(code, user);

      if (isCodeValid === false) {
        return res.status(401).json({ error: 'Wrong 2FA code' });
      }

      await this.userService.set2FAOn(user.id);
      return res.status(200).json({ message: '2FA ON' }).send();
    }
    return res.json({ message: '2FA is already on' });
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/turn-off')
  async turn2FAOff(@GetMe('id') id: string, @Res() res: Response) {
    if ((await this.userService.is2FAEnabled(id)) === true) {
      try {
        await this.userService.set2FAOff(id);
      } catch (error) {
        this.logger.error(error);
        return res.send(error);
      }
      return res.json({ message: '2FA disabled' }).send();
    }
    return res.json({ message: '2FA is already off' }).send();
  }

  @UseGuards(TwoFAGuard)
  @Post('2fa/authentication')
  async authenticate2FA(
    @Res() res: Response,
    @GetMe('id') id: string,
    @Body() body: any,
  ) {
    const user = await this.userService.getUserById(id);

    if (!user) {
      return res
        .status(HttpStatus.FORBIDDEN)
        .json({ message: `No such id: ${user.id}` })
        .send();
    }

    const isCodeValid = await this.authService.is2FACodeValid(body.code, user);

    if (!isCodeValid) {
      return res
        .status(HttpStatus.FORBIDDEN)
        .json({ message: 'Wrong 2FA code' });
    }
    const token = await this.authService.signAccessToken(Number(user.id));

    if (!token) {
      this.logger.debug('token unauthorized');
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ message: 'Bad token' })
        .send();
    }
    // return (
    res
      .cookie('token', token, {
        expires: new Date(Date.now() + 14 * 60 * 1000),
        domain: domain,
        path: '/',
      })
      .send();
    // .redirect(`${process.env.FRONTEND_URL}`);
    return;
  }
}
