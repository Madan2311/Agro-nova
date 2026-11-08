import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
    @ApiProperty({ example: 'Daniel Henao' })
    @IsString()
    @MinLength(2)
    @MaxLength(80)
    name: string;

    @ApiProperty({ example: 'daniel@test.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'Password123', minLength: 8 })
    @IsString()
    @MinLength(8)
    @MaxLength(64)
    @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
        message: 'La contraseña debe tener al menos una mayúscula y un número',
    })
    password: string;
}