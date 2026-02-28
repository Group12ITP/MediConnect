/**
 * i18n Middleware
 * Detects the desired locale from Accept-Language header or ?lang query param.
 * Falls back to "en" for unsupported locales.
 */

const SUPPORTED_LOCALES = ["en", "si", "ta"];

module.exports = (req, res, next) => {
    let locale = "en"; // default

    // 1. Try Accept-Language header (e.g. "si-LK,si;q=0.9,en;q=0.8" -> "si")
    const acceptLang = req.headers["accept-language"];
    if (acceptLang) {
        // Take only the very first language tag and strip region/variant
        const primary = acceptLang.split(",")[0].trim().split("-")[0].trim().toLowerCase();
        if (SUPPORTED_LOCALES.includes(primary)) {
            locale = primary;
        }
    }

    // 2. Query param ?lang=si overrides header (useful for testing)
    if (req.query.lang && SUPPORTED_LOCALES.includes(req.query.lang)) {
        locale = req.query.lang;
    }

    // 3. Apply locale to the request
    req.setLocale(locale);
    req.locale = locale;

    next();
};
