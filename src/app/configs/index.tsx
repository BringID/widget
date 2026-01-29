const EXTENSION_ID = 'fjlmbkpfjmbjokokgmfcijlliceljbeh';
const ZUPLO_API_KEY = process.env.NEXT_PUBLIC_ZUPLO_API_KEY;
const ZUPLO_API_URL = 'https://api.bringid.org';
const TELEGRAM_URL = 'https://t.me/bringid_chat';
const AUTH_DOMAIN = 'https://auth.bringid.org';
const BRINGID_URL = 'https://bringid.org'
const PLAUSIBLE_DOMAIN = 'widget.bringid.org'
const TASK_PENDING_TIME = process.env.NEXT_PUBLIC_TASK_PENDING_TIME

export default {
  EXTENSION_ID,
  ZUPLO_API_KEY,
  TELEGRAM_URL,
  ZUPLO_API_URL,
  AUTH_DOMAIN,
  BRINGID_URL,
  PLAUSIBLE_DOMAIN,
  TASK_PENDING_TIME
};
