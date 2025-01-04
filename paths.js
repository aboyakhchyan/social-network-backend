const path = require('node:path')

const usersPathFilename = path.resolve(__dirname, 'data/users.json')
const likesPathFilename = path.resolve(__dirname, 'data/likes.json')
const postsPathFilename = path.resolve(__dirname, 'data/posts.json')
const commentsPathFilename = path.resolve(__dirname, 'data/comments.json')
const logsPathFilename = path.resolve(__dirname, 'data/logs.json')


module.exports = {
    usersPathFilename,
    likesPathFilename,
    postsPathFilename,
    commentsPathFilename,
    logsPathFilename
}