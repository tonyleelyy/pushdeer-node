import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { PushDeerUsers } from '../../entity/users.entity';
import { Utils } from '../../helpers/utils';
import { RedisCoreService } from '../redis-core/redis-core.service';
import { AppleLoginDto } from '../../dto/user.dto';
import { verifyAppleToken } from '../../helpers/verify.login';

@Injectable()
export class LoginService {
  constructor(private readonly userService: UserService) {
  }

  async fakeLogin() {
    const fakeUser = {
      uid: 'JQV8hchTz7YP64sE',
      email: 'fake@gmail.com',
      name: 'fake',
    };
    const user = await this.createUser(
      fakeUser.uid,
      fakeUser.email,
      fakeUser.name,
    );
    return this.createToken(user);
  }

  async appleLogin(info: AppleLoginDto) {
    const userInfo = await verifyAppleToken(info);
    const user = await this.createUser(
      userInfo.apple_id,
      userInfo.email,
      userInfo.name,
    );
    return this.createToken(user);
  }

  async createToken(user: PushDeerUsers) {
    const token = Utils.randomUUID();
    await RedisCoreService.set(token, JSON.stringify(user));
    return token;
  }

  async createUser(uid: string, email: string, name: string) {
    let user = await this.userService.findOne(uid);
    if (!user) {
      const pushDeerUser = new PushDeerUsers();
      pushDeerUser.email = email;
      pushDeerUser.name = name;
      pushDeerUser.apple_id = uid;
      pushDeerUser.level = 1;
      pushDeerUser.uid = Utils.randomUUID(8);
      user = await this.userService.saveUser(pushDeerUser);
    }
    return user;
  }
}
