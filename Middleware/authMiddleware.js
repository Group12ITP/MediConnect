// Mock Authentication Middleware
// In a real app, this would verify a JWT token

exports.protect = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        // Mocking user based on headers for testing purposes if no token provided
        // This allows testing via Postman by just setting 'x-role' and 'x-user-id'
        if (req.headers['x-role']) {
            req.user = {
                id: req.headers['x-user-id'] || 'mock_user_id',
                role: req.headers['x-role'].toUpperCase()
            };
            return next();
        }

        return res.status(401).json({
            ok: false,
            message: res.__('auth.unauthorized'),
            locale: req.locale
        });
    }

    // Mock decoding logic
    try {
        // const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // req.user = await User.findById(decoded.id);

        // For now, accept any token and mock a user
        req.user = {
            id: 'mock_user_id_from_token',
            role: 'PATIENT' // Default
        };
        next();
    } catch (err) {
        return res.status(401).json({
            ok: false,
            message: res.__('auth.unauthorized'),
            locale: req.locale
        });
    }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                ok: false,
                message: res.__('auth.forbidden'),
                locale: req.locale
            });
        }
        next();
    };
};
