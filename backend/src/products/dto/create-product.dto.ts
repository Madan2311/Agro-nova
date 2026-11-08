import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, MaxLength, Min } from "class-validator";

export class CreateProductDto {
    @ApiProperty({ example: 'Fertilizante Triple 15', maxLength: 100 })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;

    @ApiPropertyOptional({ example: 'Fertilizante granulado balanceado, bulto de 50 kg' })
    @IsString()
    @IsOptional()
    description: string;

    @ApiProperty({ example: 125000, minimum: 0, description: 'Precio en pesos colombianos' })
    @IsNumber()
    @Min(0)
    price: number;


    @ApiProperty({ example: 'FERT-001', description: 'Código único del producto' })
    @IsString()
    @IsNotEmpty()
    sku: string;

    @ApiProperty({ example: 80, minimum: 0, description: 'Unidades disponibles' })
    @IsNumber()
    @Min(0)
    stock: number;

    @ApiProperty({
        example: 'Fertilizantes',
        description: 'Fertilizantes, Semillas, Agroquímicos, Herramientas o Alimento Animal',
    })
    @IsString()
    @IsNotEmpty()
    category: string;

    @ApiPropertyOptional({ example: 'https://example.com/img/fert-001.jpg' })
    @IsUrl()
    @IsOptional()
    imageUrl: string;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsBoolean()
    active?: boolean;
}
