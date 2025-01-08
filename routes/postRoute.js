const express = require('express')
const middleware = require('../middelwares')
const paths = require('../helpers/paths')
const helper = require('../helpers/utils')
const {nanoid} = require('nanoid')
const router = express.Router()

router.post('/posts', middleware.authenticationUser, (req, res) => {
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

router.get('/posts', middleware.authenticationUser, (req, res) => {
    let likes = helper.getData(paths.likesPathFilename)
    let comments = helper.getData(paths.commentsPathFilename)
    const posts = helper.getData(paths.postsPathFilename)
    const {author} = req.query


    let filteredPosts = posts

    if(author) {
        filteredPosts = filteredPosts.filter(post => post.author.toLowerCase() === author.toLocaleLowerCase())
    }

    filteredPosts = filteredPosts.map(post => {
        likes = likes.filter(like => like.post_id == post.id)
        comments = comments.filter(comment => comment.post_id == post.id)

        return {
            ...post,
            likes,
            comments
        }
    })


    res.status(200).json(filteredPosts)
})

router.get('/posts/:id', middleware.authenticationUser, (req, res) => {
    let likes = helper.getData(paths.likesPathFilename)
    let comments = helper.getData(paths.commentsPathFilename)
    const posts = helper.getData(paths.postsPathFilename)
    const {id} = req.params

    let result = posts.find(post => post.id == id)

    likes = likes.filter(like => like.post_id == result.id)
    comments = comments.filter(comment => comment.post_id == result.id)

    result = {
        ...result,
        likes,
        comments
    }

    res.status(200).json(result)
})

router.put('/posts/:id', middleware.authenticationUser, (req, res) => {
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


router.delete('/posts/:id', middleware.authenticationUser, (req, res) => {
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

router.post('/posts/:id/like', middleware.authenticationUser, (req, res) => {
    const posts = helper.getData(paths.postsPathFilename)
    let likes = helper.getData(paths.likesPathFilename)
    const {id} = req.params
    const user = req.user

    const check = posts.some(post => post.id == id)
    if(!check) {
        return res.status(400).json({message: 'post is not found'})
    }

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

router.post('/posts/:id/comment', middleware.authenticationUser, (req, res) => {
    const posts = helper.getData(paths.postsPathFilename)
    const comments = helper.getData(paths.commentsPathFilename)
    const {id} = req.params
    const user = req.user
    const {content} = req.body

    const check = posts.some(post => post.id == id)
    if(!check) {
        return res.status(400).json({message: 'post is not found'})
    }

    if(!content.trim()) {
        return res.status(400).json({message: 'please write a comment'})
    }

    const generateId = nanoid()

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


router.get('/posts/:id/comments', (req, res) => {
    let comments = helper.getData(paths.commentsPathFilename)
    const {id} = req.params

    comments = comments.filter(comment => comment.post_id == id)

    res.status(200).json(comments)
})

module.exports = router