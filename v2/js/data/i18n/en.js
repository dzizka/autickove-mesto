// The English dictionary (part 19): every player text by its Slovak wording. Data only.

import { EN_UI } from "./en-ui.js";
import { EN_DATA } from "./en-data.js";
import { EN_GAMES } from "./en-games.js";
import { EN_HELP } from "./en-help.js";

export const EN = { ...EN_DATA, ...EN_UI, ...EN_GAMES, ...EN_HELP };
