declare namespace NodeJS {
  interface ProcessEnv {
    BOT_TOKEN: string;
    MODERATORS_CHAT_ID: number;
    TYPEORM_HOST: string;
    TYPEORM_USER: string;
    TYPEORM_PASS: string;
    TYPEORM_DB: string;
    TYPEORM_PORT: number;
  }
}
