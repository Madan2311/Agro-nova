import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Connection } from 'mongoose';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

describe('Auth + Products (e2e)', () => {
    let app: INestApplication;
    let connection: Connection;
    let userToken: string;
    let adminToken: string;
    let productId: string;

    const user = { name: 'Usuario Test', email: 'user@test.com', password: 'Password123' };
    const product = {
        name: 'Fertilizante Triple 15',
        sku: 'FERT-001',
        price: 125000,
        stock: 80,
        category: 'Fertilizantes',
    };

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
            .overrideGuard(ThrottlerGuard)
            .useValue({ canActivate: () => true })
            .compile();

        connection = moduleRef.get<Connection>(getConnectionToken());
        await connection.dropDatabase();

        app = moduleRef.createNestApplication();

        configureApp(app);

        await app.init();
    });

    describe('Autenticación', () => {
        it('registra un usuario y no devuelve la contraseña', async () => {
            const res = await request(app.getHttpServer()).post('/auth/register').send(user).expect(201);
            expect(res.body.email).toBe(user.email);
            expect(res.body.password).toBeUndefined();
        });

        it('rechaza el registro con "role" en el body (escalada de privilegios)', () =>
            request(app.getHttpServer())
                .post('/auth/register')
                .send({ ...user, email: 'otro@test.com', role: 'admin' })
                .expect(400));

        it('rechaza un correo duplicado', () =>
            request(app.getHttpServer()).post('/auth/register').send(user).expect(409));

        it('rechaza credenciales incorrectas', () =>
            request(app.getHttpServer())
                .post('/auth/login')
                .send({ email: user.email, password: 'incorrecta' })
                .expect(401));

        it('hace login y devuelve el token (usuario y admin)', async () => {
            const u = await request(app.getHttpServer())
                .post('/auth/login')
                .send({ email: user.email, password: user.password })
                .expect(200);
            userToken = u.body.access_token;
            expect(userToken).toBeDefined();

            const a = await request(app.getHttpServer())
                .post('/auth/login')
                .send({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD })
                .expect(200);
            adminToken = a.body.access_token;
            expect(a.body.user.role).toBe('admin');
        });
    });

    describe('Protección con JWT', () => {
        it('401 sin token', () => request(app.getHttpServer()).get('/products').expect(401));

        it('401 con token alterado', () =>
            request(app.getHttpServer())
                .get('/products')
                .set('Authorization', `Bearer ${userToken}x`)
                .expect(401));
    });

    describe('CRUD de productos', () => {
        const auth = () => ({ Authorization: `Bearer ${userToken}` });

        it('crea un producto', async () => {
            const res = await request(app.getHttpServer())
                .post('/products').set(auth()).send(product).expect(201);
            productId = res.body.id;
            expect(productId).toMatch(/^[0-9a-f-]{36}$/);   // UUID
            expect(res.body._id).toBeUndefined();
        });

        it('rechaza SKU duplicado', () =>
            request(app.getHttpServer()).post('/products').set(auth()).send(product).expect(409));

        it('rechaza datos inválidos (precio negativo)', () =>
            request(app.getHttpServer())
                .post('/products').set(auth())
                .send({ ...product, sku: 'X-1', price: -5 })
                .expect(400));

        it('lista con paginación', async () => {
            const res = await request(app.getHttpServer())
                .get('/products?page=1&limit=5').set(auth()).expect(200);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.meta).toMatchObject({ total: 1, page: 1, limit: 5, totalPages: 1 });
        });

        it('filtra por texto, categoría y stock', async () => {
            const get = (q: string) => request(app.getHttpServer()).get(`/products?${q}`).set(auth());

            expect((await get('search=triple').expect(200)).body.meta.total).toBe(1);
            expect((await get('search=zzzz').expect(200)).body.meta.total).toBe(0);
            expect((await get('category=Fertilizantes').expect(200)).body.meta.total).toBe(1);
            expect((await get('category=Semillas').expect(200)).body.meta.total).toBe(0);
            expect((await get('stock=ok').expect(200)).body.meta.total).toBe(1);
            expect((await get('stock=low').expect(200)).body.meta.total).toBe(0);
        });

        it('rechaza un orden que no existe', () =>
            request(app.getHttpServer()).get('/products?sort=password').set(auth()).expect(400));

        it('obtiene un producto por id', async () => {
            const res = await request(app.getHttpServer())
                .get(`/products/${productId}`).set(auth()).expect(200);
            expect(res.body.sku).toBe(product.sku);
        });

        it('400 con un id que no es UUID y 404 con uno inexistente', async () => {
            await request(app.getHttpServer()).get('/products/123').set(auth()).expect(400);
            await request(app.getHttpServer())
                .get('/products/3b241101-e2bb-4255-8caf-4136c566a962').set(auth()).expect(404);
        });

        it('actualiza un producto', async () => {
            const res = await request(app.getHttpServer())
                .patch(`/products/${productId}`).set(auth()).send({ price: 130000 }).expect(200);
            expect(res.body.price).toBe(130000);
        });
    });

    describe('Estado activo/inactivo', () => {
        const auth = () => ({ Authorization: `Bearer ${userToken}` });
        const get = (q: string) => request(app.getHttpServer()).get(`/products?${q}`).set(auth());

        it('crea un producto inactivo y lo encuentra con el filtro de estado', async () => {
            await request(app.getHttpServer())
                .post('/products')
                .set(auth())
                .send({ ...product, sku: 'ACT-1', name: 'Producto activo' })
                .expect(201);
            const inactive = await request(app.getHttpServer())
                .post('/products')
                .set(auth())
                .send({ ...product, sku: 'INACT-1', name: 'Producto inactivo', active: false })
                .expect(201);

            expect(inactive.body.active).toBe(false);

            const onlyInactive = await get('active=false').expect(200);
            expect(onlyInactive.body.meta.total).toBe(1);
            expect(onlyInactive.body.data[0].sku).toBe('INACT-1');

            const onlyActive = await get('active=true').expect(200);
            expect(onlyActive.body.meta.total).toBe(1);
            expect(onlyActive.body.data[0].sku).toBe('ACT-1');
        });

        it('reactiva un producto con PATCH', async () => {
            const list = await get('active=false').expect(200);
            const id = list.body.data[0].id;

            const res = await request(app.getHttpServer())
                .patch(`/products/${id}`)
                .set(auth())
                .send({ active: true })
                .expect(200);

            expect(res.body.active).toBe(true);
        });
    });

    describe('Autorización por rol', () => {
        it('403: un usuario normal no puede eliminar', () =>
            request(app.getHttpServer())
                .delete(`/products/${productId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403));

        it('200: un admin sí puede eliminar', () =>
            request(app.getHttpServer())
                .delete(`/products/${productId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200));

        it('el producto ya no existe', () =>
            request(app.getHttpServer())
                .get(`/products/${productId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404));
    });
});