import Validator from "./Validator";
import * as translate from "@google-cloud/translate";

const Translate  = translate.v2.Translate;
const TranslationServiceClient  = translate.TranslationServiceClient;

export class GoogleTranslate {

    public async translationLocale(pText: any, pTarget: string): Promise<any> {
        try {
            let configJson = global.appConfig["GM_CONTENT_GOOGLE_TRANSLATE_CREDENTIALS"];
            configJson = JSON.parse(configJson);
            const projectId = configJson.project_id;
            const translate = new Translate({ projectId: projectId, credentials: configJson });
            const translatePromises: any = [];
            let translations: any = [];
            let promiseResponse: any;
            if (Array.isArray(pText) && !Validator.isArrayEmpty(pText) && pText.length > 100) {
                for (let i = 0, j = pText.length; i < j; i = i + 100) {
                    const chunkTexts = pText.slice(i, i + 100);
                    translatePromises.push(translate.translate(chunkTexts, pTarget));
                }
                promiseResponse = await Promise.all(translatePromises);
                if (Array.isArray(promiseResponse) && !Validator.isArrayEmpty(promiseResponse)) {
                    for (const pItem of promiseResponse) {
                        translations.push(...pItem[0]);
                    }
                }
            } else {
                translatePromises.push(translate.translate(pText, pTarget));
                promiseResponse = await Promise.all(translatePromises);
                [translations] = promiseResponse[0];
            }
            translations = (Validator.isNotUndefinedAndNull(translations) && Array.isArray(translations)) ? translations : [translations];
            return ({ error: null, data: translations, locale: pTarget });
        } catch (error) {
            console.log("GoogleTranslate-> translateLocale-> err", error);
            return { error, data: null, locale: pTarget };
        }
    }

    // Create a glossary resource
    public async createGlossary(pLanguageCodes: any, pGlossaryFileName: string): Promise<any> {
        // Construct glossary
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

        // Create glossary using a long-running operation
        const [operation] = await translate.createGlossary({
            parent: `projects/${configJson.project_id}/locations/${location}`,
            glossary: glossary,
        });
        // Wait for the operation to complete
        await operation.promise();
        console.log("Created glossary:");
        console.log(`InputUri ${glossary.inputConfig.gcsSource.inputUri}`);
    }


    // Instantiates a client
    public async translateTextWithGlossary(pText: any, pSource: string, pTarget: string): Promise<any> {
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
            mimeType: 'text/plain', // mime types: text/plain, text/html
            sourceLanguageCode: pSource,
            targetLanguageCode: pTarget,
            glossaryConfig: glossaryConfig,
        };
        // const request = {};
        const textArray = Array.isArray(pText) ? pText : [pText];
        // Run request
        // console.log('textArray', JSON.stringify(textArray));
        console.log('translateTextWithGlossary:textArray:', textArray.length);
        const translations: any = [];
        if (Array.isArray(textArray) && !Validator.isArrayEmpty(textArray) && textArray.length > 0) {
            console.log('translateTextWithGlossary:textArray:first item before translation:', textArray[0]);
            console.log('translateTextWithGlossary:textArray:last item before translation:', textArray[textArray.length - 1]);
            for (let i = 0, j = textArray.length; i < j; i = i + 100) {
                const chunkTexts = textArray.slice(i, i + 100);
                try {
                    console.log('translateTextWithGlossary:translateText:chunkTexts:sent:', chunkTexts.length);
                    const translationResult: any = await translate.translateText({ ...request, contents: chunkTexts });
                    // const translationResult: any = await this.translateGlossaryAsDummy({ ...request, contents: chunkTexts }, pTarget);
                    if (translationResult && translationResult[0] && translationResult[0].glossaryTranslations) {
                        console.log('translateTextWithGlossary:translateText:chunkTexts:received:', translationResult[0].glossaryTranslations.length);
                        translationResult[0].glossaryTranslations.forEach((item: any) => {
                            translations.push(item.translatedText);
                        });
                    }
                } catch (error) {
                    console.log('translateTextWithGlossary:translateText:error:', error);
                    return { error, data: null, locale: pTarget };
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

    public translateLocaleAsDummy(pText: any, pTo: string): any {
        return new Promise((resolve: any) => {
            const items: any = [];
            pText.forEach((item: any) => items.push(`${item}__${pTo}`));
            resolve(items);
        });
    }

    public translateGlossaryAsDummy(request: any, pLocale: string): any {
        const data : any = [];
        return new Promise((resolve: any) => {
            setTimeout(() => {
                const glossaryTranslations: any = [];
                request.contents.forEach((content: any) => glossaryTranslations.push({ translatedText: `${content}_${pLocale}` }));
                data.push({ glossaryTranslations });
                resolve(data);
            }, 100);
        });
    }
}
