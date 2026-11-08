import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ProductSchema } from './entities/product.entity';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  imports:[
    MongooseModule.forFeature([{ name: 'Product', schema: ProductSchema }])
  ]
})
export class ProductsModule {}
