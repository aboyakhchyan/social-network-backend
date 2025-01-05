const helper = require('./helper')
const paths = require('./paths')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const loggingMiddleware = (req, res, next) => {
    const logs = helper.getData(paths.logsPathFilename)
    const url = req.url
    const method = req.method

    const text = `timestamp: ${new Date().toISOString()} method: ${method} URL: ${url}`
    logs.push(text)

    helper.setData(paths.logsPathFilename, logs)

    next()
}

const validateRegister = (req, res, next) => {
    const users = helper.getData(paths.usersPathFilename)
    const user = req.body
    const {username, email, password} = user

    if(!username.trim() || !email.trim() || !password.trim()) {
        return res.status(400).json({message: 'please field all properites'})
    }

    if(username.length < 3) {
        return res.status(400).json({message: 'username must have at least three characters'})
    }

    if(password.length < 6) {
        return res.status(400).json({message: 'password must have at least six characters'})
    }

    const result = users.some(client => (client.username == user.username) || (client.email == user.email))

    if(result) {
        return res.status(400).json({message: 'wrong credentials...'})
    }

    next()
}

const validateLogin = async (req, res, next) => {
    const users = helper.getData(paths.usersPathFilename)
    const user = req.body
    const {username, password} = user

    if(!username.trim() || !password.trim()) {
        return res.status(400).json({message: 'please field all properites'})
    }

    const result = users.find(client => client.username == user.username)

    if(!result) {
        return res.status(400).json({message: 'the entered data is incorrect'})
    }

    const resultPassword = await bcrypt.compare(password, result.password)
    
    if(!resultPassword) {
        return res.status(400).json({message: 'the entered data is incorrect'})
    }

    req.user = result

    next()
}

const authenticationUser = (req, res, next) => {
    try {
        const auth = req.headers['authorization']
        const [tag, token] = auth.split(' ')

        try {
            const user = jwt.verify(token, process.env.JWT_SECRET)
            req.user = user
        }catch (err) {
            return res.status(401).json({message: 'Invalid token'})
        }
    }catch (err) {
        return res.status(401).json({message: 'The user is not verified'})
    }
    
    next()
}


module.exports = {
    validateRegister,
    validateLogin,
    loggingMiddleware,
    authenticationUser
}