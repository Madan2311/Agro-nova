import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto'; // ajusta la ruta a la tuya
import { SORT_KEYS, STOCK_FILTERS } from '../products.constants';

export class QueryProductsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Busca por nombre o SKU' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(({ obj, key }) => {
    const raw = obj[key];
    return raw === 'true' ? true : raw === 'false' ? false : raw;
  })
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ enum: STOCK_FILTERS })
  @IsOptional()
  @IsIn(STOCK_FILTERS)
  stock?: (typeof STOCK_FILTERS)[number];

  @ApiPropertyOptional({ enum: SORT_KEYS })
  @IsOptional()
  @IsIn(SORT_KEYS)
  sort?: (typeof SORT_KEYS)[number];
}