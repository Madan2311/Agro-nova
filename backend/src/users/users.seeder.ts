import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import { Role } from './enums/role.enum';

@Injectable()
export class UsersSeeder implements OnApplicationBootstrap {
    private readonly logger = new Logger(UsersSeeder.name);

    constructor(
        private readonly usersService: UsersService,
        private readonly config: ConfigService,
    ) { }

    async onApplicationBootstrap() {
        const email = this.config.get<string>('ADMIN_EMAIL');
        const password = this.config.get<string>('ADMIN_PASSWORD');
        if (!email || !password) return;

        const exists = await this.usersService.findByEmail(email);
        if (exists) return;

        await this.usersService.create({
            name: this.config.get<string>('ADMIN_NAME', 'Administrador'),
            email,
            password,
            role: Role.ADMIN,
        });
        this.logger.log(`Usuario administrador creado: ${email}`);
    }
}