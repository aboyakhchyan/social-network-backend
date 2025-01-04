const express = require('express')
const middleware = require('./middelware')
const paths = require('./paths')
const helper = require('./helper')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const app = express()
require('dotenv').config()

const PORT = process.env.PORT

app.use(express.json())


app.post('/users/register', middleware.validateRegister, async (req, res) => {
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

app.post('/users/login', middleware.validateLogin, (req, res) => {
    const user = req.user

    const token = jwt.sign(
        {
            id: user.id,
            username: user.username,
            email: user.email,
            bio: user.bio
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '1h'
        }
    )

    res.status(201).json({message: 'user successfully logged in profile', payload: token})
})

app.get('/users/:id', middleware.authenticationUser, (req, res) => {
    const users = helper.getData(paths.usersPathFilename)
    const {id} = req.params

    const user = users.find(client => client.id == id)

    if(!user) {
        return res.status(400).json({message: 'User not found'})
    }
    const {username, email, bio} = user

    res.status(200).json({id, username, email, bio})
})

app.put('/users/:id', middleware.authenticationUser, async(req, res) => {
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

app.post('/posts', middleware.authenticationUser, (req, res) => {
    const posts = helper.getData(paths.postsPathFilename)
    const user = req.user
    const {title, content} = req.body
    
    if(!title.trim() || !content.trim()) {
        return res.status(400).json({message: 'please field all properties'})
    }

    const generateId = Math.random().toString(36).substring(2, 12)

    const post = {
        id: generateId,
        title,
        content,
        timestamp: new Date().toISOString(),
        author: user.username
    }

    posts.push(post)
    helper.setData(paths.postsPathFilename, posts)

    res.status(201).json({message: 'post created is successfully'})
})

app.get('/posts', middleware.authenticationUser, (req, res) => {
    const posts = helper.getData(paths.postsPathFilename)
    const {author} = req.query

    let filteredPosts = posts

    if(author) {
        filteredPosts = filteredPosts.filter(post => post.author.toLowerCase() === author.toLocaleLowerCase())
    }


    res.status(200).json(filteredPosts)
})

app.get('/posts/:id', middleware.authenticationUser, (req, res) => {
    const posts = helper.getData(paths.postsPathFilename)
    const {id} = req.params

    const result = posts.find(post => post.id == id)

    res.status(200).json(result)
})

app.put('/posts/:id', middleware.authenticationUser, (req, res) => {
    let posts = helper.getData(paths.postsPathFilename)
    const data = req.body
    const {title, content} = data
    const {id} = req.params
    const user = req.user

    const post = posts.find(post => post.id == id)
    
    if(post.author !== user.username) {
        return res.status(400).json({message: 'You do not have permission to post this post'})
    }

    posts = posts.map(post => {
        if(post.id == id) {
            return {
                ...post,
                title: title,
                content: content
            }
        }

        return post
    })

    helper.setData(paths.postsPathFilename, posts)
    res.status(200).json({message: 'post changed is successfully'})
})


app.delete('/posts/:id', middleware.authenticationUser, (req, res) => {
    let posts = helper.getData(paths.postsPathFilename)
    const {id} = req.params
    const user = req.user

    const post = posts.find(post => post.id == id)

    if(post.author !== user.username) {
        return res.status(400).json({message: 'You do not have permission to post this post'})
    }

    posts = posts.filter(post => post.id != id)
    helper.setData(paths.postsPathFilename, posts)
    res.status(200).json({message: 'post removed is successfully'})
})

app.post('/posts/:id/like', middleware.authenticationUser, (req, res) => {
    let likes = helper.getData(paths.likesPathFilename)
    const {id} = req.params
    const user = req.user

    const result = likes.some(like => like.post_id == id && like.author == user.username)

    if(result) {
        likes = likes.filter(like => like.post_id != id)
        helper.setData(paths.likesPathFilename, likes)
        return res.status(200).json({message: 'like removed is successfully'})
    }

    const generateId = Math.random().toString(36).substring(2, 12)

    const like = {
        id: generateId,
        post_id: id,
        author: user.username
    }

    likes.push(like)
    helper.setData(paths.likesPathFilename, likes)
    res.status(201).json({message: 'like added is successfully'})
})

app.post('/posts/:id/comment', middleware.authenticationUser, (req, res) => {
    const comments = helper.getData(paths.commentsPathFilename)
    const {id} = req.params
    const user = req.user
    const {content} = req.body

    if(!content.trim()) {
        return res.status(400).json({message: 'please write a comment'})
    }

    const generateId = Math.random().toString(36).substring(2, 12) 

    const comment = {
        id: generateId,
        content: content,
        author: user.username,
        post_id: id,
        timestamp: new Date().toISOString()
    }

    comments.push(comment)
    helper.setData(paths.commentsPathFilename, comments)
    res.status(200).json({message: 'comment sent is successfully'})
})


app.get('/posts/:id/comments', (req, res) => {
    let comments = helper.getData(paths.commentsPathFilename)
    const {id} = req.params

    comments = comments.filter(comment => comment.post_id == id)

    res.status(200).json(comments)
})

app.get('/search/users', (req, res) => {
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

app.get('/search/posts', middleware.authenticationUser, (req, res) => {
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

app.listen(PORT, () => {
    console.log('server is runing...')
})