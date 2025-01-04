const fs = require('node:fs')

const getData = (filename) => {
    try {
        return JSON.parse(fs.readFileSync(filename, 'utf-8'))
    }catch (err) {
        return null
    }
}

const setData = (filename, data) => {
    return fs.writeFileSync(filename, JSON.stringify(data, null, 2))
}

module.exports = {
    getData,
    setData
}