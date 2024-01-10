"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleTranslate = void 0;
const common_1 = require("@nestjs/common");
const Validator_1 = require("./Validator");
const translate = require("@google-cloud/translate");
const Translate = translate.v2.Translate;
const TranslationServiceClient = translate.TranslationServiceClient;
let GoogleTranslate = class GoogleTranslate {
    async translationLocale(pText, pTarget) {
        try {
            console.log('In translationLocale method');
            let configJson = global.appConfig["GM_CONTENT_GOOGLE_TRANSLATE_CREDENTIALS"];
            console.log(`configJson is: ${configJson}`);
            configJson = JSON.parse(configJson);
            const translate = new Translate({ credentials: configJson });
            const translatePromises = [];
            let translations = [];
            let promiseResponse;
            if (Array.isArray(pText) && !Validator_1.default.isArrayEmpty(pText) && pText.length > 100) {
                for (let i = 0, j = pText.length; i < j; i = i + 100) {
                    const chunkTexts = pText.slice(i, i + 100);
                    translatePromises.push(translate.translate(chunkTexts, pTarget));
                }
                promiseResponse = await Promise.all(translatePromises);
                if (Array.isArray(promiseResponse) && !Validator_1.default.isArrayEmpty(promiseResponse)) {
                    for (const pItem of promiseResponse) {
                        translations.push(...pItem[0]);
                    }
                }
            }
            else {
                translatePromises.push(translate.translate(pText, pTarget));
                promiseResponse = await Promise.all(translatePromises);
                [translations] = promiseResponse[0];
            }
            translations = (Validator_1.default.isNotUndefinedAndNull(translations) && Array.isArray(translations)) ? translations : [translations];
            return ({ error: null, data: translations, locale: pTarget });
        }
        catch (error) {
            console.log("GoogleTranslate-> translateLocale-> err", error);
            return { error, data: null, locale: pTarget };
        }
    }
    async createGlossary(pLanguageCodes, pGlossaryFileName) {
        let configJson = global.appConfig["GM_CONTENT_GOOGLE_TRANSLATE_CREDENTIALS"];
        configJson = JSON.parse(configJson);
        const projectId = configJson.project_id;
        const translate = new TranslationServiceClient({ projectId: projectId, credentials: configJson });
        const location = global.appConfig["GM_CONTENT_GOOGLE_TRANSLATE_LOCATION"];
        const glossaryId = global.appConfig["GM_CONTENT_GOOGLE_TRANSLATE_GLOSSARY_ID"];
        const bucket = global.appConfig["GM_CONTENT_GOOGLE_TRANSLATE_BUCKET"];
        const glossary = {
            languageCodesSet: {
                languageCodes: pLanguageCodes,
            },
            inputConfig: {
                gcsSource: {
                    inputUri: `gs://${bucket}/${pGlossaryFileName}`,
                },
            },
            name: `projects/${projectId}/locations/${location}/glossaries/${glossaryId}`,
        };
        const [operation] = await translate.createGlossary({
            parent: `projects/${configJson.project_id}/locations/${location}`,
            glossary: glossary,
        });
        await operation.promise();
        console.log("Created glossary:");
        console.log(`InputUri ${glossary.inputConfig.gcsSource.inputUri}`);
    }
    async translateTextWithGlossary(pText, pTarget) {
        let configJson = global.appConfig["GM_CONTENT_GOOGLE_TRANSLATE_CREDENTIALS"];
        configJson = JSON.parse(configJson);
        const projectId = configJson.project_id;
        const translate = new TranslationServiceClient({ projectId: projectId, credentials: configJson });
        const location = global.appConfig["GM_CONTENT_GOOGLE_TRANSLATE_LOCATION"];
        const glossaryId = global.appConfig["GM_CONTENT_GOOGLE_TRANSLATE_GLOSSARY_ID"];
        const glossaryConfig = {
            glossary: `projects/${projectId}/locations/${location}/glossaries/${glossaryId}`,
        };
        const request = {
            parent: `projects/${projectId}/locations/${location}`,
            contents: null,
            mimeType: 'text/plain',
            sourceLanguageCode: 'en',
            targetLanguageCode: pTarget,
            glossaryConfig: glossaryConfig,
        };
        const textArray = Array.isArray(pText) ? pText : [pText];
        console.log('translateTextWithGlossary:textArray:', textArray.length);
        const translations = [];
        if (Array.isArray(textArray) && !Validator_1.default.isArrayEmpty(textArray) && textArray.length > 0) {
            console.log('translateTextWithGlossary:textArray:first item before translation:', textArray[0]);
            console.log('translateTextWithGlossary:textArray:last item before translation:', textArray[textArray.length - 1]);
            for (let i = 0, j = textArray.length; i < j; i = i + 100) {
                const chunkTexts = textArray.slice(i, i + 100);
                try {
                    console.log('translateTextWithGlossary:translateText:chunkTexts:sent:', chunkTexts.length);
                    const translationResult = await translate.translateText({ ...request, contents: chunkTexts });
                    if (translationResult && translationResult[0] && translationResult[0].glossaryTranslations) {
                        console.log('translateTextWithGlossary:translateText:chunkTexts:received:', translationResult[0].glossaryTranslations.length);
                        translationResult[0].glossaryTranslations.forEach((item) => {
                            translations.push(item.translatedText);
                        });
                    }
                    else {
                        console.log('translateTextWithGlossary:translateText:NULL:');
                        chunkTexts.forEach((item) => {
                            translations.push(item);
                        });
                    }
                }
                catch (tError) {
                    console.log('translateTextWithGlossary:translateText:error:', tError);
                    chunkTexts.forEach((item) => {
                        translations.push(item);
                    });
                }
            }
            console.log('translateTextWithGlossary:translations:', translations.length);
            if (translations.length > 0) {
                console.log('translateTextWithGlossary:textArray:first item after translation:', translations[0]);
                console.log('translateTextWithGlossary:textArray:last item after translation:', translations[translations.length - 1]);
            }
        }
        return { error: null, data: translations, locale: pTarget };
    }
    translateLocaleAsDummy(pText, pTo) {
        return new Promise((resolve) => {
            const items = [];
            pText.forEach((item) => items.push(`${item}__${pTo}`));
            resolve(items);
        });
    }
    translateGlossaryAsDummy(request, pLocale) {
        const data = [];
        return new Promise((resolve) => {
            setTimeout(() => {
                const glossaryTranslations = [];
                request.contents.forEach((content) => glossaryTranslations.push({ translatedText: `${content}_${pLocale}` }));
                data.push({ glossaryTranslations });
                resolve(data);
            }, 100);
        });
    }
};
GoogleTranslate = __decorate([
    (0, common_1.Injectable)()
], GoogleTranslate);
exports.GoogleTranslate = GoogleTranslate;
//# sourceMappingURL=GoogleTranslate.js.map