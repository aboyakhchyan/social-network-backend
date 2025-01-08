const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const paths = require('../helpers/paths')
const helper = require('../helpers/utils')
const middleware = require('../middelwares')
const Config = require('../helpers/config')
const router = express.Router()

router.post('/users/register', middleware.validateRegister, async (req, res) => {
    const users = helper.getData(paths.usersPathFilename)
    const user = req.body

    const newPassword = await bcrypt.hash(user.password, 10)

    const newUser = {
        ...user,
        password: newPassword,
        id: Date.now()
    }

    users.push(newUser)
    helper.setData(paths.usersPathFilename, users)


    res.status(201).json({message: 'The user has successfully registered.'})
})

router.post('/users/login', middleware.validateLogin, (req, res) => {
    const user = req.user

    const token = jwt.sign(
        {
            id: user.id,
            username: user.username,
            email: user.email,
            bio: user.bio
        },
        Config.jwt_secret,
        {
            expiresIn: '1h'
        }
    )

    res.status(201).json({message: 'user successfully logged in profile', payload: token})
})

router.get('/users/:id', middleware.authenticationUser, (req, res) => {
    let posts = helper.getData(paths.postsPathFilename)
    const users = helper.getData(paths.usersPathFilename)
    const {id} = req.params
    const user = users.find(client => client.id == id)

    posts = posts.filter(post => post.author == user.username)

    if(!user) {
        return res.status(400).json({message: 'User not found'})
    }
    const {username, email, bio} = user

    res.status(200).json({id, username, email, bio, posts: posts})
})

router.put('/users/:id', middleware.authenticationUser, async(req, res) => {
    let users = helper.getData(paths.usersPathFilename)
    const data = req.body
    const {id} = req.params

    const check = users.some(client => (client.username == data.username || client.email == data.email) && client.id != id)

    if(check) {
        return res.status(400).json({message: 'data is busy'})
    }

    const newPassword = await bcrypt.hash(data.password, 10)

    users = users.map(user => {
        if(user.id == id) {
            return {
                ...data,
                password: newPassword,
                id: Number(id)
            }
        }
        return user
    })

    helper.setData(paths.usersPathFilename, users)

    res.status(200).json({message: 'data has been changed'})
})

module.exports = router