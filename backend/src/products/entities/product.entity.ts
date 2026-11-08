import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({
    timestamps: true,
    versionKey: false,
    toJSON: {
        transform: (_doc: any, ret: any) => {
            ret.id = ret._id;
            delete ret._id;
            return ret;
        },
    },
})

export class Product {

    @Prop({ type: String, default: () => randomUUID() })
    _id: string;

    @Prop({ required: true, index: true })
    name: string;

    @Prop()
    description?: string;

    @Prop({ required: true })
    price: number;

    @Prop({ required: true, unique: true, index: true })
    sku: string;

    @Prop({ required: true })
    stock: number;

    @Prop({ required: true, index: true })
    category: string;

    @Prop()
    imageUrl?: string;

    @Prop({ default: true })
    active: boolean;

    @Prop({ type: String, ref: 'User' })
    createdBy?: string;

    @Prop({ type: String, ref: 'User' })
    updatedBy?: string;

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ default: Date.now })
    updatedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
