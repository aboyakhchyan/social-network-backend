require('dotenv').config()

class Config {
    static port = process.env.PORT || 3001
    static host = process.env.HOST || 'localhost'
    static jwt_secret = process.env.JWT_SECRET
}

module.exports = Config