const express = require("express");
const router = express.Router();

/**
 * GET /api/i18n/test
 * Sanity-check endpoint to confirm the active locale.
 * Test with:
 *   curl -H "Accept-Language: si" http://localhost:5000/api/i18n/test
 *   curl http://localhost:5000/api/i18n/test?lang=ta
 */
router.get("/test", (req, res) => {
    res.status(200).json({
        ok: true,
        message: res.__("common.success"),
        locale: req.locale
    });
});

module.exports = router;
