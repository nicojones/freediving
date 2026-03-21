/** Gemini model used for audio transcription */
export const GEMINI_TRANSCRIPTION_MODEL = 'gemini-3-flash-preview';

/** App display name */
export const APP_NAME = 'Fishly';

/** Creator attribution label for public plans (e.g. "By Fishly") */
export const CREATED_BY = (name: string | undefined): string => `By ${name ?? APP_NAME}`;

/** App tagline / description */
export const APP_DESCR = 'Breathhold Protocol';

/** Fallback plan name when plan metadata is missing */
export const DEFAULT_PLAN_NAME = 'CO2 Tolerance';
/** Fallback plan ID when no active plan stored */
export const DEFAULT_PLAN_ID = 'default';

/** Plan IDs not user-deletable, not creatable via API (default is now in DB but reserved) */
export const BUNDLED_PLAN_IDS: readonly string[] = ['default'];
/** Fallback username when user object missing */
export const DEFAULT_USERNAME = 'Unknown';

/** Default description for rest days */
export const REST_DAY_DESCRIPTION = 'Recovery and light activity';
