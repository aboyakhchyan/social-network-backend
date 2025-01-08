const express = require('express')
const middleware = require('../middelwares')
const paths = require('../helpers/paths')
const helper = require('../helpers/utils')
const router = express.Router()

router.get('/search/users', (req, res) => {
    let users = helper.getData(paths.usersPathFilename)
    const {username} = req.query

    users = users.map(({password, ...user}) => user)

    if(!username) {
        return res.status(200).json(users)
    }

    users = users.filter(user => {
        return user.username.toLowerCase().startsWith(username.toLowerCase())
    })

    res.status(200).json(users)
})

router.get('/search/posts', middleware.authenticationUser, (req, res) => {
    let posts = helper.getData(paths.postsPathFilename)
    const {title} = req.query

    if(!title) {
        return res.status(200).json(posts)
    }

    posts = posts.filter(post => {
        return post.title.toLowerCase().startsWith(title.toLowerCase())
    })

    res.status(200).json(posts)
})

module.exports = router