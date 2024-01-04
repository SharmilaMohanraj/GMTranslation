class Validator {
    
    isAlphaNum(pValue: any) {
        const exp = new RegExp(/^([a-zA-Z0-9 _-]+)$/);
        if (exp.test(pValue)) {
            return true;
        }
        return false;
    }
    isOnlyNumber(pValue: any) {
        const exp = new RegExp(/^\d+$/);
        if (exp.test(pValue)) {
            return true;
        }
        return false;
    }
    isNotUndefinedAndNull(pValue: any) {
        let value = pValue;
        if (typeof value === 'string') {
            value = pValue.trim();
        }
        if (value !== undefined && value !== null && value !== '' && value !== 'null' && value !== 'undefined') {
            return true;
        }
        return false;
    }
    isNullOrUndefined(pValue: any) {
        // if (pValue === undefined || pValue === null || pValue.trim() === '') {
        if (pValue === undefined || pValue === null || (typeof pValue === 'string' && pValue.trim() === '') || pValue === 'null' || pValue === 'undefined') {
            return true;
        }
        return false;
    }
    isArrayEmpty(pValue: any) {
        if (!pValue || !Array.isArray(pValue) || pValue.length === 0) {
            return true;
        }
        return false;
    }
    isJson(str): any {
        try {
            JSON.parse(str);
        } catch (error) {
            return false;            
        }
        return true;
     }
}

export default new Validator();