import { Module } from '@nestjs/common';
import * as LocalSession from 'telegraf-session-local';
import * as https from 'node:https';
import { BidModule } from './bid/bid.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppUpdate } from './app.update';

const sessions = new LocalSession();

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        token: configService.get<string>('BOT_TOKEN'),
        middlewares: [sessions.middleware()],
        options: {
          handlerTimeout: 9_000_000 /*ms*/,
          telegram: {
            agent: new https.Agent({
              keepAlive: false,
            }),
          },
        },
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('TYPEORM_HOST'),
        username: configService.get('TYPEORM_USER'),
        password: configService.get('TYPEORM_PASS'),
        database: configService.get('TYPEORM_DB'),
        port: configService.get('TYPEORM_PORT'),
        entities: [__dirname + 'dist/**/*.entity.{ts,js}'],
        synchronize: true,
        autoLoadEntities: true,
      }),
    }),
    AppUpdate,
    BidModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
