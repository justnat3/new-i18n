import { Language, Variables, Translation } from './types';

export default class I18n {
    private _languages: Map<string, Language>;
    fallback?: string;

    constructor(folder: string, languages: string[], fallback?: string) {
        // eslint-disable-next-line no-extra-parens
        if (!languages || (Array.isArray(languages) && languages.length === 0)) {
            throw new Error(`You need to add at least one language.`);
        }

        this.fallback = fallback;
        this._languages = new Map(languages.map(language => [language, require(`${folder}/${language}.json`)]));
    }

    get languages() {
        return [...this._languages.keys()];
    }

    private _fallback(language: string, keyword: string, variables: Variables = {}): Translation {
        if (this.fallback && language !== this.fallback) {
            return this.translate(this.fallback, keyword, variables);
        }

        return null;
    }

    translate(language: string, keyword: string, variables: Variables = {}): Translation {
        if (!this._languages.has(language)) {
            return this._fallback(language, keyword, variables);
        }

        const lang = this._languages.get(language);
        const keys = keyword.split(`.`);
        let value: Language | string | undefined = lang;

        for (const key of keys) {
            if (typeof value !== `object`) {
                break;
            }

            value = value[key];
        }

        if (!value || typeof value !== `string`) {
            return this._fallback(language, keyword, variables);
        }

        return value.replace(/\{{2}(.+?)\}{2}/g, (_, variable: string) => variables[variable] || variable);
    }

    private _update(oldValues: Language, newValues: Language): Language {
        const result = { ...oldValues };

        for (const key in newValues) {
            if (typeof newValues[key] === `object`) {
                // eslint-disable-next-line no-extra-parens
                const currentValue = typeof result[key] !== `object` ? {} : (result[key] as Language);
                result[key] = this._update(currentValue, newValues[key] as Language);
            } else {
                result[key] = newValues[key];
            }
        }

        return result;
    }

    update(language: string, newValues: Language) {
        if (typeof language !== `string`) {
            throw new Error(`Invalid language type: ${typeof language}`);
        } else if (typeof newValues !== `object`) {
            throw new Error(`Invalid values type: ${typeof newValues}`);
        }

        const oldValues = this._languages.get(language);
        this._languages.set(language, this._update(oldValues || {}, newValues));
    }
}