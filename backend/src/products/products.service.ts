import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { escapeRegex } from '../common/utils/escape-regex';
import { QueryProductsDto } from './dto/query-products';
import { LOW_STOCK_THRESHOLD, SORT_KEYS } from './products.constants';

const SORTS: Record<(typeof SORT_KEYS)[number], Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  name_asc: { name: 1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  stock_asc: { stock: 1 },
};

@Injectable()
export class ProductsService {

  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>
  ) { }

  async create(createProductDto: CreateProductDto, userId: string) {
    await this.validateSkuIsAvailable(createProductDto.sku);

    try {
      const product = await this.productModel.create({ ...createProductDto, createdBy: userId });
      return product;
    } catch (error: any) {
      this.handleExceptions(error);
    }

  }

  async findAll(query: QueryProductsDto) {
    const { page = 1, limit = 10, search, category, active, stock, sort = 'newest' } = query;

    const filter: Record<string, any> = {};

    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ name: regex }, { sku: regex }];
    }

    if (category) filter.category = category;
    if (active !== undefined) filter.active = active;
    if (stock === 'out') filter.stock = { $lte: 0 };
    if (stock === 'low') filter.stock = { $gt: 0, $lte: LOW_STOCK_THRESHOLD };
    if (stock === 'ok') filter.stock = { $gt: LOW_STOCK_THRESHOLD };
    
    const [data, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort({ ...SORTS[sort], _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    let product: Product | null = null;

    if (!id) throw new BadRequestException(`Product id must be provided`);

    product = await this.productModel.findOne({ _id: id });

    if (!product) throw new NotFoundException(`Product with id ${id} not found`);
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto, userId: string) {
    if (Object.keys(updateProductDto).length === 0) {
      throw new BadRequestException('At least one field must be provided to update the product');
    }

    const existingProduct = await this.productModel.findById(id);
    if (!existingProduct) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    if (updateProductDto.sku !== undefined) {
      await this.validateSkuIsAvailable(updateProductDto.sku, id);
    }

    let product: Product | null;
    try {
      product = await this.productModel.findByIdAndUpdate(
        id,
        { ...updateProductDto, updatedAt: new Date(), updatedBy: userId },
        { returnDocument: 'after', runValidators: true },
      );
    } catch (error: any) {
      this.handleExceptions(error);
    }

    if (!product) throw new NotFoundException(`Product with id ${id} not found`);
    return product;
  }

  async remove(id: string) {
    const product = await this.productModel.findByIdAndDelete(id);
    if (!product) throw new NotFoundException(`Product with id ${id} not found`);
    return product;
  }

  private handleExceptions(error: any): never {
    if (error.code === 11000) {
      throw new BadRequestException(`Product exists in db ${JSON.stringify(error.keyValue)}`)
    }
    console.log(error)
    throw new InternalServerErrorException(`Can't save Product - Check server logs`)
  }

  private async validateSkuIsAvailable(sku: string, excludedProductId?: string) {
    const filter = excludedProductId
      ? { sku, _id: { $ne: excludedProductId } }
      : { sku };

    const existingProduct = await this.productModel.exists(filter);
    if (existingProduct) {
      throw new ConflictException(`Product with SKU ${sku} already exists`);
    }
  }
}
